import type { AppUser } from "./types";

/** Trust bands govern how many confirmations a report needs. */
export function bandFor(trustScore: number): AppUser["band"] {
  if (trustScore <= 30) return "New";
  if (trustScore <= 70) return "Trusted";
  return "Champion";
}

/** Confirmations required to move a report to VERIFIED, by reporter band. */
export function confirmationsNeeded(band: AppUser["band"]): number {
  switch (band) {
    case "New":
      return 5;
    case "Trusted":
      return 3;
    case "Champion":
      return 1;
  }
}

/** Trust-score deltas from the blueprint engine. Clamped [0, 100]. */
export function applyTrustDelta(score: number, delta: number): number {
  return Math.max(0, Math.min(100, score + delta));
}

export const TRUST_DELTAS = {
  REPORT_VERIFIED: 5,
  VERIFICATION_MATCHED_CONSENSUS: 1,
  REPORT_REJECTED_AS_SPAM: -10,
  VERIFICATION_AGAINST_CONSENSUS: -3,
  CONFIRMED_RESOLUTION_MATCH: 2,
} as const;
