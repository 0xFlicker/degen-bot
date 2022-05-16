import axios, { AxiosError } from "axios";
import type { APIInteractionResponseCallbackData } from "discord-api-types/v10";
import { logger } from "../commands/leaderboard/common";

export function getApplicationId() {
  if (!process.env.DISCORD_APPLICATION_ID) {
    logger.error("DISCORD_APPLICATION_ID not set");
    throw new Error("DISCORD_APPLICATION_ID not set");
  }
  return process.env.DISCORD_APPLICATION_ID;
}

export async function sendInteraction(
  token: string,
  data: APIInteractionResponseCallbackData
) {
  try {
    const response = await axios.patch(
      `https://discord.com/api/v10/webhooks/${getApplicationId()}/${token}/messages/@original`,
      data
    );
    return response.data;
  } catch (error: any) {
    if (error instanceof AxiosError && error.response?.data) {
      logger.error(error.stack, error.response?.data);
    }
    throw error;
  }
}
