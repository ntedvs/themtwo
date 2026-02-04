import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useQuery, useMutation } from "convex/react";
import { useState, useEffect } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import PersonBox from "./PersonBox";
import ConnectionsLayer from "./ConnectionsLayer";
import Toolbar from "./Toolbar";

export default function Canvas() {
  const people = useQuery(api.people.list);
  const connections = useQuery(api.connections.list);
  const updatePosition = useMutation(api.people.updatePosition);
  const createConnection = useMutation(api.connections.create);

  const [selectedPerson, setSelectedPerson] = useState<Id<"people"> | null>(
    null,
  );

  // Configure sensors with drag threshold to prevent drag/click conflict
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const person = people?.find((p) => p._id === active.id);
    if (person) {
      updatePosition({
        id: person._id,
        positionX: person.positionX + delta.x,
        positionY: person.positionY + delta.y,
      });
    }
  };

  const handlePersonClick = (personId: Id<"people">) => {
    // Click same person = deselect
    if (selectedPerson === personId) {
      setSelectedPerson(null);
      return;
    }

    // First selection
    if (!selectedPerson) {
      setSelectedPerson(personId);
      return;
    }

    // Check for duplicate connection
    const existingConnection = connections?.find(
      (c) =>
        (c.personAId === selectedPerson && c.personBId === personId) ||
        (c.personAId === personId && c.personBId === selectedPerson)
    );

    if (existingConnection) {
      setSelectedPerson(null);
      return;
    }

    // Second selection = create connection
    createConnection({
      personAId: selectedPerson,
      personBId: personId,
      connectionType: "kissed",
    });
    setSelectedPerson(null);
  };

  // Handle delete of selected person
  useEffect(() => {
    if (selectedPerson && !people?.find(p => p._id === selectedPerson)) {
      setSelectedPerson(null);
    }
  }, [people, selectedPerson]);

  // Click canvas background to deselect
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedPerson(null);
    }
  };

  if (!people || !connections) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-blue-50 flex items-center justify-center">
        <div className="text-stone-400 text-sm tracking-wide animate-pulse">Loading canvas...</div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-blue-50 overflow-hidden relative"
      onClick={handleCanvasClick}
    >
      {/* Subtle dot grid pattern */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'radial-gradient(circle, #d6d3d1 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      <Toolbar selectedPerson={selectedPerson} />
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <ConnectionsLayer people={people} connections={connections} />
        {people.map((person) => (
          <PersonBox
            key={person._id}
            person={person}
            isSelected={selectedPerson === person._id}
            onConnectionClick={handlePersonClick}
          />
        ))}
      </DndContext>
    </div>
  );
}
