import { TableScores } from "@0xflicker/ranker/lib/db/dynamodb";
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
  const playerIdsString = event.queryStringParameters?.playerIds;
  const playerIdString = event.queryStringParameters?.playerId;
  if (!playerIdsString && !playerIdString) {
    return {
      statusCode: 400,
      body: "playerIds or playerId not set",
    };
  }

  const playerIds = playerIdString ? [playerIdString] : [];
  if (playerIdsString) {
    playerIds.push(...playerIdsString.split(","));
  }

  const ranker = await initRanker(experience);
  const scoreResponse = await Promise.all(playerIds.map(ranker.fetchScore));
  const scores = scoreResponse.filter((score) => !!score) as TableScores[];
  const ranks = await ranker.findRanks(scores.map((s) => s.Score));
  const response: {
    playerId: string;
    rank: number;
    score: number[];
  }[] = [];
  for (let i = 0; i < scores.length; i++) {
    const ts = scores[i];
    const rank = ranks[i];
    response.push({
      playerId: ts.Player_ID,
      score: ts.Score,
      rank,
    });
  }
  const body = JSON.stringify(response);
  return {
    statusCode: 200,
    headers: {
      "Content-Size": body.length,
      "Content-Type": "application/json",
    },
    body,
  };
};
