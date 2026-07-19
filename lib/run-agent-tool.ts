import {
  addTodo,
  clearCompleted,
  deleteTodo,
  editTodo,
  listTodos,
  toggleTodo,
} from "@/lib/todo-actions";

type ToolInput = Record<string, unknown>;

export function runAgentTool(
  toolName: string,
  input: ToolInput,
): unknown {
  switch (toolName) {
    case "list_todos":
      return { todos: listTodos() };

    case "add_todo": {
      const text = String(input.text ?? "").trim();
      if (!text) return { error: "Text is required" };
      return { todo: addTodo(text) };
    }

    case "toggle_todo": {
      const id = String(input.id ?? "");
      const todo = toggleTodo(id);
      return todo
        ? { todo }
        : { error: `Todo not found: ${id}` };
    }

    case "edit_todo": {
      const id = String(input.id ?? "");
      const text = String(input.text ?? "").trim();
      const todo = editTodo(id, text);
      return todo
        ? { todo }
        : { error: `Could not edit todo: ${id}` };
    }

    case "delete_todo": {
      const id = String(input.id ?? "");
      const ok = deleteTodo(id);
      return ok
        ? { deleted: id }
        : { error: `Todo not found: ${id}` };
    }

    case "clear_completed":
      return { removed: clearCompleted() };

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

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
      const todo = record.todo as { text?: string; completed?: boolean } | undefined;
      if (!todo?.text) return "Toggled task";
      return todo.completed
        ? `Completed “${todo.text}”`
        : `Reopened “${todo.text}”`;
    }
    case "edit_todo": {
      const todo = record.todo as { text?: string } | undefined;
      return todo?.text ? `Updated to “${todo.text}”` : "Updated task";
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
