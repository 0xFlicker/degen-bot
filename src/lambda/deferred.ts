import { SQSHandler } from "aws-lambda";
import { parseMessage } from "../update-interaction";
import { createLogger } from "../utils/logging";
import { handle as commandHandler } from "../update-interaction/commands";
import { InteractionType } from "discord-api-types/v10";
import { InferredApplicationCommandType } from "../types";
import { sendInteraction } from "../service/discord";

import "../commands/ping/deferred.js";
import "../commands/leaderboard/deferred.js";

const logger = createLogger();

export const handler: SQSHandler = async (event) => {
  for (const record of event.Records) {
    try {
      const { body } = record;
      const { Message: message } = JSON.parse(body);
      const deferredInteraction =
        parseMessage<InferredApplicationCommandType>(message);
      logger.debug("Received deferred interaction", deferredInteraction);
      const { interaction } = deferredInteraction;
      if (interaction.type == InteractionType.ApplicationCommand) {
        const message = await commandHandler(interaction);
        const { token } = interaction;
        logger.debug("Sending interaction", message);
        await sendInteraction(token, message);
        return;
      }
      logger.warn("Unknown interaction type", interaction);
    } catch (err: any) {
      logger.error(err.stack);
      logger.error(`Failed to process message`, err);
    }
  }
};
