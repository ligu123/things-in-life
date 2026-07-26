import { TodoApp } from "@/components/TodoApp";

export default function Home() {
  return (
    <div className="app-canvas flex min-h-dvh flex-1 flex-col">
      <main className="flex flex-1 flex-col">
        <TodoApp />
      </main>
    </div>
  );
}
