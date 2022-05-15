import axios from "axios";
import type {
  APIInteractionResponseCallbackData,
  APIInteractionResponseChannelMessageWithSource,
  InteractionResponseType,
} from "discord-api-types/v10";

function updateMessagePayload(
  data: APIInteractionResponseCallbackData
): APIInteractionResponseChannelMessageWithSource {
  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data,
  };
}

export async function sendInteraction(
  interactionId: string,
  token: string,
  data: APIInteractionResponseCallbackData
) {
  const payload = updateMessagePayload(data);
  const response = await axios.post(
    `https://discordapp.com/api/v10/interactions/${interactionId}/${token}/callback`,
    payload
  );
  return response.data;
}
