import { Router, Response } from "express";
import UserModel from "../models/User";
import { PublicUser, SyncProfileRequestBody } from "../types";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();

function toPublicUser(profile: {
  firebaseUid: string;
  name: string;
  email: string;
  role: "user" | "admin";
}): PublicUser {
  return {
    id: profile.firebaseUid,
    name: profile.name,
    email: profile.email,
    role: profile.role,
  };
}

/**
 * POST /api/auth/register
 *
 * Called once right after the client creates a Firebase account via
 * createUserWithEmailAndPassword. Creates the matching MongoDB profile.
 * Self-registration always produces a "user"-role profile — admin accounts
 * are only ever created by the `npm run seed:demo` script.
 *
 * Requires: Authorization: Bearer <firebase-id-token>
 * Body:     { name?: string }
 */
router.post("/register", requireAuth, async (req: AuthedRequest, res: Response) => {
  if (!req.firebaseUid || !req.firebaseEmail) {
    return res.status(401).json({ error: "Invalid token." });
  }

  try {
    const existing = await UserModel.findOne({ firebaseUid: req.firebaseUid });
    if (existing) {
      // Profile already exists — treat as idempotent and return it.
      return res.status(200).json({ user: toPublicUser(existing) });
    }

    const { name } = (req.body ?? {}) as SyncProfileRequestBody;

    const profile = await UserModel.create({
      firebaseUid: req.firebaseUid,
      name: name?.trim() || req.firebaseName || req.firebaseEmail.split("@")[0],
      email: req.firebaseEmail,
      role: "user",
    });

    res.status(201).json({ user: toPublicUser(profile) });
  } catch (err) {
    console.error("[auth/register]", err);
    res.status(500).json({ error: "Failed to create user profile." });
  }
});

/**
 * GET /api/auth/me
 *
 * Returns the current user's MongoDB profile. Auto-creates one with the
 * default "user" role if it doesn't exist yet — this is the path taken by
 * Google sign-in, which goes through Firebase directly without ever calling
 * /register.
 *
 * Requires: Authorization: Bearer <firebase-id-token>
 */
router.get("/me", requireAuth, async (req: AuthedRequest, res: Response) => {
  if (!req.firebaseUid || !req.firebaseEmail) {
    return res.status(401).json({ error: "Invalid token." });
  }

  try {
    let profile = await UserModel.findOne({ firebaseUid: req.firebaseUid });

    if (!profile) {
      profile = await UserModel.create({
        firebaseUid: req.firebaseUid,
        name: req.firebaseName || req.firebaseEmail.split("@")[0],
        email: req.firebaseEmail,
        role: "user",
      });
    }

    res.json({ user: toPublicUser(profile) });
  } catch (err) {
    console.error("[auth/me]", err);
    res.status(500).json({ error: "Failed to load user profile." });
  }
});

export default router;
