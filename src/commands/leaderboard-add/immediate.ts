import { InteractionType } from "discord-api-types/v10";
import { register } from "../../interactions/command";
import {
  createDeferredInteraction,
  deferredMessage,
} from "../../update-interaction";
import { logger, command, getOptions } from "./common";

register({
  handler: async (interaction) => {
    if (interaction.data.name !== command) {
      return false;
    }
    logger.info("Received leaderboard-add command");
    try {
      getOptions(interaction.data.options);
    } catch (error: any) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          type: InteractionType.MessageComponent,
          data: {
            content: `Invalid leaderboard option: ${error.message}`,
          },
        }),
      };
    }

    const messageId = await createDeferredInteraction(interaction);
    logger.info(`Created deferred interaction ${messageId}`);

    return {
      statusCode: 200,
      body: JSON.stringify(deferredMessage()),
    };
  },
});
