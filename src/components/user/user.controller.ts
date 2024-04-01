import { faker } from "@faker-js/faker";
import * as argon2 from "argon2";
import { NextFunction, Request, Response, Router } from "express";
import { StatusCodes } from "http-status-codes";

import { generateUniqueUsername } from "../../helper/helper.service";
import BaseController from "../BaseController";
import { PostModel } from "../post/post.schema";
import { UserModel } from "./user.schema";

/**
 * Status controller
 */
export default class UserController extends BaseController {
  public basePath: string = "user";
  /**
   *
   */
  public register(): Router {
    this.router.post("/", this.createUser.bind(this));
    this.router.get("/", this.getUsers.bind(this));
    this.router.get("/:id", this.getUserById.bind(this));
    this.router.get("/login", this.login.bind(this));
    this.router.post("/dummyData", this.generateFakeData.bind(this));
    return this.router;
  }

  private async createUser(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<any> {
    try {
      const { email, name, password, ...rest } = req.body;

      const user = await UserModel.findOne({ email });

      if (user) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "User already exist." });
      }
      const username = generateUniqueUsername({ prefix: "name_" });
      const hashedPassword = await argon2.hash("password");

      const createUser = await UserModel.create({
        email,
        name,
        password: hashedPassword,
        username,
        ...rest,
      });
      res.status(StatusCodes.CREATED).json(createUser);
    } catch (error) {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  private async login(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<any> {
    try {
      const { email, password } = req.body;

      const user = await UserModel.findOne({ email });

      if (!user) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json({ message: "User not found." });
      }
      if (await argon2.verify(password, user.password)) {
        res.status(StatusCodes.OK).json(user.username);
      } else {
        res.status(StatusCodes.UNAUTHORIZED).json("Password is wrong");
      }
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  private async getUsers(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<any> {
    try {
      const users = await UserModel.find();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  private async getUserById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<any> {
    try {
      const user = await UserModel.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  private async generateFakeData(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<any> {
    try {
      const users = [];
      const numUsers = req.body.numUsers;

      for (let i = 0; i < numUsers; i++) {
        const user = new UserModel({
          email: faker.internet.email(),
          password: faker.internet.password(),
          username: faker.internet.userName(),
          interests: faker.random.words(3).split(" "),
        });
        users.push(user);
      }
      await UserModel.insertMany(users);

      const posts = [];
      const numPosts = req.body.numPost;
      const sports = ["soccer", "basketball", "tennis", "golf"];
      const events = ["tournament", "match", "game", "championship"];
      for (let i = 0; i < numPosts; i++) {
        const randomUser =
          users[faker.datatype.number({ min: 0, max: users.length - 1 })];
        const post = new PostModel({
          content: faker.lorem.sentence(),
          author: randomUser._id,
          sport:
            sports[faker.datatype.number({ min: 0, max: sports.length - 1 })],
          event:
            events[faker.datatype.number({ min: 0, max: events.length - 1 })],
        });
        posts.push(post);
      }
      await PostModel.insertMany(posts);

      res.status(201).json({ message: "Dummy data inserted successfully." });
      console.log(`Inserted ${users.length} fake users.`);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}
