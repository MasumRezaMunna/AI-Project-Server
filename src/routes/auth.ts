import { Router, Request, Response } from "express";
import { randomUUID } from "crypto";
import {
  LoginRequestBody,
  RegisterRequestBody,
  AuthResponse,
  PublicUser,
  User,
} from "../types";
import { findUserByEmail, addUser } from "../lib/users-store";
import { hashPassword, verifyPassword, signToken } from "../lib/auth";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function toPublicUser(user: User): PublicUser {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

router.post("/register", async (req: Request, res: Response) => {
  const { name, email, password } = (req.body ?? {}) as Partial<RegisterRequestBody>;

  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ error: "Name, email, and password are all required." });
  }
  if (!EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({ error: "Enter a valid email address." });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters." });
  }
  if (findUserByEmail(email)) {
    return res.status(409).json({ error: "An account with that email already exists." });
  }

  const user: User = {
    id: randomUUID(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash: await hashPassword(password),
    // Self-registration always creates a regular user — the admin account is
    // seeded separately and is never assignable from the public API.
    role: "user",
    createdAt: new Date().toISOString(),
  };
  addUser(user);

  const token = signToken({ sub: user.id, role: user.role });
  const payload: AuthResponse = { token, user: toPublicUser(user) };
  res.status(201).json(payload);
});

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = (req.body ?? {}) as Partial<LoginRequestBody>;

  if (!email?.trim() || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const user = findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: "Incorrect email or password." });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Incorrect email or password." });
  }

  const token = signToken({ sub: user.id, role: user.role });
  const payload: AuthResponse = { token, user: toPublicUser(user) };
  res.json(payload);
});

router.get("/me", requireAuth, (req: AuthedRequest, res: Response) => {
  res.json({ user: req.user });
});

export default router;
