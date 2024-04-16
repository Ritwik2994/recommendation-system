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

      const usersData = await UserModel.insertMany(users);

      usersData.forEach(async (obj) => {
        const currentId = obj._id;

        // Get all _id values excluding the current object's _id
        const idsExcludingCurrent = usersData
          .map((item) => item._id)
          .filter((id) => id !== currentId);

        // Define the number of IDs to randomly pick (adjust as needed)
        const numberOfIdsToPick = 3;

        // Randomly pick 'numberOfIdsToPick' IDs from 'idsExcludingCurrent'
        const randomlyPickedIds = await this.getRandomItemsFromArrayExcluding(
          idsExcludingCurrent,
          numberOfIdsToPick,
          currentId,
        );

        await UserModel.updateOne(
          { _id: currentId },
          { followedUsers: randomlyPickedIds },
        );
      });

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
      const postsData = await PostModel.insertMany(posts);
      const interactionsData = [];
      postsData.forEach(async (post) => {
        const { author } = post;

        // Check if post author exists and matches the author of the post's interactions
        if (author) {
          let randomUserId;
          // Simulate likes
          const numLikes = faker.datatype.number({ min: 0, max: 10 }); // Generate random number of likes
          for (let i = 0; i < numLikes; i++) {
            const randomUserIndex = faker.datatype.number({
              min: 0,
              max: usersData.length - 1,
            });
            randomUserId = usersData[randomUserIndex]._id;
            post.likes.push(randomUserId); // Add the user to the post's likes
            interactionsData.push({
              type: "like",
              postId: post._id.toString(),
              userId: randomUserId.toString(),
            });
          }

          // Simulate comments
          const numComments = faker.datatype.number({ min: 0, max: 5 }); // Generate random number of comments
          for (let i = 0; i < numComments; i++) {
            const randomUserIndex = faker.datatype.number({
              min: 0,
              max: usersData.length - 1,
            });
            const randomUserId = usersData[randomUserIndex]._id;
            const randomText = faker.lorem.sentence(); // Generate random comment text
            post.comments.push({
              user: randomUserId,
              text: randomText,
              createdAt: faker.date.recent(),
            });
            interactionsData.push({
              type: "comment",
              postId: post._id.toString(),
              userId: randomUserId.toString(),
            });
          }

          await UserModel.updateOne(
            { _id: randomUserId },
            { interactions: interactionsData },
          );

          await PostModel.updateOne({ _id: post._id }, { likes: randomUserId });
        }
      });
      res.status(201).json({ message: "Dummy data inserted successfully." });
      console.log(`Inserted ${users.length} fake users.`);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  private async getRandomItemsFromArrayExcluding(array, count, excludedItem) {
    // Filter out the excluded item from the array
    const filteredArray = array.filter((item) => item !== excludedItem);

    // Shuffle the filtered array and select 'count' items
    const shuffled = filteredArray.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
}
