import { useMutation } from "convex/react"
import { memo, useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"

interface ToolbarProps {
  selectedPerson: Id<"people"> | null
}

export default memo(function Toolbar({ selectedPerson }: ToolbarProps) {
  const [newName, setNewName] = useState("")
  const createPerson = useMutation(api.people.create)

  const handleAddPerson = () => {
    if (newName.trim()) {
      createPerson({
        name: newName
          .trim()
          .toLowerCase()
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        positionX: Math.random() * 500 + 100,
        positionY: Math.random() * 400 + 100,
      })
      setNewName("")
    }
  }

  return (
    <div className="fixed top-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-stone-200/50 bg-white/80 px-6 py-4 shadow-lg shadow-stone-200/50 backdrop-blur-md">
      <div className="flex items-center gap-3">
        {/* Add Person Section */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddPerson()}
            placeholder="Person name"
            className="rounded-lg border border-stone-200 bg-white/70 px-3 py-1.5 text-sm text-stone-700 transition-all placeholder:text-stone-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-300/50 focus:outline-none"
          />
          <button
            onClick={handleAddPerson}
            className="rounded-lg bg-linear-to-br from-blue-400 to-blue-500 px-4 py-1.5 text-sm font-medium text-white shadow-sm shadow-blue-200 transition-all hover:scale-105 hover:shadow-md hover:shadow-blue-300 active:scale-95"
          >
            Add
          </button>
        </div>

        {/* Status hint */}
        {selectedPerson && (
          <div className="animate-pulse border-l border-stone-200 pl-3 text-xs text-stone-600">
            → Click another person to connect
          </div>
        )}
      </div>
    </div>
  )
})
