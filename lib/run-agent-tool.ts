export function toolSummary(toolName: string, output: unknown): string {
  if (!output || typeof output !== "object") return `${toolName} done`;

  const record = output as Record<string, unknown>;
  if (typeof record.error === "string") return record.error;

  switch (toolName) {
    case "list_todos": {
      const todos = record.todos;
      const count = Array.isArray(todos) ? todos.length : 0;
      return `Listed ${count} task${count === 1 ? "" : "s"}`;
    }
    case "add_todo": {
      const todo = record.todo as { text?: string } | undefined;
      return todo?.text ? `Added “${todo.text}”` : "Added task";
    }
    case "toggle_todo": {
      const todo = record.todo as {
        text?: string;
        completed?: boolean;
        recurrence?: string;
        dueDate?: string | null;
      } | undefined;
      if (!todo?.text) return "Toggled task";
      if (todo.recurrence && todo.recurrence !== "none") {
        return todo.dueDate
          ? `Rolled “${todo.text}” to ${todo.dueDate}`
          : `Rolled “${todo.text}” forward`;
      }
      return todo.completed
        ? `Completed “${todo.text}”`
        : `Reopened “${todo.text}”`;
    }
    case "edit_todo": {
      const todo = record.todo as { text?: string } | undefined;
      return todo?.text ? `Updated to “${todo.text}”` : "Updated task";
    }
    case "update_todo_meta": {
      const todo = record.todo as {
        text?: string;
        dueDate?: string | null;
        recurrence?: string;
      } | undefined;
      if (!todo?.text) return "Updated schedule";
      const bits: string[] = [];
      if (todo.dueDate) bits.push(`due ${todo.dueDate}`);
      if (todo.recurrence && todo.recurrence !== "none") {
        bits.push(todo.recurrence);
      }
      return bits.length
        ? `Updated “${todo.text}” (${bits.join(", ")})`
        : `Updated “${todo.text}” schedule`;
    }
    case "delete_todo":
      return "Deleted task";
    case "clear_completed": {
      const removed = Number(record.removed ?? 0);
      return `Cleared ${removed} completed task${removed === 1 ? "" : "s"}`;
    }
    default:
      return `${toolName} done`;
  }
}
