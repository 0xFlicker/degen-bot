import { APIApplicationCommandInteractionDataOption } from "discord-api-types/v10";
import { createLogger } from "../../utils/logging";
import { ICurrentBoard } from "../../storage/model/CurrentBoard";

export const logger = createLogger();
logger.setKey("command", "leaderboard-current");

export const command = "mclb-current";
export const CONTEXT = "flickbot";

export function getOptions(
  options?:
    | {
        name: string;
        value: any;
      }[]
    | (APIApplicationCommandInteractionDataOption[] &
        {
          name: string;
          value: any;
        }[])
) {
  const partialOptions: Omit<ICurrentBoard, "boardName"> & {
    boardName?: string;
  } = {
    context: CONTEXT,
  };
  if (!options) {
    return partialOptions;
  }
  for (const option of options) {
    switch (option.name) {
      case "set": {
        partialOptions.boardName = option.value;
        break;
      }
    }
  }
  return partialOptions;
}
