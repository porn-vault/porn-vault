import express from "express"
import graphql from "express-graphql"

const app = express();

app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.log(`${req.method} request to ${req.originalUrl}: ${new Date().toUTCString()}`);
  next();
});

import types from "./graphql/types"
import root from "./graphql/root"
import {buildSchema} from "graphql"
import { graphqlUploadExpress } from "graphql-upload"

app.use(
  '/ql',
  graphqlUploadExpress({ maxFileSize: 100000000000, maxFiles: 1 }),
  graphql({
    schema: buildSchema(types),
    graphiql: true,
    rootValue: root
  }),
);

import "./ffmpeg";
import "./database";
import config from "./config";

app.listen(3000, () => {
  console.log("Server running on Port 3000");
  console.log("Config:\n", config);
})