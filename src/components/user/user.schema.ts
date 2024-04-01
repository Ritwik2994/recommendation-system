import mongoose from "mongoose";

export const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: { type: String },
  username: { type: String, unique: true },
  interests: [String],
  followedUsers: {
    type: Map,
    of: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: new Map(),
  },
  interactions: {
    type: Map,
    of: new mongoose.Schema(
      {
        type: String, // like, comment, share
        postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
        timestamp: Date,
      },
      { _id: false },
    ),
    default: new Map(),
  },
});

export const UserModel = mongoose.model("User", userSchema);
