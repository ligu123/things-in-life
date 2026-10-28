import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  isStepCount,
  streamText,
  type UIMessage,
} from "ai";
import { createAgentTools } from "@/lib/agent-tools";
import { auth } from "@/auth";
import { rateLimit } from "@/lib/rate-limit";
import { listTodosForUser } from "@/lib/todo-db";

export const maxDuration = 30;
export const runtime = "nodejs";

const MAX_MESSAGES = 40;

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!rateLimit(`agent:${userId}`)) {
    return Response.json(
      { error: "Too many assistant requests. Try again in a minute." },
      { status: 429 },
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: "The assistant is unavailable right now." },
      { status: 503 },
    );
  }

  let body: { messages?: UIMessage[] };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const messages = Array.isArray(body.messages)
    ? body.messages.slice(-MAX_MESSAGES)
    : [];

  const todos = await listTodosForUser(userId);

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: [
      "You are a concise todo-list agent for the Things in life app.",
      "Use tools to add, toggle, edit, update deadlines/recurrence, delete, list, or clear completed tasks.",
      "Tasks may have dueDate (YYYY-MM-DD) and recurrence (none|daily|weekly|monthly).",
      "Completing a recurring task rolls its dueDate forward and keeps it incomplete.",
      "Do not invent todo ids — use ids from the snapshot or list_todos.",
      "After tool results, briefly confirm what changed. No markdown fluff.",
      "",
      "Current todos snapshot:",
      JSON.stringify(todos, null, 2),
    ].join("\n"),
    messages: await convertToModelMessages(messages),
    tools: createAgentTools(userId),
    stopWhen: isStepCount(8),
  });

  return result.toUIMessageStreamResponse({
    onError: () => "The assistant is unavailable right now.",
  });
}
