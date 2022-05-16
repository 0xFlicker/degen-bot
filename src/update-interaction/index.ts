import type {
  APIInteraction,
  APIInteractionResponseDeferredChannelMessageWithSource,
} from "discord-api-types/v10";
import { InteractionResponseType } from "discord-api-types/v10";
import { createSNS } from "../pubsub/sns";
import {
  createDeferredInteractionMessage,
  IDeferredInteraction,
} from "./messages";
import { createLogger } from "../utils/logging";

const logger = createLogger();

export function getTopicArn() {
  if (!process.env.DISCORD_DEFERRED_MESSAGE_TOPIC_ARN) {
    logger.error("DISCORD_DEFERRED_MESSAGE_TOPIC_ARN not set");
    throw new Error("DISCORD_DEFERRED_MESSAGE_TOPIC_ARN not set");
  }
  return process.env.DISCORD_DEFERRED_MESSAGE_TOPIC_ARN;
}

export async function createDeferredInteraction(
  interaction: APIInteraction,
  context?: string
) {
  const sns = createSNS();
  const { MessageId } = await sns.publish({
    Message: JSON.stringify(
      createDeferredInteractionMessage(interaction, context)
    ),
    TopicArn: getTopicArn(),
  });
  return MessageId;
}

export function parseMessage<Type extends APIInteraction>(message: string) {
  const payload = JSON.parse(message);
  if (payload.type === "defer") {
    return payload as IDeferredInteraction<"defer", Type>;
  }
  throw new Error(`Unknown message ${message}`);
}

export function deferredMessage(): APIInteractionResponseDeferredChannelMessageWithSource {
  return {
    type: InteractionResponseType.DeferredChannelMessageWithSource,
  };
}
