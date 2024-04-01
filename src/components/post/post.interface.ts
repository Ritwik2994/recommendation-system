import mongoose from "mongoose";

export interface IPost {
  _id: string;
  content: string;
  author: mongoose.Schema.Types.ObjectId | string;
  sport?: string;
  event?: string;
  likes: mongoose.Schema.Types.ObjectId[];
  comments: {
    user: mongoose.Schema.Types.ObjectId;
    text: string;
    createdAt: Date;
  }[];
  createdAt?: Date;
}
