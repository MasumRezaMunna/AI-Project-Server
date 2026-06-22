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
  return { id: profile.firebaseUid, name: profile.name, email: profile.email, role: profile.role };
}

/**
 * Called once right after the client creates a Firebase account
 * (createUserWithEmailAndPassword). Creates the matching MongoDB profile.
 * Self-registration always creates a "user"-role profile — the admin
 * account is only ever created by the seed script.
 */
router.post("/register", requireAuth, async (req: AuthedRequest, res: Response) => {
  if (!req.firebaseUid || !req.firebaseEmail) {
    return res.status(401).json({ error: "Invalid token." });
  }

  const existing = await UserModel.findOne({ firebaseUid: req.firebaseUid });
  if (existing) {
    return res.status(409).json({ error: "A profile already exists for this account." });
  }

  const { name } = (req.body ?? {}) as SyncProfileRequestBody;

  const profile = await UserModel.create({
    firebaseUid: req.firebaseUid,
    name: name?.trim() || req.firebaseName || req.firebaseEmail.split("@")[0],
    email: req.firebaseEmail,
    role: "user",
  });

  res.status(201).json({ user: toPublicUser(profile) });
});

/**
 * Returns the current user's MongoDB profile, auto-creating one with the
 * default "user" role if it doesn't exist yet. This covers Google sign-in,
 * which signs a user into Firebase directly without ever calling /register.
 */
router.get("/me", requireAuth, async (req: AuthedRequest, res: Response) => {
  if (!req.firebaseUid || !req.firebaseEmail) {
    return res.status(401).json({ error: "Invalid token." });
  }

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
});

export default router;
