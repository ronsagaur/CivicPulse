import type { AppUser } from "./types";

/** Trust bands govern how many confirmations a report needs. */
export function bandFor(trustScore: number): AppUser["band"] {
  if (trustScore < 20) return "Citizen";
  if (trustScore < 40) return "Volunteer";
  if (trustScore < 60) return "Guardian";
  if (trustScore < 75) return "Champion";
  if (trustScore < 85) return "Ward Keeper";
  if (trustScore < 95) return "City Steward";
  return "Nation Builder";
}

/** Confirmations required to move a report to VERIFIED, by reporter band. */
export function confirmationsNeeded(band: AppUser["band"]): number {
  switch (band) {
    case "Citizen":
      return 5;
    case "Volunteer":
      return 4;
    case "Guardian":
      return 3;
    case "Champion":
      return 2;
    case "Ward Keeper":
    case "City Steward":
    case "Nation Builder":
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
