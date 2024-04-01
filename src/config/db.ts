import { connect, connection } from "mongoose";

export const db = {
  run: async () => {
    try {
      return await connect(process.env.MONGODB_URI);
    } catch (error) {
      console.error(error);
    }
  },

  stop: async () => {
    try {
      return await connection.destroy();
    } catch (error) {
      console.error(error);
    }
  },
};
