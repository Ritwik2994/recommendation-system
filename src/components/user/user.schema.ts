import mongoose, { Schema } from "mongoose";

export const InteractionsObject = new Schema(
  {
    type: { type: String },
    postId: { type: String, required: true },
    userId: { type: String, required: false },
    timestamp: { type: Date },
  },
  { _id: false, timestamps: false },
);

export const userSchema = new Schema(
  {
    email: { type: String, unique: true },
    password: { type: String },
    username: { type: String, unique: true },
    interests: [String],
    followedUsers: {
      type: [String],
      default: [],
      // of: mongoose.Schema.Types.ObjectId,
      // ref: "User",
      // default: new Map(),
    },
    interactions: {
      type: [InteractionsObject],
      default: [],
      // type: Map,
      // of: new mongoose.Schema(
      //   {
      //     type: String, // like, comment, share
      //     postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
      //     timestamp: Date,
      //   },
      //   { _id: false },
      // ),
      // default: new Map(),
    },
  },
  { timestamps: true, versionKey: false },
);

export const UserModel = mongoose.model("User", userSchema);
