import * as http from "http";
import { AddressInfo } from "net";

import App from "./App";
import { db, redis } from "./config";

const app: App = new App();

let server: http.Server;

function serverError(error: NodeJS.ErrnoException): void {
  if (error.syscall !== "listen") {
    throw error;
  }
  // handle specific error codes here.
  throw error;
}

function serverListening(): void {
  const addressInfo: AddressInfo = <AddressInfo>server.address();
  console.log(
    `Listening on ${addressInfo.address}:${process.env.NODE_PORT || 8080}`,
  );
}

db.run();
redis.run();

app
  .init()
  .then(() => {
    app.express.set("port", process.env.NODE_PORT || 8080);

    server = app.httpServer;
    server.on("error", serverError);
    server.on("listening", serverListening);
    server.listen(process.env.NODE_PORT || 8080);
  })
  .catch((err: Error) => {
    console.info("app.init error");
    console.error(err.name);
    console.error(err.message);
    console.error(err.stack);
  });

process.on("unhandledRejection", (reason: Error) => {
  console.error("Unhandled Promise Rejection: reason:", reason.message);
  console.error(reason.stack);
});
