import mongoose from "mongoose";

export interface IPost {
  _id: string | any;
  content: string;
  author: mongoose.Schema.Types.ObjectId | string;
  sport?: string;
  event?: string;
  likes: any;
  comments: {
    user: any; //mongoose.Schema.Types.ObjectId;
    text: string;
    createdAt: Date;
  }[];
  createdAt?: Date;
}
