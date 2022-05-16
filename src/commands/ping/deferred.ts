import { register as deferredRegister } from "../../update-interaction/commands.js";
import { logger } from "./common.js";

deferredRegister({
  handler: async (interaction) => {
    if (interaction.data.name !== "ping") {
      return false;
    }
    logger.info("responding to ping");
    return {
      content: "pong",
    };
  },
});
