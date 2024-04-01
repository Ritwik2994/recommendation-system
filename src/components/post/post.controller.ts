import { NextFunction, Request, Response, Router } from "express";

import BaseController from "../BaseController";
import { PostModel } from "./post.schema";

/**
 * Status controller
 */
export default class PostController extends BaseController {
  public basePath: string = "post";
  /**
   *
   */
  public register(): Router {
    this.router.post("/", this.createPost.bind(this));
    this.router.get("/", this.getPosts.bind(this));
    this.router.get("/:id", this.getPostById.bind(this));
    return this.router;
  }

  private async createPost(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<any> {
    try {
      const post = await PostModel.create(req.body);
      res.status(201).json(post);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  private async getPosts(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<any> {
    try {
      const posts = await PostModel.find();
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  private async getPostById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<any> {
    try {
      const post = await PostModel.findById(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}
