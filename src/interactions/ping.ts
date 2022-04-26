import { APIGatewayProxyResult } from "aws-lambda";
import { APIPingInteraction } from "discord-api-types/v10";

export function handle(
  _: APIPingInteraction
): Promise<APIGatewayProxyResult> | APIGatewayProxyResult {
  return {
    statusCode: 200,
    body: JSON.stringify({ type: 1 }),
  };
}
