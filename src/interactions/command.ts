import { APIGatewayProxyResult } from "aws-lambda";
import { LambdaResponse } from "../utils/response.js";
import { InferredApplicationCommandType } from "../types.js";
import { createLogger } from "../utils/logging.js";

interface ICommandHandler {
  handler(
    event: InferredApplicationCommandType
  ): LambdaResponse | Promise<false> | false;
}

const handlers: ICommandHandler[] = [];
const logger = createLogger();

export function register(handler: ICommandHandler): void {
  handlers.push(handler);
}

export async function handle(
  interaction: InferredApplicationCommandType
): Promise<APIGatewayProxyResult> {
  for (const handler of handlers) {
    const result = await handler.handler(interaction);
    if (result) {
      logger.info("Handled interaction");
      return result;
    }
  }
  return {
    statusCode: 400,
    body: JSON.stringify({ error: "unknown command" }),
  };
}