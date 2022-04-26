import { InteractionResponseType } from "discord-api-types/v10";
import { createLogger } from "../utils/logging.js";
import { register } from "../interactions/command.js";

const logger = createLogger();
logger.setKey("command", "ping");

register({
  handler: (interaction) => {
    if (interaction.data.name !== "ping") {
      return false;
    }
    logger.info("received ping");
    return {
      statusCode: 200,
      body: JSON.stringify({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: "pong",
        },
      }),
    };
  },
});
