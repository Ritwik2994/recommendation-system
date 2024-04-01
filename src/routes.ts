import { Router } from "express";

import PostController from "./components/post/post.controller";
import RecommendationController from "./components/recommendation/recommendation.controller";
import SystemStatusController from "./components/system-status/system-status.controller";
import UserController from "./components/user/user.controller";

let router: Router | null = null;

export default function registerRoutes(): Router {
  if (router) {
    return router;
  }

  const systemStatusController = new SystemStatusController();
  const userController = new UserController();
  const postController = new PostController();
  const recommendationController = new RecommendationController();

  router = Router();

  const routes = [
    systemStatusController,
    userController,
    postController,
    recommendationController,
  ];

  routes.forEach((route) => {
    router?.use(`/${route.basePath}`, route.register());
  });

  return router;
}
