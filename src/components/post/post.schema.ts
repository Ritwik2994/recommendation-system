import { Schema, Types, model } from "mongoose";

export const postSchema = new Schema({
  content: String,
  author: { type: Types.ObjectId, ref: "User" },
  sport: String,
  event: String,
  likes: [{ type: Types.ObjectId, ref: "User" }],
  comments: [
    {
      user: { type: Types.ObjectId, ref: "User", required: true },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: Date,
});

export const PostModel = model("Post", postSchema);
