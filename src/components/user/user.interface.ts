import mongoose from "mongoose";

export interface IUser {
  username: string;
  interests: string[];
  followedUsers: Map<string, mongoose.Schema.Types.ObjectId>;
  interactions: Map<string, InteractionSchema>;
}

export interface InteractionSchema {
  type: string; // like, comment, share
  postId: mongoose.Schema.Types.ObjectId | string;
  timestamp: Date;
}
