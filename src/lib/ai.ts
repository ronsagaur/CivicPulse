import {
  FunctionCallingMode,
  GoogleGenerativeAI,
  SchemaType,
} from "@google/generative-ai";
import type { AiMetadata, Department, IssueCategory, Report } from "./types";

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

type AgentFunctionName = "routeToDepartment" | "escalateTicket";

export interface AgentToolCall {
  name: AgentFunctionName;
  args: Record<string, unknown>;
}

export interface PetitionDraftInput {
  report: Report;
  department?: Department | null;
}

export interface PetitionDraft {
  subject: string;
  body: string;
  source: "live" | "mock";
}

const CIVIC_AGENT_TOOLS: any = [
  {
    functionDeclarations: [
      {
        name: "routeToDepartment",
        description:
          "Route a verified civic report to the responsible municipal department with an urgency-based SLA.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            reportId: {
              type: SchemaType.STRING,
              description: "The CivicPulse report ID.",
            },
            departmentId: {
              type: SchemaType.STRING,
              description: "The target department ID.",
            },
            urgencyLevel: {
              type: SchemaType.INTEGER,
              description: "Urgency from 1 to 5, where 5 is immediate public danger.",
            },
            reason: {
              type: SchemaType.STRING,
              description: "Short explanation for the routing decision.",
            },
          },
          required: ["reportId", "departmentId", "urgencyLevel", "reason"],
        },
      },
      {
        name: "escalateTicket",
        description:
          "Escalate a civic report when the community rejects a claimed resolution or an SLA breach occurs.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            reportId: {
              type: SchemaType.STRING,
              description: "The CivicPulse report ID.",
            },
            reason: {
              type: SchemaType.STRING,
              description: "Why the ticket must be reopened and escalated.",
            },
          },
          required: ["reportId", "reason"],
        },
      },
    ],
  },
];

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
    model: "gemini-2.5-flash",
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
export async function chooseRoutingToolCall(
  report: Report,
  departments: Department[]
): Promise<AgentToolCall> {
  const matchingDept =
    departments.find((dept) => dept.handlesCategories.includes(report.category)) ??
    departments[0];

  const fallback: AgentToolCall = {
    name: "routeToDepartment",
    args: {
      reportId: report.id,
      departmentId: matchingDept?.id ?? "",
      urgencyLevel: report.severity,
      reason: matchingDept
        ? `${matchingDept.shortName} handles ${report.category.replace(/_/g, " ").toLowerCase()} reports in ${report.addressText}.`
        : "No matching department was available; queue for manual routing.",
    },
  };

  if (!matchingDept) return fallback;

  const liveCall = await liveAgentToolCall(
    `Choose the correct routing tool call for this verified civic report.

Report:
${JSON.stringify(compactReportForAgent(report), null, 2)}

Available departments:
${JSON.stringify(departments, null, 2)}

Call routeToDepartment with the best departmentId. Use urgencyLevel equal to the public safety urgency, considering severity, category, age, and evidence quality.`,
    "routeToDepartment"
  );

  return normalizeToolCall(liveCall, fallback);
}

export async function chooseEscalationToolCall(
  report: Report,
  reason: string
): Promise<AgentToolCall> {
  const fallback: AgentToolCall = {
    name: "escalateTicket",
    args: {
      reportId: report.id,
      reason,
    },
  };

  const liveCall = await liveAgentToolCall(
    `A community re-verification or SLA check failed. Decide the correct tool call.

Report:
${JSON.stringify(compactReportForAgent(report), null, 2)}

Failure reason: ${reason}

If the issue is still broken, partially fixed, publicly unsafe, or over SLA, call escalateTicket with a concise civic accountability reason.`,
    "escalateTicket"
  );

  return normalizeToolCall(liveCall, fallback);
}

export async function draftPetition(
  input: PetitionDraftInput
): Promise<PetitionDraft> {
  const { report, department } = input;
  const fallback = mockPetitionDraft(report, department);
  const apiKey = process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY;
  const forceMock = process.env.CIVICPULSE_FORCE_MOCK_AI === "true";
  if (forceMock || !apiKey) return fallback;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            subject: { type: SchemaType.STRING },
            body: { type: SchemaType.STRING },
          },
          required: ["subject", "body"],
        },
      },
    });

    const result = await model.generateContent([
      {
        text: `You are a civic legal advocate drafting a formal email petition to the local Municipal Corporator.

Generate a context-aware email template using the report metadata below. Cite the specific infrastructure hazards inferred from the image analysis and report details. Keep the tone formal, firm, and actionable. Ask for inspection, remediation, written status updates, and public accountability.

Return JSON with subject and body only.

Report metadata:
${JSON.stringify(compactReportForAgent(report), null, 2)}

Routed department:
${JSON.stringify(department ?? null, null, 2)}

Community support:
Upvotes/signatures: ${report.upvoteCount}
Merged duplicate reports: ${report.duplicateCount}`,
      },
    ]);

    const json = JSON.parse(result.response.text());
    return {
      subject: String(json.subject || fallback.subject).slice(0, 140),
      body: String(json.body || fallback.body).slice(0, 4000),
      source: "live",
    };
  } catch (err) {
    console.error("[CivicPulse] Gemini petition draft failed, falling back to mock:", err);
    return fallback;
  }
}

async function liveAgentToolCall(
  prompt: string,
  allowedFunctionName: AgentFunctionName
): Promise<AgentToolCall | null> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY;
  const forceMock = process.env.CIVICPULSE_FORCE_MOCK_AI === "true";
  if (forceMock || !apiKey) return null;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      tools: CIVIC_AGENT_TOOLS,
      toolConfig: {
        functionCallingConfig: {
          mode: FunctionCallingMode.ANY,
          allowedFunctionNames: [allowedFunctionName],
        },
      },
    });

    const result = await model.generateContent(prompt);
    const call = result.response.functionCalls()?.[0];
    if (!call) return null;
    return {
      name: call.name as AgentFunctionName,
      args: call.args as Record<string, unknown>,
    };
  } catch (err) {
    console.error("[CivicPulse] Gemini agent tool selection failed:", err);
    return null;
  }
}

function normalizeToolCall(
  call: AgentToolCall | null,
  fallback: AgentToolCall
): AgentToolCall {
  if (!call || call.name !== fallback.name) return fallback;
  return {
    name: call.name,
    args: { ...fallback.args, ...call.args },
  };
}

function compactReportForAgent(report: Report) {
  return {
    id: report.id,
    title: report.title,
    description: report.description,
    category: report.category,
    severity: report.severity,
    status: report.status,
    addressText: report.addressText,
    wardId: report.wardId,
    upvoteCount: report.upvoteCount,
    duplicateCount: report.duplicateCount,
    confirmCount: report.confirmCount,
    escalationLevel: report.escalationLevel,
    aiConfidence: report.aiConfidence,
    imageAnalysis: report.ai
      ? {
          evidenceQuality: report.ai.visual_evidence_quality,
          fraudSignals: report.ai.potential_fraud_signals,
          estimatedAge: report.ai.estimated_age_of_issue,
          suggestedDescription: report.ai.suggested_description,
        }
      : null,
  };
}

function mockPetitionDraft(
  report: Report,
  department?: Department | null
): PetitionDraft {
  const hazard = report.ai?.suggested_description || report.description;
  const departmentLine = department
    ? `The matter is currently routed to ${department.name} (${department.shortName}).`
    : "The matter requires immediate assignment to the competent municipal department.";

  return {
    subject: `Urgent civic petition: ${report.title} (${report.id})`,
    body: `To,\nThe Municipal Corporator\n${report.addressText}\n\nSubject: Urgent action requested for ${report.title} (${report.id})\n\nRespected Corporator,\n\nWe, the undersigned residents, request immediate intervention regarding the documented civic hazard at ${report.addressText}. CivicPulse report ${report.id} records a severity level of ${report.severity}/5 with ${report.upvoteCount} resident signature${report.upvoteCount === 1 ? "" : "s"} and ${report.duplicateCount} merged duplicate report${report.duplicateCount === 1 ? "" : "s"}.\n\nThe reported infrastructure hazard is: ${hazard}. The image analysis classifies this as ${report.category.replace(/_/g, " ").toLowerCase()} with ${report.ai?.visual_evidence_quality ?? "available"} visual evidence, indicating a material risk to public safety, accessibility, sanitation, or road usability.\n\n${departmentLine}\n\nWe request that your office direct an on-site inspection, initiate remediation, publish the responsible officer and expected completion timeline, and provide a written status update to residents. If temporary barricading, lighting, sanitation control, or traffic diversion is required, we request that interim safety measures be deployed immediately.\n\nSincerely,\nResidents supporting CivicPulse report ${report.id}`,
    source: "mock",
  };
}

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

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicateReportId: string | null;
  reason: string;
}

export async function detectDuplicateReport(
  newReport: { title: string; description: string; category: string; lat: number; lng: number },
  existingOpenReports: Report[]
): Promise<DuplicateCheckResult> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY;
  const forceMock = process.env.CIVICPULSE_FORCE_MOCK_AI === "true";

  const matchingCategoryReports = existingOpenReports.filter(
    (r) => r.category === newReport.category
  );

  const fallback: DuplicateCheckResult = {
    isDuplicate: false,
    duplicateReportId: null,
    reason: "No matching reports found in vicinity."
  };

  // Simple location & category proximity heuristic for fallback
  if (matchingCategoryReports.length > 0) {
    for (const r of matchingCategoryReports) {
      const distance = Math.sqrt(
        Math.pow(r.location.lat - newReport.lat, 2) +
          Math.pow(r.location.lng - newReport.lng, 2)
      );
      // Roughly 200 meters latitude/longitude delta (~0.002 degrees)
      if (distance < 0.002) {
        return {
          isDuplicate: true,
          duplicateReportId: r.id,
          reason: `Auto-merged: Mapped to existing ${r.category.toLowerCase().replace(/_/g, " ")} ticket (${r.id}) at the same location.`
        };
      }
    }
  }

  if (forceMock || !apiKey || matchingCategoryReports.length === 0) {
    return fallback;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            isDuplicate: { type: SchemaType.BOOLEAN },
            duplicateReportId: { type: SchemaType.STRING, nullable: true },
            reason: { type: SchemaType.STRING }
          },
          required: ["isDuplicate", "duplicateReportId", "reason"]
        }
      }
    });

    const prompt = `You are CivicPulse's Duplicate Detection Agent. Determine if the new report matches any of the existing open tickets in the ward. They are duplicates if they describe the same physical problem at approximately the same location.

New Report:
- Category: ${newReport.category}
- Title: ${newReport.title}
- Description: ${newReport.description}
- Coordinates: [${newReport.lat}, ${newReport.lng}]

Existing Open Reports:
${JSON.stringify(matchingCategoryReports.map(r => ({
  id: r.id,
  title: r.title,
  description: r.description,
  category: r.category,
  coordinates: [r.location.lat, r.location.lng]
})), null, 2)}

Instructions:
1. Compare the new report's category, description, and location against the list.
2. If it is describing the exact same issue (e.g. the same garbage pile, pothole on the same street, water leak at same crossing), return isDuplicate=true and the matching duplicateReportId.
3. Provide a clear reason explaining why it is or isn't a duplicate.
4. Output strict JSON.`;

    const result = await model.generateContent(prompt);
    const json = JSON.parse(result.response.text());
    return {
      isDuplicate: !!json.isDuplicate,
      duplicateReportId: json.isDuplicate ? String(json.duplicateReportId || "") : null,
      reason: String(json.reason || "")
    };
  } catch (err) {
    console.error("[CivicPulse AI Duplicates] Gemini duplicate detection failed:", err);
    return fallback;
  }
}
