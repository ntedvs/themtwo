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

  const [viewport, setViewport] = useState({
    x: 0,
    y: 0,
    scale: 1,
  });

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [didPan, setDidPan] = useState(false);

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
      // Convert screen-space delta to world-space
      const worldDeltaX = delta.x / viewport.scale;
      const worldDeltaY = delta.y / viewport.scale;

      updatePosition({
        id: person._id,
        positionX: person.positionX + worldDeltaX,
        positionY: person.positionY + worldDeltaY,
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

  // Click canvas background to deselect (but not after panning)
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !didPan) {
      setSelectedPerson(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Start panning on left or middle mouse button on background elements
    const isBackground =
      e.target === e.currentTarget || // root canvas
      target.classList?.contains('viewport-container') || // viewport container
      target.tagName === 'svg' || // ConnectionsLayer SVG
      (target.classList?.contains('absolute') && target.classList?.contains('inset-0')); // dot grid

    if ((e.button === 0 || e.button === 1) && isBackground) {
      e.preventDefault();
      setIsPanning(true);
      setDidPan(false);
      setPanStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setDidPan(true);
      setViewport(prev => ({
        ...prev,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      }));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * 0.001;
    const newScale = Math.max(0.1, Math.min(3, viewport.scale * (1 + delta)));

    // Zoom toward mouse position
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const scaleRatio = newScale / viewport.scale;
    setViewport({
      scale: newScale,
      x: mouseX - (mouseX - viewport.x) * scaleRatio,
      y: mouseY - (mouseY - viewport.y) * scaleRatio,
    });
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
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
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

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border border-stone-200/60 px-3 py-2 z-20">
        <div className="flex flex-col gap-1.5 text-xs text-stone-600">
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 rounded-full bg-gradient-to-r from-pink-300 to-rose-400" />
            <span>Kissed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 rounded-full bg-gradient-to-r from-orange-400 to-red-500" />
            <span>Fucked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 rounded-full bg-gradient-to-r from-purple-400 to-purple-500" />
            <span>Dated</span>
          </div>
        </div>
      </div>

      {/* Viewport transform container */}
      <div
        className="viewport-container"
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
          transformOrigin: '0 0',
          willChange: 'transform',
        }}
      >
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
    </div>
  );
}
