import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface ToolbarProps {
  selectedPerson: Id<"people"> | null;
}

export default function Toolbar({
  selectedPerson,
}: ToolbarProps) {
  const [newName, setNewName] = useState("");
  const createPerson = useMutation(api.people.create);

  const handleAddPerson = () => {
    if (newName.trim()) {
      createPerson({
        name: newName.trim(),
        positionX: Math.random() * 500 + 100,
        positionY: Math.random() * 400 + 100,
      });
      setNewName("");
    }
  };

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 backdrop-blur-md bg-white/80 rounded-2xl shadow-lg shadow-stone-200/50 border border-stone-200/50 px-6 py-4">
      <div className="flex items-center gap-3">
        {/* Add Person Section */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddPerson()}
            placeholder="Person name"
            className="px-3 py-1.5 rounded-lg border border-stone-200 bg-white/70 text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-300/50 focus:border-blue-300 transition-all"
          />
          <button
            onClick={handleAddPerson}
            className="px-4 py-1.5 rounded-lg bg-gradient-to-br from-blue-400 to-blue-500 text-white text-sm font-medium shadow-sm shadow-blue-200 hover:shadow-md hover:shadow-blue-300 hover:scale-105 active:scale-95 transition-all"
          >
            Add
          </button>
        </div>

        {/* Status hint */}
        {selectedPerson && (
          <div className="text-xs text-stone-600 pl-3 border-l border-stone-200 animate-pulse">
            → Click another person to connect
          </div>
        )}
      </div>
    </div>
  );
}
