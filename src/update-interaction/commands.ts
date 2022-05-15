import type {
  APIEmbed,
  APIInteractionResponseCallbackData,
} from "discord-api-types/v10";
import { MessageEmbed } from "discord.js";
import { InferredApplicationCommandType } from "../types.js";
import { createLogger } from "../utils/logging.js";

interface ICommandHandler {
  handler(
    event: InferredApplicationCommandType
  ): Promise<false | APIInteractionResponseCallbackData>;
}

const handlers: ICommandHandler[] = [];
const logger = createLogger();

export function asApiMessageEmbed(embed: MessageEmbed): APIEmbed {
  if (embed instanceof MessageEmbed) {
    return embed as any as APIEmbed;
  }
  throw new Error("Not a MessageEmbed");
}

export function register(handler: ICommandHandler): void {
  handlers.push(handler);
}

export async function handle(
  interaction: InferredApplicationCommandType
): Promise<APIInteractionResponseCallbackData> {
  for (const handler of handlers) {
    const result = await handler.handler(interaction);
    if (result) {
      logger.debug("Handled interaction");
      return result;
    }
  }

  return {
    content: "unknown command",
  };
}
