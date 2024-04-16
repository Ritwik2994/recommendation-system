# Recommendation System

This project is a recommendation system designed to recommend posts to users on a social media platform based on their interactions, interests, and followed users. The system prioritizes recommending posts from followed users, liked and commented posts of followed users, and posts relevant to the user's interests, sport, and event preferences.

## Features

- **User Interaction Analysis**: Analyzes user interactions such as likes, comments, and followed users to personalize post recommendations.
  
- **Interest-Based Recommendations**: Recommends posts based on user interests extracted from their profile.

- **Sport and Event Context**: Provides context by recommending posts related to specific sports and events within those sports.

- **Caching Mechanisms**: Utilizes Redis and MongoDB for caching recommendation data to improve retrieval speed.

## Technologies Used

- **Node.js**: Backend server environment for implementing the recommendation system.

- **Redis**: In-memory data store used for caching recommendation data to improve retrieval speed.

- **MongoDB**: NoSQL database used for storing user profiles, posts, and interaction data.

## Swagger API Documentation

For detailed API documentation using Swagger, please refer to the following link:

[Swagger Documentation](<https://recommendation-system-production-2433.up.railway.app/docs>)

---

## Sample Recommendation

This is the sample recommendation

[Sample Recommendation](<https://recommendation-system-production-2433.up.railway.app/recommendation/posts/661dd39f1c73e27791302df3>)

This recommendation system leverages user interactions and interests to deliver personalized post recommendations. By incorporating caching mechanisms and utilizing technologies like Node.js, Redis, and MongoDB, the system ensures efficient and scalable recommendations for improved user experience.

For development instructions and setup, please refer to the project's documentation and guidelines.
