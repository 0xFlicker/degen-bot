import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { createLogger } from "../utils/logging";
import { UserTokenAccess } from "../storage/model/UserToken";

const logger = createLogger();

export const lambdaHandler = logger.handler(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    return {
      statusCode: 200,
      body: JSON.stringify({ type: 1 }),
    };
  }
);
