import mongoose from "mongoose";

let isConnected = false;

export async function connectDB(): Promise<void> {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    // eslint-disable-next-line no-console
    console.warn(
      "[db] MONGODB_URI is not set in server/.env — auth-protected routes will fail until it is."
    );
    return;
  }

  await mongoose.connect(uri);
  isConnected = true;
  // eslint-disable-next-line no-console
  console.log("[db] Connected to MongoDB");
}
