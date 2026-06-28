import { NextResponse } from "next/server";
import { askChatbot } from "@/lib/chatbot";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    if (!message) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }
    const response = await askChatbot(message);
    return NextResponse.json({ response });
  } catch (err: any) {
    console.error("[Chatbot API] Error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
