import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { JwtPayload, User, UserRole } from "../types";
import { readUsers, writeUsers, findUserByEmail } from "./users-store";
import {
  DEMO_USER_EMAIL,
  DEMO_USER_PASSWORD,
  DEMO_ADMIN_EMAIL,
  DEMO_ADMIN_PASSWORD,
} from "./demoAccounts";

const SALT_ROUNDS = 10;
const JWT_EXPIRES_IN = "7d";
const JWT_SECRET = process.env.JWT_SECRET || "dev-only-demo-secret-change-me";

if (!process.env.JWT_SECRET) {
  // eslint-disable-next-line no-console
  console.warn(
    "[auth] JWT_SECRET is not set in server/.env — using an insecure default. " +
      "Fine for a local demo, do not use this default if you deploy publicly."
  );
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: { sub: string; role: UserRole }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

/**
 * Ensures the two demo accounts (User + Admin) exist with properly hashed
 * passwords. Runs once at server startup. Safe to call repeatedly — it only
 * writes when a demo account is actually missing.
 */
export async function seedDemoUsers(): Promise<void> {
  const users = readUsers();
  let changed = false;

  if (!findUserByEmail(DEMO_USER_EMAIL)) {
    const demoUser: User = {
      id: randomUUID(),
      name: "Demo User",
      email: DEMO_USER_EMAIL,
      passwordHash: await hashPassword(DEMO_USER_PASSWORD),
      role: "user",
      createdAt: new Date().toISOString(),
    };
    users.push(demoUser);
    changed = true;
  }

  if (!findUserByEmail(DEMO_ADMIN_EMAIL)) {
    const demoAdmin: User = {
      id: randomUUID(),
      name: "Demo Admin",
      email: DEMO_ADMIN_EMAIL,
      passwordHash: await hashPassword(DEMO_ADMIN_PASSWORD),
      role: "admin",
      createdAt: new Date().toISOString(),
    };
    users.push(demoAdmin);
    changed = true;
  }

  if (changed) {
    writeUsers(users);
    // eslint-disable-next-line no-console
    console.log("[auth] Seeded demo accounts (demo user + demo admin).");
  }
}
