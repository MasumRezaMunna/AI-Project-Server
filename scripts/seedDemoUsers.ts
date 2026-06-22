/**
 * Run once after setting up Firebase + MongoDB credentials in server/.env:
 *
 *   npm run seed:demo
 *
 * Creates (or updates the role of) the two demo accounts used by the
 * login page's "Demo login" buttons.
 */
import "dotenv/config";
import admin from "../src/lib/firebaseAdmin";
import { connectDB } from "../src/lib/db";
import UserModel from "../src/models/User";
import {
  DEMO_USER_EMAIL,
  DEMO_USER_PASSWORD,
  DEMO_ADMIN_EMAIL,
  DEMO_ADMIN_PASSWORD,
} from "../src/lib/demoAccounts";

async function ensureFirebaseUser(email: string, password: string, displayName: string) {
  try {
    return await admin.auth().getUserByEmail(email);
  } catch (err: any) {
    if (err?.code === "auth/user-not-found") {
      return admin.auth().createUser({ email, password, displayName, emailVerified: true });
    }
    throw err;
  }
}

async function ensureProfile(
  firebaseUid: string,
  name: string,
  email: string,
  role: "user" | "admin"
) {
  const existing = await UserModel.findOne({ firebaseUid });
  if (existing) {
    if (existing.role !== role) {
      existing.role = role;
      await existing.save();
    }
    return existing;
  }
  return UserModel.create({ firebaseUid, name, email, role });
}

async function main() {
  await connectDB();

  const demoUser = await ensureFirebaseUser(DEMO_USER_EMAIL, DEMO_USER_PASSWORD, "Demo User");
  await ensureProfile(demoUser.uid, "Demo User", DEMO_USER_EMAIL, "user");
  console.log(`Seeded demo user:  ${DEMO_USER_EMAIL} / ${DEMO_USER_PASSWORD}`);

  const demoAdmin = await ensureFirebaseUser(DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD, "Demo Admin");
  await ensureProfile(demoAdmin.uid, "Demo Admin", DEMO_ADMIN_EMAIL, "admin");
  console.log(`Seeded demo admin: ${DEMO_ADMIN_EMAIL} / ${DEMO_ADMIN_PASSWORD}`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to seed demo accounts:", err);
  process.exit(1);
});
