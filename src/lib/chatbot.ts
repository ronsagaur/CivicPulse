import { prisma } from "@/lib/store";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function askChatbot(userMessage: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return "🤖 **CivicPulse Agent Offline**\n\nPlease set the `GEMINI_API_KEY` environment variable in your `.env` file to enable the conversational assistant.";
  }

  // Define reports summary in outer scope so it's accessible in catch block
  let reports: any[] = [];
  try {
    // Retrieve fresh context from SQLite/PostgreSQL
    reports = await prisma.report.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        events: {
          orderBy: { at: "desc" },
          take: 1
        }
      }
    });

    const departments = await prisma.department.findMany();
    const wards = await prisma.ward.findMany();

    // Compile text summaries for Gemini prompt context
    const reportsSummary = reports.map((r) => {
      const lastUpdate = r.events[0]?.label || "Reported";
      return `- **[${r.id}]** ${r.title}
  * Category: ${r.category} | Severity: ${r.severity}/5 | Status: ${r.status}
  * Address: ${r.addressText}
  * Latest Event: ${lastUpdate} (${new Date(r.createdAt).toLocaleDateString()})`;
    }).join("\n\n");

    const deptsSummary = departments.map((d) => {
      return `- **${d.shortName}**: ${d.name} (Handles: ${d.handlesCategories.replace(/,/g, ", ")})`;
    }).join("\n");

    const wardsSummary = wards.map((w) => {
      return `- **${w.name}**: Population ${w.population.toLocaleString()}`;
    }).join("\n");

    const systemPrompt = `You are the CivicPulse Ward Agent, an autonomous AI civic counselor assisting citizens in Andheri West, Mumbai (Ward 14).
Your goal is to provide transparent, helpful, and polite status updates, and guide citizens on how to report or verify issues.

Here is the live database status from our system:

### REGIONAL JURISDICTIONS (WARDS)
${wardsSummary}

### MUNICIPAL DEPARTMENTS
${deptsSummary}

### ACTIVE CIVIC REPORTS (Top 20 Recent)
${reportsSummary || "No active reports currently."}

### INSTRUCTIONS:
1. Answer the citizen's query directly and concisely using the facts above.
2. If they ask about a specific report ID (e.g. CP-8401) or a specific location (e.g. MG Road), lookup the data above and explain its timeline, which department has it (SLA), and its status.
3. If they ask how to report, explain that they can click the "Report an issue" button on the home screen.
4. Keep your formatting clean using standard Markdown (bullet points, bold text). Keep responses under 3-4 paragraphs.
`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: "Hello, who are you and what do you do?" }] },
        {
          role: "model",
          parts: [
            {
              text: "Hello! I am the CivicPulse Ward Agent. I monitor Ward 14's database in real time. I can help you check the status of potholes, garbage piles, sewage leaks, or traffic issues, tell you which department is assigned, and verify if a resolution has been completed by authorities. How can I help you today?",
            },
          ],
        },
      ],
    });

    const result = await chat.sendMessage([
      { text: systemPrompt },
      { text: `Citizen Query: "${userMessage}"` }
    ]);

    return result.response.text();
  } catch (err) {
    console.error("[CivicPulse Chatbot] Error generating response, using SQL RAG fallback:", err);
    
    // Attempt local database lookup fallback if database connection works
    try {
      if (reports.length === 0) {
        reports = await prisma.report.findMany({
          take: 10,
          orderBy: { createdAt: "desc" },
        });
      }

      const query = userMessage.toLowerCase();
      
      // 1. Specific Report ID Lookup
      const matchedId = userMessage.match(/CP-\d+/i)?.[0]?.toUpperCase();
      if (matchedId) {
        const rep = reports.find(r => r.id === matchedId);
        if (rep) {
          return `🤖 **CivicPulse Agent (Database Fallback)**\n\nI found report **${rep.id}** (${rep.title}) in Andheri West:\n- **Status**: ${rep.status.replace(/_/g, " ")}\n- **Location**: ${rep.addressText}\n- **Severity**: ${rep.severity}/5\n- **Details**: ${rep.description || "No further details provided."}\n\n*(Note: Running in database fallback mode due to Gemini quota limits).*`;
        }
      }

      // 2. Category Keyword Match - Potholes
      if (query.includes("pothole") || query.includes("road") || query.includes("hole")) {
        const potholes = reports.filter(r => r.category === "POTHOLE" || r.title.toLowerCase().includes("pothole"));
        if (potholes.length > 0) {
          return `🤖 **CivicPulse Agent (Database Fallback)**\n\nHere are the active **Pothole** issues currently listed:\n\n${potholes.map(p => `- **${p.id}**: ${p.title} at ${p.addressText} (${p.status.replace(/_/g, " ")})`).join("\n")}`;
        }
      }

      // 3. Category Keyword Match - Sewage / Water
      if (query.includes("sewer") || query.includes("water") || query.includes("leak") || query.includes("sewage")) {
        const leaks = reports.filter(r => r.category === "WATER_LEAK" || r.category === "SEWAGE" || r.title.toLowerCase().includes("leak") || r.title.toLowerCase().includes("sew"));
        if (leaks.length > 0) {
          return `🤖 **CivicPulse Agent (Database Fallback)**\n\nHere are the active **Sewage & Water Leak** issues currently listed:\n\n${leaks.map(l => `- **${l.id}**: ${l.title} at ${l.addressText} (${l.status.replace(/_/g, " ")})`).join("\n")}`;
        }
      }

      // 4. Default Greeting / Help
      const openCount = reports.filter(r => r.status !== "CLOSED_VERIFIED" && r.status !== "REJECTED").length;
      return `🤖 **CivicPulse Agent (Database Fallback)**\n\nHello! I am your AI Ward Assistant. My Gemini API key is currently experiencing rate-limiting/quota constraints (429), but I have read Andheri West's database directly:\n\n- **Active Ward Issues**: ${openCount} open reports.\n- **Latest Reports**:\n${reports.slice(0, 3).map(r => `  * **${r.id}**: ${r.title} (${r.status.replace(/_/g, " ")})`).join("\n")}\n\nYou can report new issues at the top of the page, or verify open neighbor alerts!`;
    } catch (dbErr) {
      console.error("[CivicPulse Chatbot] DB Fallback failed:", dbErr);
      return "🤖 *Sorry, I am having trouble fetching the database records right now. Please check your database connection.*";
    }
  }
}
