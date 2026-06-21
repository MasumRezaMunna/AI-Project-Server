import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/auth";
import { findUserById } from "../lib/users-store";
import { PublicUser, UserRole } from "../types";

export interface AuthedRequest extends Request {
  user?: PublicUser;
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    return res.status(401).json({ error: "Missing or invalid Authorization header." });
  }

  try {
    const payload = verifyToken(token);
    const user = findUserById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: "User no longer exists." });
    }
    req.user = { id: user.id, name: user.name, email: user.email, role: user.role };
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
