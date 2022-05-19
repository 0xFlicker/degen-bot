import { APIGatewayProxyHandler } from "aws-lambda";
import { fetchBoard } from "../ranker";
import { createLogger } from "../utils/logging";
import { TableBoard } from "@0xflicker/ranker/lib/db/dynamodb";

const logger = createLogger();

export const handler: APIGatewayProxyHandler = logger.handler(async (event) => {
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
      body: "Bad Request",
    };
  }

  const board = await fetchBoard(experience);
  if (!board) {
    return {
      statusCode: 404,
      body: "Not Found",
    };
  }
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(transformBoard(board)),
  };
});

function transformBoard(board: TableBoard) {
  return {
    id: board.Name,
    displayName: board.Display_Name,
    description: board.Description,
  };
}
