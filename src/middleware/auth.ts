import { Request, Response, NextFunction } from "express";
import admin from "../lib/firebaseAdmin";
import UserModel from "../models/User";
import { PublicUser, UserRole } from "../types";

export interface AuthedRequest extends Request {
  /**
   * The MongoDB profile for the signed-in user. Populated by requireAuth
   * when a profile already exists in the database.
   */
  user?: PublicUser;
  /** Firebase UID extracted from the verified ID token. */
  firebaseUid?: string;
  /** Email from the verified ID token. */
  firebaseEmail?: string;
  /** Display name from the verified ID token (may be undefined). */
  firebaseName?: string;
}

/**
 * Verifies the Firebase ID token sent as `Authorization: Bearer <token>`.
 *
 * On success, attaches req.firebaseUid / firebaseEmail / firebaseName from
 * the token, and also req.user (the MongoDB profile) if one already exists.
 * Routes that need a guaranteed profile (like /me) upsert one themselves.
 */
export async function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    return res
      .status(401)
      .json({ error: "Missing Authorization header. Expected: Bearer <firebase-id-token>" });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);

    req.firebaseUid = decoded.uid;
    req.firebaseEmail = decoded.email;
    req.firebaseName =
      typeof decoded.name === "string" && decoded.name.trim()
        ? decoded.name.trim()
        : undefined;

    // Pre-load the MongoDB profile if it exists so downstream handlers can
    // use req.user without an extra DB round-trip.
    const profile = await UserModel.findOne({ firebaseUid: decoded.uid });
    if (profile) {
      req.user = {
        id: profile.firebaseUid,
        name: profile.name,
        email: profile.email,
        role: profile.role,
      };
    }

    next();
  } catch (err) {
    // verifyIdToken throws on expired, revoked, or malformed tokens.
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

/**
 * Use after requireAuth to restrict a route to a specific role.
 * Returns 403 if the user's role doesn't match.
 */
export function requireRole(role: UserRole) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== role) {
      return res
        .status(403)
        .json({ error: "You don't have permission to access this resource." });
    }
    next();
  };
}
