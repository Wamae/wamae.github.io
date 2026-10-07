import { contrastRatio } from "./contrast";
import { minimumContrast, type ColourPair } from "./approved-colour-pairs";
import { resolveCustomProperty } from "./resolve-colour-tokens";

export interface PairCheckResult {
  readonly pair: ColourPair;
  readonly foreground: string;
  readonly background: string;
  readonly ratio: number;
  readonly required: number;
  readonly passes: boolean;
}

/** Resolves each pair's tokens to colours and compares the contrast with the minimum for its kind. */
export function checkApprovedColourPairs(
  pairs: readonly ColourPair[],
  properties: ReadonlyMap<string, string>,
): PairCheckResult[] {
  return pairs.map((pair) => {
    const foreground = resolveCustomProperty(properties, pair.foregroundToken);
    const background = resolveCustomProperty(properties, pair.backgroundToken);
    const ratio = contrastRatio(foreground, background);
    const required = minimumContrast[pair.kind];
    return { pair, foreground, background, ratio, required, passes: ratio >= required };
  });
}
