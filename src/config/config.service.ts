import "dotenv/config";

import IEnvConfigInterface from "../abstractions/env-config.interface";

const configService = async (): Promise<IEnvConfigInterface> => {
  try {
    const env: IEnvConfigInterface = { ...process.env };
    return env;
  } catch (error) {
    throw new Error(`Error loading environment variables: ${error.message}`);
  }
};

export default configService;
