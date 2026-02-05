import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { useMutation } from "convex/react"
import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
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

export default memo(function PersonBox({
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
  useLayoutEffect(() => {
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

  // Outer div: positioning only, no transitions
  const positionStyle = {
    position: "absolute" as const,
    left: localPosition.x,
    top: localPosition.y,
    transform: CSS.Translate.toString(transform),
  }

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
    onConnectionClick(person._id)
  }, [onConnectionClick, person._id])

  return (
    // Outer: positioning + drag handling, NO transitions
    <div
      ref={setNodeRef}
      style={positionStyle}
      {...listeners}
      {...attributes}
      onClick={handleClick}
      className="relative z-10 cursor-grab active:cursor-grabbing"
    >
      {/* Inner: visual effects WITH transitions */}
      <div
        className={`w-32 rounded-xl border border-stone-200/60 bg-white p-4 shadow-md shadow-stone-200/60 transition-[shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-stone-300/70 ${isSelected ? "ring-2 shadow-coral-200 ring-coral-400 ring-offset-2" : ""} ${isDragging ? "scale-105 rotate-2 opacity-60" : ""} `}
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
})
