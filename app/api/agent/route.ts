import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai";
import { auth } from "@/auth";
import { agentTools } from "@/lib/agent-tools";
import type { Todo } from "@/lib/types";

export const maxDuration = 30;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      {
        error:
          "Missing OPENAI_API_KEY. Add it to .env.local and restart the dev server.",
      },
      { status: 500 },
    );
  }

  let body: { messages?: UIMessage[]; todos?: Todo[] };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const messages = body.messages ?? [];
  const todos = Array.isArray(body.todos) ? body.todos : [];

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: [
      "You are a concise todo-list agent for the Lista app.",
      "Use tools to add, toggle, edit, delete, list, or clear completed tasks.",
      "Do not invent todo ids — use ids from the snapshot or list_todos.",
      "After tool results, briefly confirm what changed. No markdown fluff.",
      "",
      "Current todos snapshot:",
      JSON.stringify(todos, null, 2),
    ].join("\n"),
    messages: await convertToModelMessages(messages),
    tools: agentTools,
  });

  return result.toUIMessageStreamResponse();
}
