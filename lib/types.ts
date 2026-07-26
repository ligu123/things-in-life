export type Recurrence = "none" | "daily" | "weekly" | "monthly";

export type Todo = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  dueDate: string | null; // YYYY-MM-DD local calendar date, or null
  recurrence: Recurrence;
};

export type TodoFilter = "all" | "active" | "completed";
