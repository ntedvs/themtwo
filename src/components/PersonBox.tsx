import { useMutation } from "convex/react"
import { memo, useCallback, useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"

interface PersonBoxProps {
  person: {
    _id: Id<"people">
    name: string
    positionX: number
    positionY: number
  }
  isSelected: boolean
  dragOffset: { x: number; y: number } | null
  onDragStart: (id: Id<"people">, e: React.MouseEvent) => void
  onConnectionClick: (personId: Id<"people">) => void
}

function PersonBox({
  person,
  isSelected,
  dragOffset,
  onDragStart,
  onConnectionClick,
}: PersonBoxProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(person.name)
  const rename = useMutation(api.people.rename)
  const remove = useMutation(api.people.remove)

  const handleSaveName = useCallback(() => {
    if (editName.trim()) {
      const formatted = editName
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase())
      rename({ id: person._id, name: formatted })
    }
    setIsEditing(false)
  }, [editName, person._id, rename])

  const handleDelete = useCallback(() => {
    if (confirm(`Delete ${person.name}?`)) {
      remove({ id: person._id })
    }
  }, [person._id, person.name, remove])

  const handleClick = useCallback(() => {
    // Skip if we just finished dragging
    if (dragOffset) return
    onConnectionClick(person._id)
  }, [onConnectionClick, person._id, dragOffset])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 0) {
        onDragStart(person._id, e)
      }
    },
    [onDragStart, person._id],
  )

  const isDragging = dragOffset !== null
  const x = person.positionX + (dragOffset?.x ?? 0)
  const y = person.positionY + (dragOffset?.y ?? 0)

  return (
    <div
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      style={{
        position: "absolute",
        left: x,
        top: y,
      }}
      className="relative z-10 cursor-grab active:cursor-grabbing"
    >
      <div
        className={`w-32 rounded-xl border border-stone-200/60 bg-white p-4 shadow-md shadow-stone-200/60 transition-[shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-stone-300/70 ${isSelected ? "ring-2 shadow-coral-200 ring-coral-400 ring-offset-2" : ""} ${isDragging ? "scale-105 rotate-2 opacity-60" : ""}`}
      >
        <div className="flex flex-col gap-2">
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
              autoFocus
              className="rounded border border-stone-300 bg-stone-50 px-2 py-1 font-serif text-sm text-stone-800 focus:ring-2 focus:ring-blue-300 focus:outline-none"
            />
          ) : (
            <div
              onDoubleClick={() => setIsEditing(true)}
              className="cursor-text font-serif text-sm leading-tight font-medium text-stone-800 transition-colors hover:text-blue-600"
            >
              {person.name}
            </div>
          )}
          <button
            onClick={handleDelete}
            onPointerDown={(e) => e.stopPropagation()}
            className="self-start text-xs text-stone-400 opacity-60 transition-colors hover:text-red-500 hover:opacity-100"
          >
            × Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default memo(PersonBox)
