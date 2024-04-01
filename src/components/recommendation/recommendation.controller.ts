import { NextFunction, Request, Response, Router } from "express";

import { redis } from "../../config/redis";
import BaseController from "../BaseController";
import { IPost } from "../post/post.interface";
import { PostModel } from "../post/post.schema";
import { UserModel } from "../user/user.schema";

/**
 * Status controller
 */
export default class RecommendationController extends BaseController {
  public basePath: string = "recommendation";

  // Cache key for user recommendations
  private readonly RECOMMENDATION_CACHE_KEY: string = "recommendations";

  // Cache expiration time (1 hour)
  private readonly CACHE_EXPIRATION: number = 3600;

  /**
   *
   */
  public register(): Router {
    this.router.get("/posts/:userId", this.getPostRecommendations.bind(this));
    return this.router;
  }

  /**
   *
   * @param req
   * @param res
   * @param next
   */
  public async getPostRecommendations(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<any> {
    try {
      const { userId } = req.params;
      const recommendedPosts = await this.getRecommendedPosts(userId);

      const formattedPosts = recommendedPosts.map((post) => ({
        postId: post._id,
        text: post.content,
        userId: post.author,
        likes: post.likes.length,
        comments: post.comments.length,
        timestamp: post.createdAt,
        popularityScore: this.calculatePopularityScore(post),
      }));

      res.status(200).json(formattedPosts);
    } catch (err) {
      next(err);
    }
  }

  private calculatePopularityScore(post: IPost): number {
    const { likes, comments } = post;
    return likes.length + comments.length * 2; // Weigh comments more than likes
  }

  private async getRecommendedPosts(userId: string): Promise<IPost[]> {
    // Check Redis cache
    const cachedPosts = await redis.client.get(
      `${this.RECOMMENDATION_CACHE_KEY}:${userId}`,
    );
    if (cachedPosts) {
      return JSON.parse(cachedPosts);
    }

    // Fetch user
    const user = await UserModel.findById(userId).lean();
    if (!user) {
      return [];
    }

    // Fetch posts based on interests
    const interestPosts = await PostModel.find({
      sport: { $in: user.interests },
    }).lean();

    // Fetch posts from followed users
    const followedUserIds = Array.from(user.followedUsers.values());
    const followedUserPosts = await PostModel.find({
      author: { $in: followedUserIds },
    }).lean();

    // Fetch posts liked and commented by followed users
    const followedUsersInteractions = Array.from(
      user.followedUsers.values(),
    ).flatMap((followedUserId) =>
      Array.from(
        (user.interactions.get(followedUserId.toString()) || []).values(),
      ),
    );
    const interactedPostIds = followedUsersInteractions.map(
      (interaction) => interaction.postId,
    );
    const interactedPosts = await PostModel.find({
      _id: { $in: interactedPostIds },
    }).lean();

    // Combine and sort posts
    const recommendedPosts = [
      ...followedUserPosts,
      ...interactedPosts,
      ...interestPosts,
    ];
    recommendedPosts.sort((a, b) => {
      const aScore = this.calculatePopularityScore(a);
      const bScore = this.calculatePopularityScore(b);
      return bScore - aScore;
    });

    // Remove posts the user has already seen or interacted with
    const seenPostIds = Array.from(user.interactions.values()).map(
      (interaction) => interaction.postId,
    );
    const filteredPosts = recommendedPosts.filter(
      (post) => !seenPostIds.includes(post._id),
    );

    // Cache recommended posts in Redis
    await redis.client.set(
      `${this.RECOMMENDATION_CACHE_KEY}:${userId}`,
      JSON.stringify(filteredPosts),
      "EX",
      this.CACHE_EXPIRATION,
    );

    return recommendedPosts;
  }
}
