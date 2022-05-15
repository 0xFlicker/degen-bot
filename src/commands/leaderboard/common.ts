import { createLogger } from "../../utils/logging";

export const logger = createLogger();
logger.setKey("command", "leaderboard");

export enum Experiences {
  POTATO = "potato",
}
export const KNOWN_LEADERBOARDS = [Experiences.POTATO];
