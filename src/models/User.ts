import mongoose, { Schema, Document, Model } from "mongoose";
import { UserRole } from "../types";

export interface UserDocument extends Document {
  firebaseUid: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

const userSchema = new Schema<UserDocument>({
  firebaseUid: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  createdAt: { type: Date, default: Date.now },
});

// Guard against "Cannot overwrite model" errors when tsx hot-reloads in dev.
const UserModel: Model<UserDocument> =
  (mongoose.models.User as Model<UserDocument>) || mongoose.model<UserDocument>("User", userSchema);

export default UserModel;
