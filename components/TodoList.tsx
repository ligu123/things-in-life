"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Todo, UpdateTodoMetaInput } from "@/lib/types";
import { TodoItem, TodoItemOverlay } from "./TodoItem";

type TodoListProps = {
  todos: Todo[];
  onToggle: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onUpdateMeta: (id: string, meta: UpdateTodoMetaInput) => void;
  onDelete: (id: string) => void;
  onReorder: (visibleIds: string[]) => void;
  emptyMessage: string;
};

export function TodoList({
  todos,
  onToggle,
  onEdit,
  onUpdateMeta,
  onDelete,
  onReorder,
  emptyMessage,
}: TodoListProps) {
  const [items, setItems] = useState(todos);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [portalReady, setPortalReady] = useState(false);
  const canReorder = items.length >= 2;

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (activeId !== null) return;
    setItems(todos);
  }, [todos, activeId]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      // Delay so vertical scroll wins over accidental reorders on phones.
      activationConstraint: { delay: 200, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const itemIds = useMemo(() => items.map((todo) => todo.id), [items]);
  const activeTodo = activeId
    ? items.find((todo) => todo.id === activeId) ?? null
    : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItems((current) => {
      const oldIndex = current.findIndex((todo) => todo.id === active.id);
      const newIndex = current.findIndex((todo) => todo.id === over.id);
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return current;
      return arrayMove(current, oldIndex, newIndex);
    });
  }

  function commitOrder(nextItems: Todo[]) {
    const nextIds = nextItems.map((todo) => todo.id);
    const unchanged = nextIds.every((id, index) => id === todos[index]?.id);
    if (!unchanged) {
      onReorder(nextIds);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) {
      setItems(todos);
      return;
    }

    const oldIndex = items.findIndex((todo) => todo.id === active.id);
    const newIndex = items.findIndex((todo) => todo.id === over.id);
    const next =
      oldIndex < 0 || newIndex < 0 || oldIndex === newIndex
        ? items
        : arrayMove(items, oldIndex, newIndex);

    setItems(next);
    commitOrder(next);
  }

  function handleDragCancel() {
    setActiveId(null);
    setItems(todos);
  }

  if (todos.length === 0) {
    return (
      <p className="empty-hint py-10 text-center text-sm text-[var(--muted)]">
        {emptyMessage}
      </p>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <ul className="divide-y-0">
          {items.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={onToggle}
              onEdit={onEdit}
              onUpdateMeta={onUpdateMeta}
              onDelete={onDelete}
              canReorder={canReorder}
            />
          ))}
        </ul>
      </SortableContext>

      {portalReady
        ? createPortal(
            <DragOverlay dropAnimation={null}>
              {activeTodo ? <TodoItemOverlay todo={activeTodo} /> : null}
            </DragOverlay>,
            document.body,
          )
        : null}
    </DndContext>
  );
}
