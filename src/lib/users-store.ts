import fs from "fs";
import path from "path";
import { User } from "../types";

const USERS_FILE = path.join(__dirname, "..", "data", "users.json");

export function readUsers(): User[] {
  try {
    const raw = fs.readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(raw) as User[];
  } catch {
    return [];
  }
}

export function writeUsers(users: User[]): void {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

export function findUserByEmail(email: string): User | undefined {
  const normalized = email.trim().toLowerCase();
  return readUsers().find((u) => u.email.toLowerCase() === normalized);
}

export function findUserById(id: string): User | undefined {
  return readUsers().find((u) => u.id === id);
}

export function addUser(user: User): void {
  const users = readUsers();
  users.push(user);
  writeUsers(users);
}
