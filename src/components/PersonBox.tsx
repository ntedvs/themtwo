import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { useMutation } from "convex/react"
import { useEffect, useRef, useState } from "react"
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
  onConnectionClick: (personId: Id<"people">) => void
}

export default function PersonBox({
  person,
  isSelected,
  onConnectionClick,
}: PersonBoxProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(person.name)
  const [localPosition, setLocalPosition] = useState({
    x: person.positionX,
    y: person.positionY,
  })
  const rename = useMutation(api.people.rename)
  const remove = useMutation(api.people.remove)

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: person._id,
    })

  const lastTransform = useRef<typeof transform>(null)
  const prevIsDragging = useRef(false)

  // Capture transform while dragging
  useEffect(() => {
    if (isDragging && transform) {
      lastTransform.current = transform
    }
  }, [isDragging, transform])

  // When drag ends, optimistically update local position
  useEffect(() => {
    if (prevIsDragging.current && !isDragging && lastTransform.current) {
      const finalTransform = lastTransform.current
      setLocalPosition((prev) => ({
        x: prev.x + finalTransform.x,
        y: prev.y + finalTransform.y,
      }))
      lastTransform.current = null
    }
    prevIsDragging.current = isDragging
  }, [isDragging])

  // Sync with Convex updates
  useEffect(() => {
    setLocalPosition({ x: person.positionX, y: person.positionY })
  }, [person.positionX, person.positionY])

  const style = {
    position: "absolute" as const,
    left: localPosition.x,
    top: localPosition.y,
    transform: CSS.Translate.toString(transform),
  }

  const handleSaveName = () => {
    if (editName.trim()) {
      rename({ id: person._id, name: editName.trim() })
    }
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (confirm(`Delete ${person.name}?`)) {
      remove({ id: person._id })
    }
  }

  const handleClick = () => {
    onConnectionClick(person._id)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={handleClick}
      className={`relative z-10 w-32 bg-white rounded-xl shadow-md shadow-stone-200/60 border border-stone-200/60 p-4 ${
        !isDragging ? "transition-shadow transition-transform duration-200" : ""
      } cursor-grab active:cursor-grabbing hover:shadow-lg hover:shadow-stone-300/70 hover:-translate-y-0.5 ${
        isSelected ? "ring-2 ring-coral-400 ring-offset-2 shadow-coral-200" : ""
      } ${
        isDragging ? "opacity-60 scale-105 rotate-2" : ""
      }`}
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
            className="text-sm font-serif text-stone-800 bg-stone-50 border border-stone-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        ) : (
          <div
            onDoubleClick={() => setIsEditing(true)}
            className="text-sm font-serif text-stone-800 font-medium leading-tight cursor-text hover:text-blue-600 transition-colors"
          >
            {person.name}
          </div>
        )}
        <button
          onClick={handleDelete}
          onPointerDown={(e) => e.stopPropagation()}
          className="text-xs text-stone-400 hover:text-red-500 transition-colors self-start opacity-60 hover:opacity-100"
        >
          × Delete
        </button>
      </div>
    </div>
  )
}
