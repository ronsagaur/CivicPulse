import { PrismaClient } from "@prisma/client";
import { GoogleGenerativeAI } from "@google/generative-ai";

const prisma = new PrismaClient();

export async function askChatbot(userMessage: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return "🤖 **CivicPulse Agent Offline**\n\nPlease set the `GEMINI_API_KEY` environment variable in your `.env` file to enable the conversational assistant.";
  }

  try {
    // Retrieve fresh context from SQLite/PostgreSQL
    const reports = await prisma.report.findMany({
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
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
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
    console.error("[CivicPulse Chatbot] Error generating response:", err);
    return "🤖 *Sorry, I am having trouble fetching the database records right now. Please try again in a moment.*";
  }
}
