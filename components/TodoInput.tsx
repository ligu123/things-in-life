"use client";

import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  getToolName,
  isToolUIPart,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";
import {
  Check,
  CircleAlert,
  CornerDownLeft,
  List,
  ListX,
  LoaderCircle,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import {
  type FormEvent,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { runAgentTool, toolSummary } from "@/lib/run-agent-tool";
import { getSnapshot } from "@/lib/todo-store";

const CHAT_HEIGHT_MIN = 48;
const CHAT_HEIGHT_MAX = 480;
const CHAT_HEIGHT_DEFAULT = 176;
const CHAT_RESIZE_CLICK_THRESHOLD = 4;

type TodoInputProps = {
  onAdd: (text: string) => void;
  agentMode: boolean;
  onAgentModeChange: (on: boolean) => void;
};

function clampChatHeight(value: number) {
  return Math.min(CHAT_HEIGHT_MAX, Math.max(CHAT_HEIGHT_MIN, value));
}

function toolActionIcon(toolName: string): ReactNode {
  const className = "size-3.5 shrink-0";
  switch (toolName) {
    case "list_todos":
      return <List className={className} aria-hidden />;
    case "add_todo":
      return <Plus className={className} aria-hidden />;
    case "toggle_todo":
      return <Check className={className} aria-hidden />;
    case "edit_todo":
      return <Pencil className={className} aria-hidden />;
    case "delete_todo":
      return <Trash2 className={className} aria-hidden />;
    case "clear_completed":
      return <ListX className={className} aria-hidden />;
    default:
      return <RotateCcw className={className} aria-hidden />;
  }
}

export function TodoInput({
  onAdd,
  agentMode,
  onAgentModeChange,
}: TodoInputProps) {
  const [text, setText] = useState("");
  const [chatHeight, setChatHeight] = useState(CHAT_HEIGHT_DEFAULT);
  const listRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pinnedMinRef = useRef(false);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/agent",
        body: () => ({ todos: getSnapshot() }),
      }),
    [],
  );

  const { messages, sendMessage, addToolOutput, status, error, clearError } =
    useChat({
      transport,
      sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
      async onToolCall({ toolCall }) {
        if (toolCall.dynamic) return;

        const toolInput =
          "input" in toolCall &&
          toolCall.input &&
          typeof toolCall.input === "object"
            ? (toolCall.input as Record<string, unknown>)
            : {};

        try {
          const output = runAgentTool(toolCall.toolName, toolInput);
          addToolOutput({
            tool: toolCall.toolName,
            toolCallId: toolCall.toolCallId,
            output,
          });
        } catch (err) {
          addToolOutput({
            tool: toolCall.toolName,
            toolCallId: toolCall.toolCallId,
            state: "output-error",
            errorText:
              err instanceof Error ? err.message : "Tool execution failed",
          });
        }
      },
    });

  const busy = agentMode && (status === "submitted" || status === "streaming");
  const canSubmit = Boolean(text.trim()) && !busy;

  useEffect(() => {
    if (agentMode) inputRef.current?.focus();
  }, [agentMode]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 144)}px`;
  }, [text]);

  useEffect(() => {
    if (!agentMode) return;
    const content = contentRef.current;
    if (!content) return;

    const growToContent = () => {
      if (pinnedMinRef.current) return;
      const list = listRef.current;
      const padding = list
        ? parseFloat(getComputedStyle(list).paddingTop) +
          parseFloat(getComputedStyle(list).paddingBottom)
        : 0;
      const needed = Math.ceil(content.getBoundingClientRect().height + padding);
      setChatHeight((height) =>
        needed > height ? clampChatHeight(needed) : height,
      );
    };

    growToContent();
    const observer = new ResizeObserver(growToContent);
    observer.observe(content);
    return () => observer.disconnect();
  }, [agentMode, messages, error, status]);

  async function submit() {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    if (agentMode) {
      clearError();
      pinnedMinRef.current = false;
      setText("");
      await sendMessage({ text: trimmed });
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({
          top: listRef.current.scrollHeight,
          behavior: "smooth",
        });
      });
      return;
    }

    onAdd(trimmed);
    setText("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  }

  function handleChatResizeStart(event: ReactPointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    const handle = event.currentTarget;
    const startY = event.clientY;
    const startHeight = chatHeight;
    let dragged = false;
    handle.setPointerCapture(event.pointerId);

    function onMove(moveEvent: PointerEvent) {
      const delta = startY - moveEvent.clientY;
      if (Math.abs(delta) > CHAT_RESIZE_CLICK_THRESHOLD) {
        dragged = true;
        pinnedMinRef.current = false;
      }
      if (!dragged) return;
      setChatHeight(clampChatHeight(startHeight + delta));
    }

    function onUp(upEvent: PointerEvent) {
      handle.releasePointerCapture(upEvent.pointerId);
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onUp);
      handle.removeEventListener("pointercancel", onUp);

      if (!dragged) {
        setChatHeight((current) => {
          const minimize =
            current >= (CHAT_HEIGHT_MIN + CHAT_HEIGHT_MAX) / 2;
          pinnedMinRef.current = minimize;
          return minimize ? CHAT_HEIGHT_MIN : CHAT_HEIGHT_MAX;
        });
      }
    }

    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onUp);
    handle.addEventListener("pointercancel", onUp);
  }

  return (
    <div className="relative">
      {agentMode ? (
        <div className="absolute inset-x-3 bottom-full z-20 flex flex-col gap-0.5">
          <button
            type="button"
            aria-label="Resize chat height. Click to minimise or maximise."
            onPointerDown={handleChatResizeStart}
            className="flex h-3 w-full cursor-ns-resize items-center justify-center touch-none"
          >
            <span
              className="h-[2px] w-8 rounded-full bg-[var(--line-strong)]/70"
              aria-hidden
            />
          </button>

          <div
            className="overflow-hidden rounded-t-2xl rounded-b-none border-[0.5px] border-b-0 border-[var(--line)] bg-[var(--surface-muted)]"
            style={{ height: chatHeight }}
          >
            <div
              ref={listRef}
              className="h-full overflow-y-auto px-3.5 py-3"
              aria-live="polite"
            >
              <div ref={contentRef}>
                {messages.length === 0 && !error ? (
                  <p className="text-sm text-[var(--muted)]">
                    Agent is on — ask to add, complete, edit, or clear tasks.
                  </p>
                ) : null}

                <div className="flex flex-col gap-6">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={[
                        "flex flex-col gap-1",
                        message.role === "user" ? "items-end" : "items-start",
                      ].join(" ")}
                    >
                      {message.parts.map((part, index) => {
                        if (part.type === "text" && part.text.trim()) {
                          return (
                            <p
                              key={`${message.id}-text-${index}`}
                              className={[
                                "max-w-[85%] whitespace-pre-wrap text-sm",
                                message.role === "user"
                                  ? "text-right text-[var(--ink)]"
                                  : "text-left text-[var(--muted)]",
                              ].join(" ")}
                            >
                              {part.text}
                            </p>
                          );
                        }

                        if (isToolUIPart(part)) {
                          const name = getToolName(part);
                          if (part.state === "output-available") {
                            return (
                              <span
                                key={`${message.id}-${part.toolCallId}`}
                                className="inline-flex max-w-full items-center gap-1.5 rounded-full border-[0.5px] border-[var(--line)] bg-transparent px-2.5 py-1 text-xs text-[var(--muted)]"
                              >
                                {toolActionIcon(name)}
                                <span className="truncate">
                                  {toolSummary(name, part.output)}
                                </span>
                              </span>
                            );
                          }
                          if (
                            part.state === "input-streaming" ||
                            part.state === "input-available" ||
                            part.state === "approval-requested"
                          ) {
                            return (
                              <span
                                key={`${message.id}-${part.toolCallId}`}
                                className="inline-flex items-center gap-1.5 rounded-full border-[0.5px] border-[var(--line)] bg-transparent px-2.5 py-1 text-xs text-[var(--muted)]"
                              >
                                <LoaderCircle
                                  className="size-3.5 shrink-0 animate-spin"
                                  aria-hidden
                                />
                                <span>Working…</span>
                              </span>
                            );
                          }
                          if (part.state === "output-error") {
                            return (
                              <span
                                key={`${message.id}-${part.toolCallId}`}
                                className="inline-flex max-w-full items-center gap-1.5 rounded-full border-[0.5px] border-[var(--danger)]/40 bg-transparent px-2.5 py-1 text-xs text-[var(--danger)]"
                              >
                                <CircleAlert
                                  className="size-3.5 shrink-0"
                                  aria-hidden
                                />
                                <span className="truncate">
                                  {part.errorText || "Tool failed"}
                                </span>
                              </span>
                            );
                          }
                        }

                        return null;
                      })}
                    </div>
                  ))}
                </div>

                {error ? (
                  <p className="mt-2 text-sm text-[var(--danger)]" role="alert">
                    {error.message ||
                      "Something went wrong talking to the agent. Check OPENAI_API_KEY."}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl border-[0.5px] border-[var(--line)] bg-[var(--surface)] shadow-[0_1px_0_rgba(20,40,36,0.04)]"
      >
        <div className="px-4 pt-4 pb-1">
          <label htmlFor="composer-input" className="sr-only">
            {agentMode ? "Message the agent" : "Add a task"}
          </label>
          <textarea
            ref={inputRef}
            id="composer-input"
            rows={1}
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={agentMode ? "Ask the agent…" : "What needs doing?"}
            autoComplete="off"
            disabled={busy}
            className="block min-h-8 w-full resize-none bg-transparent py-1 text-sm leading-relaxed text-[var(--ink)] outline-none placeholder:text-[var(--muted)] disabled:opacity-60"
          />
        </div>

        <div className="flex items-center justify-between gap-3 px-3 pb-3 pt-2">
          <div
            role="toolbar"
            aria-label="Composer functions"
            className="flex min-w-0 flex-wrap items-center gap-1"
          >
            <button
              type="button"
              aria-pressed={agentMode}
              onClick={() => onAgentModeChange(!agentMode)}
              className={[
                "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                agentMode
                  ? "bg-[var(--ink)] text-[var(--surface)]"
                  : "text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]",
              ].join(" ")}
            >
              <span
                className={[
                  "size-1.5 rounded-full",
                  agentMode
                    ? "bg-[var(--surface)]"
                    : "bg-[var(--line-strong)]",
                ].join(" ")}
                aria-hidden
              />
              Agent
            </button>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--ink)] px-3 py-1 text-xs font-medium text-[var(--surface)] transition-[opacity,transform] hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-35"
            >
              {agentMode ? (busy ? "…" : "Send") : "Add"}
              {!busy ? (
                <CornerDownLeft className="size-3.5" aria-hidden />
              ) : null}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
