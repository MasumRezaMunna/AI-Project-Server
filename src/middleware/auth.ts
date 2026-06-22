import { Request, Response, NextFunction } from "express";
import admin from "../lib/firebaseAdmin";
import UserModel from "../models/User";
import { PublicUser, UserRole } from "../types";

export interface AuthedRequest extends Request {
  /** Populated only if a matching MongoDB profile already exists. */
  user?: PublicUser;
  /** Always populated once the Firebase ID token verifies successfully. */
  firebaseUid?: string;
  firebaseEmail?: string;
  firebaseName?: string;
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    return res.status(401).json({ error: "Missing or invalid Authorization header." });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.firebaseUid = decoded.uid;
    req.firebaseEmail = decoded.email;
    req.firebaseName = typeof decoded.name === "string" ? decoded.name : undefined;

    const profile = await UserModel.findOne({ firebaseUid: decoded.uid });
    if (profile) {
      req.user = {
        id: profile.firebaseUid,
        name: profile.name,
        email: profile.email,
        role: profile.role,
      };
    }
    // If no MongoDB profile exists yet, req.user stays undefined — routes
    // that need a fully synced profile (like /me) handle that case directly.
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

/** Use after requireAuth to additionally restrict a route to a specific role. */
export function requireRole(role: UserRole) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: "Insufficient permissions for this action." });
    }
    next();
  };
}
