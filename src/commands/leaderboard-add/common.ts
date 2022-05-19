import { APIApplicationCommandInteractionDataOption } from "discord-api-types/v10";
import { createLogger } from "../../utils/logging";
import { ICreateRanker } from "../../ranker";

export const logger = createLogger();
logger.setKey("command", "leaderboard-add");

export const command = "mclb-add";

export class OptionsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OptionsError";
  }
}

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
  const partialOptions: Partial<ICreateRanker> = {};
  if (!options) {
    throw new OptionsError("Missing options");
  }
  for (const option of options) {
    switch (option.name) {
      case "name": {
        partialOptions.rootKey = option.value;
        break;
      }
      case "branching-factor": {
        partialOptions.branchingFactor = parseInt(option.value);
        break;
      }
      case "leaderboard-size": {
        partialOptions.leaderboardSize = parseInt(option.value);
        break;
      }
      case "score-range": {
        partialOptions.scoreRange = option.value
          .split(",")
          .map((x) => parseInt(x));
        break;
      }
      case "period": {
        partialOptions.period = parseInt(option.value);
        break;
      }
      case "display-name": {
        partialOptions.displayName = option.value;
        break;
      }
      case "description": {
        partialOptions.description = option.value;
        break;
      }
    }
  }
  if (!partialOptions.rootKey) {
    throw new OptionsError("Missing name");
  }
  if (!partialOptions.branchingFactor) {
    throw new OptionsError("Missing branching factor");
  }
  if (!partialOptions.scoreRange) {
    throw new OptionsError("Missing score range");
  }
  if (partialOptions.scoreRange.length % 2 !== 0) {
    throw new OptionsError("Score range must be an even number");
  }
  return partialOptions as ICreateRanker;
}
