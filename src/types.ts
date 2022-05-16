import type {
  APIInteraction,
  APIPingInteraction,
  APIApplicationCommandInteraction,
  ApplicationCommandType,
} from "discord-api-types/v10";
import { InteractionType } from "discord-api-types/v10";

export function isPingInteraction(
  interaction: APIInteraction
): interaction is APIPingInteraction {
  return interaction.type === InteractionType.Ping;
}

export function isApplicationCommand(
  interaction: APIInteraction
): interaction is APIApplicationCommandInteraction {
  return interaction.type === InteractionType.ApplicationCommand;
}

export interface APIApplicationCommand {
  id: string;
  type?: ApplicationCommandType;
  application_id: string;
  guild_id?: string;
  name: string;
}

export type InferredApplicationCommandType =
  APIApplicationCommandInteraction & {
    data: {
      options: { name: string; value: any }[];
    };
  };
