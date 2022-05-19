import { APIGatewayProxyHandler } from "aws-lambda";
import { initRanker } from "../ranker";
import { createLogger } from "../utils/logging";

const logger = createLogger();

export const handler: APIGatewayProxyHandler = async (event) => {
  logger.debug("Received event", event);
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  const experience = event.pathParameters?.experience;
  if (!experience) {
    return {
      statusCode: 400,
      body: "experience is not set",
    };
  }
  const ranker = await initRanker(experience);
  const lb = await ranker.leaderboard();
  const body = JSON.stringify(lb);
  return {
    statusCode: 200,
    headers: {
      "Content-Size": body.length,
      "Content-Type": "application/json",
    },
    body,
  };
};
