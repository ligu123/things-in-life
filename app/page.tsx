import { TodoApp } from "@/components/TodoApp";
import { requireUserId } from "@/lib/session";
import { listTodosForUser } from "@/lib/todo-db";

export default async function Home() {
  const userId = await requireUserId();
  const initialTodos = await listTodosForUser(userId);

  return (
    <div className="app-canvas flex min-h-dvh flex-1 flex-col">
      <main className="flex flex-1 flex-col">
        <TodoApp initialTodos={initialTodos} />
      </main>
    </div>
  );
}
