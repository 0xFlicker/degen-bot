import { ICreateRanker } from "@0xflicker/ranker";
import { APIGatewayProxyHandler } from "aws-lambda";
import { create as createDb } from "../storage/db/dynamo";
import { isKnownLeaderboard, createRanker } from "../ranker";
import { createLogger } from "../utils/logging";

const logger = createLogger();
const db = createDb();

type CreateRankerRequest = Omit<ICreateRanker, "db" | "rootKey"> & {
  name: string;
};

export const handler: APIGatewayProxyHandler = async (event) => {
  logger.debug("Received event", event);
  if (event.httpMethod !== "PUT") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }
  if (!event.body) {
    return {
      statusCode: 400,
      body: "Bad Request",
    };
  }

  const reqBody: CreateRankerRequest = JSON.parse(event.body);
  if (await isKnownLeaderboard(reqBody.name)) {
    return {
      statusCode: 409,
      body: "Conflict",
    };
  }

  await createRanker({
    rootKey: reqBody.name,
    scoreRange: reqBody.scoreRange,
    branchingFactor: reqBody.branchingFactor,
    leaderboardSize: reqBody.leaderboardSize,
    period: reqBody.period,
    displayName: reqBody.displayName,
    description: reqBody.description,
  });

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: "Success",
  };
};
