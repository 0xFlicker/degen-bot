import type { APIInteraction } from "discord-api-types/v10";

export interface IDeferredInteraction<
  Type extends string,
  Interaction extends APIInteraction
> {
  type: Type;
  interaction: Interaction;
  context?: string;
}

export function createDeferredInteractionMessage<
  Interaction extends APIInteraction
>(
  interaction: Interaction,
  context?: string
): IDeferredInteraction<"defer", Interaction> {
  return {
    type: "defer",
    interaction,
    context,
  };
}
