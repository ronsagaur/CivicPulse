import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { AiMetadata, IssueCategory } from "./types";

// ────────────────────────────────────────────────────────────────
// Stage 4.1 — Multimodal Gemini 2.0 Flash classification.
// Live path: Google Gemini (if GEMINI_API_KEY or ANTHROPIC_API_KEY is set).
// Fallback: a deterministic mock for offline/no-key usage.
// ────────────────────────────────────────────────────────────────

export const CLASSIFIER_SYSTEM_PROMPT = `You are CivicPulse's intake agent. Given media (photo or video) + optional reporter text:
1. Determine if this is a civic/public infrastructure issue (is_civic_issue=true) or a private/personal property dispute (is_private_matter=true).
2. Classify the category: POTHOLE, STREETLIGHT, WATER_LEAK, SEWAGE, GARBAGE, STRAY_ANIMAL, TRAFFIC_VIOLATION, DAMAGED_SIGNAGE, ENCROACHMENT, PUBLIC_SAFETY, or OTHER.
3. Assess the severity on a scale of 1 to 5 (1=minor cosmetic, 5=immediate danger to life/safety).
4. Evaluate visual evidence quality (GOOD, POOR, or UNUSABLE) and call out potential fraud signals (e.g. stock photo, staged, or mismatched details).
5. Estimate if the issue is brand NEW (<24h), RECENT (<1 week), or CHRONIC (older).
6. Generate a concise title (<=60 chars) and description (<=200 chars).`;

export interface ClassifyInput {
  imageBase64?: string; // Contains base64 data (raw file content)
  mediaType?: string;   // e.g. "image/jpeg" or "video/mp4"
  description?: string;
  categoryHint?: IssueCategory;
}

const CATEGORIES: IssueCategory[] = [
  "POTHOLE",
  "STREETLIGHT",
  "WATER_LEAK",
  "SEWAGE",
  "GARBAGE",
  "STRAY_ANIMAL",
  "TRAFFIC_VIOLATION",
  "DAMAGED_SIGNAGE",
  "ENCROACHMENT",
  "PUBLIC_SAFETY",
];

const KEYWORDS: Array<[IssueCategory, RegExp]> = [
  ["POTHOLE", /pot.?hole|crater|road.?(damage|hole)|bike|two.?wheeler/i],
  ["STREETLIGHT", /street.?light|lamp|dark|lighting|bulb/i],
  ["WATER_LEAK", /water.?(leak|pipe|main)|leak|burst pipe/i],
  ["SEWAGE", /sewage|sewer|drain|overflow|gutter/i],
  ["GARBAGE", /garbage|trash|waste|litter|dump|bin/i],
  ["STRAY_ANIMAL", /stray|dog|cattle|animal|monkey/i],
  ["TRAFFIC_VIOLATION", /traffic|parking|signal|wrong.?side|honk/i],
  ["DAMAGED_SIGNAGE", /sign|board|signage|stop sign/i],
  ["ENCROACHMENT", /encroach|hawker|footpath block|illegal stall/i],
  ["PUBLIC_SAFETY", /manhole|open pit|exposed wire|electric|danger|unsafe/i],
];

const SEVERITY_HINT: Record<IssueCategory, number> = {
  POTHOLE: 4,
  STREETLIGHT: 3,
  WATER_LEAK: 4,
  SEWAGE: 5,
  GARBAGE: 3,
  STRAY_ANIMAL: 2,
  TRAFFIC_VIOLATION: 2,
  DAMAGED_SIGNAGE: 3,
  ENCROACHMENT: 2,
  PUBLIC_SAFETY: 5,
  OTHER: 1,
};

const TITLE_TEMPLATES: Record<IssueCategory, string> = {
  POTHOLE: "Deep pothole reported on the road",
  STREETLIGHT: "Streetlight not working after dark",
  WATER_LEAK: "Water main leaking onto the road",
  SEWAGE: "Sewage overflow on the footpath",
  GARBAGE: "Overflowing garbage not cleared",
  STRAY_ANIMAL: "Aggressive stray animals in the area",
  TRAFFIC_VIOLATION: "Persistent traffic violation spot",
  DAMAGED_SIGNAGE: "Damaged road signage",
  ENCROACHMENT: "Footpath encroachment blocking pedestrians",
  PUBLIC_SAFETY: "Public safety hazard reported",
  OTHER: "Civic issue reported",
};

const DESC_TEMPLATES: Record<IssueCategory, string> = {
  POTHOLE: "Large pothole in the carriageway, hazardous for two-wheelers, especially after rain.",
  STREETLIGHT: "Streetlight has been out for several nights, leaving the stretch unsafe.",
  WATER_LEAK: "Treated water leaking continuously from a damaged pipe onto the road.",
  SEWAGE: "Raw sewage overflowing onto a public path — a clear health hazard.",
  GARBAGE: "Garbage has not been collected for days; bins are overflowing onto the street.",
  STRAY_ANIMAL: "A pack of stray animals is causing a nuisance and safety concern.",
  TRAFFIC_VIOLATION: "Repeated traffic violations at this spot creating risk for pedestrians.",
  DAMAGED_SIGNAGE: "Road sign is damaged/illegible, causing confusion for drivers.",
  ENCROACHMENT: "Illegal encroachment is blocking the footpath, forcing people onto the road.",
  PUBLIC_SAFETY: "An exposed hazard poses immediate danger to passers-by.",
  OTHER: "A civic issue affecting the shared public space.",
};

function inferCategory(input: ClassifyInput): IssueCategory {
  if (input.categoryHint) return input.categoryHint;
  const text = input.description ?? "";
  for (const [cat, re] of KEYWORDS) {
    if (re.test(text)) return cat;
  }
  return CATEGORIES[Math.floor(Math.random() * 5)];
}

export function mockClassify(input: ClassifyInput): AiMetadata {
  const category = inferCategory(input);
  const baseSeverity = SEVERITY_HINT[category];
  const severity = Math.max(1, Math.min(5, baseSeverity));
  const confidence = +(0.85 + Math.random() * 0.12).toFixed(2);
  const isVideo = input.mediaType?.startsWith("video/");
  return {
    is_civic_issue: true,
    is_private_matter: false,
    category,
    severity,
    confidence,
    suggested_title: `${TITLE_TEMPLATES[category]}${isVideo ? " (Video)" : ""}`,
    suggested_description: input.description?.trim()
      ? input.description.trim().slice(0, 200)
      : `${DESC_TEMPLATES[category]}`,
    visual_evidence_quality: "GOOD",
    potential_fraud_signals: [],
    estimated_age_of_issue: severity >= 4 ? "RECENT" : "NEW",
    source: "mock",
  };
}

async function liveClassify(input: ClassifyInput): Promise<AiMetadata> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("No API key available for live Gemini classification");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          is_civic_issue: { type: SchemaType.BOOLEAN },
          is_private_matter: { type: SchemaType.BOOLEAN },
          category: {
            type: SchemaType.STRING,
            enum: [
              "POTHOLE",
              "STREETLIGHT",
              "WATER_LEAK",
              "SEWAGE",
              "GARBAGE",
              "STRAY_ANIMAL",
              "TRAFFIC_VIOLATION",
              "DAMAGED_SIGNAGE",
              "ENCROACHMENT",
              "PUBLIC_SAFETY",
              "OTHER",
            ],
          } as any,
          severity: { type: SchemaType.INTEGER },
          confidence: { type: SchemaType.NUMBER },
          suggested_title: { type: SchemaType.STRING },
          suggested_description: { type: SchemaType.STRING },
          visual_evidence_quality: {
            type: SchemaType.STRING,
            enum: ["GOOD", "POOR", "UNUSABLE"],
          } as any,
          potential_fraud_signals: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
          estimated_age_of_issue: {
            type: SchemaType.STRING,
            enum: ["NEW", "RECENT", "CHRONIC"],
          } as any,
        },
        required: [
          "is_civic_issue",
          "is_private_matter",
          "category",
          "severity",
          "confidence",
          "suggested_title",
          "suggested_description",
          "visual_evidence_quality",
          "potential_fraud_signals",
          "estimated_age_of_issue",
        ],
      },
    },
  });

  const promptParts: any[] = [];

  if (input.imageBase64 && input.mediaType) {
    promptParts.push({
      inlineData: {
        data: input.imageBase64,
        mimeType: input.mediaType,
      },
    });
  }

  promptParts.push({
    text: `${CLASSIFIER_SYSTEM_PROMPT}\n\nUser description: "${
      input.description || "(no text description provided)"
    }".\nAnalyze the uploaded media and provide the structured response.`,
  });

  const result = await model.generateContent(promptParts);
  const responseText = result.response.text();
  const json = JSON.parse(responseText);

  return {
    is_civic_issue: !!json.is_civic_issue,
    is_private_matter: !!json.is_private_matter,
    category: (json.category as IssueCategory) ?? "OTHER",
    severity: clampInt(json.severity, 1, 5, 3),
    confidence: clampFloat(json.confidence, 0, 1, 0.8),
    suggested_title: String(json.suggested_title ?? "Civic issue reported").slice(0, 80),
    suggested_description: String(json.suggested_description ?? "").slice(0, 240),
    visual_evidence_quality: json.visual_evidence_quality ?? "GOOD",
    potential_fraud_signals: Array.isArray(json.potential_fraud_signals)
      ? json.potential_fraud_signals
      : [],
    estimated_age_of_issue: json.estimated_age_of_issue ?? "RECENT",
    source: "live",
  };
}

export async function classify(input: ClassifyInput): Promise<AiMetadata> {
  const forceMock = process.env.CIVICPULSE_FORCE_MOCK_AI === "true";
  const apiKey = process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY;
  const hasKey = !!apiKey;

  if (forceMock || !hasKey || !input.imageBase64) {
    // Artificial delay for UI feedback
    await sleep(900 + Math.random() * 400);
    return mockClassify(input);
  }
  try {
    return await liveClassify(input);
  } catch (err) {
    console.error("[CivicPulse] Gemini live classification failed, falling back to mock:", err);
    return mockClassify(input);
  }
}

// ── small utils ─────────────────────────────────────────────────
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
function clampInt(v: any, min: number, max: number, dflt: number): number {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : dflt;
}
function clampFloat(v: any, min: number, max: number, dflt: number): number {
  const n = parseFloat(v);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : dflt;
}
