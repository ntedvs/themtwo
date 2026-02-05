import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { useMutation, useQuery } from "convex/react"
import { useCallback, useEffect, useRef, useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import ConnectionsLayer from "./ConnectionsLayer"
import PersonBox from "./PersonBox"
import Toolbar from "./Toolbar"

export default function Canvas() {
  const people = useQuery(api.people.list)
  const connections = useQuery(api.connections.list)
  const updatePosition = useMutation(api.people.updatePosition)
  const createConnection = useMutation(api.connections.create)

  const [selectedPerson, setSelectedPerson] = useState<Id<"people"> | null>(
    null,
  )

  const [viewport, setViewport] = useState({
    x: 0,
    y: 0,
    scale: 1,
  })

  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [didPan, setDidPan] = useState(false)

  // Refs for stable callbacks
  const connectionsRef = useRef(connections)
  const viewportRef = useRef(viewport)
  const isPanningRef = useRef(isPanning)
  const panStartRef = useRef(panStart)
  const didPanRef = useRef(didPan)

  useEffect(() => {
    connectionsRef.current = connections
  }, [connections])
  useEffect(() => {
    viewportRef.current = viewport
  }, [viewport])
  useEffect(() => {
    isPanningRef.current = isPanning
  }, [isPanning])
  useEffect(() => {
    panStartRef.current = panStart
  }, [panStart])
  useEffect(() => {
    didPanRef.current = didPan
  }, [didPan])

  // Configure sensors with drag threshold to prevent drag/click conflict
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event
    const person = people?.find((p) => p._id === active.id)
    if (person) {
      // Convert screen-space delta to world-space
      const worldDeltaX = delta.x / viewport.scale
      const worldDeltaY = delta.y / viewport.scale

      updatePosition({
        id: person._id,
        positionX: person.positionX + worldDeltaX,
        positionY: person.positionY + worldDeltaY,
      })
    }
  }

  const handlePersonClick = useCallback(
    (personId: Id<"people">) => {
      // Click same person = deselect
      if (selectedPerson === personId) {
        setSelectedPerson(null)
        return
      }

      // First selection
      if (!selectedPerson) {
        setSelectedPerson(personId)
        return
      }

      // Check for duplicate connection (use ref to avoid dep on connections array)
      const existingConnection = connectionsRef.current?.find(
        (c) =>
          (c.personAId === selectedPerson && c.personBId === personId) ||
          (c.personAId === personId && c.personBId === selectedPerson),
      )

      if (existingConnection) {
        setSelectedPerson(null)
        return
      }

      // Second selection = create connection
      createConnection({
        personAId: selectedPerson,
        personBId: personId,
        connectionType: "kissed",
      })
      setSelectedPerson(null)
    },
    [selectedPerson, createConnection],
  )

  // Handle delete of selected person
  useEffect(() => {
    if (selectedPerson && !people?.find((p) => p._id === selectedPerson)) {
      setSelectedPerson(null)
    }
  }, [people, selectedPerson])

  // Click canvas background to deselect (but not after panning)
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !didPanRef.current) {
      setSelectedPerson(null)
    }
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    // Start panning on left or middle mouse button on background elements
    const isBackground =
      e.target === e.currentTarget || // root canvas
      target.classList?.contains("viewport-container") || // viewport container
      target.tagName === "svg" || // ConnectionsLayer SVG
      (target.classList?.contains("absolute") &&
        target.classList?.contains("inset-0")) // dot grid

    if ((e.button === 0 || e.button === 1) && isBackground) {
      e.preventDefault()
      setIsPanning(true)
      setDidPan(false)
      const vp = viewportRef.current
      setPanStart({ x: e.clientX - vp.x, y: e.clientY - vp.y })
    }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanningRef.current) {
      setDidPan(true)
      const ps = panStartRef.current
      setViewport((prev) => ({
        ...prev,
        x: e.clientX - ps.x,
        y: e.clientY - ps.y,
      }))
    }
  }, [])

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const vp = viewportRef.current
    const delta = e.deltaY * 0.001
    const newScale = Math.max(0.1, Math.min(3, vp.scale * (1 + delta)))

    // Zoom toward mouse position
    const rect = e.currentTarget.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const scaleRatio = newScale / vp.scale
    setViewport({
      scale: newScale,
      x: mouseX - (mouseX - vp.x) * scaleRatio,
      y: mouseY - (mouseY - vp.y) * scaleRatio,
    })
  }, [])

  if (!people || !connections) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-amber-50 via-stone-50 to-blue-50">
        <div className="animate-pulse text-sm tracking-wide text-stone-400">
          Loading canvas...
        </div>
      </div>
    )
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-linear-to-br from-amber-50 via-stone-50 to-blue-50"
      onClick={handleCanvasClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      style={{ cursor: isPanning ? "grabbing" : "grab" }}
    >
      {/* Subtle dot grid pattern */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle, #d6d3d1 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <Toolbar selectedPerson={selectedPerson} />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-20 rounded-lg border border-stone-200/60 bg-white/80 px-3 py-2 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col gap-1.5 text-xs text-stone-600">
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-6 rounded-full bg-linear-to-r from-pink-300 to-rose-400" />
            <span>Kissed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-6 rounded-full bg-linear-to-r from-orange-400 to-red-500" />
            <span>Fucked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-6 rounded-full bg-linear-to-r from-slate-400 to-slate-500" />
            <span>Talked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-6 rounded-full bg-linear-to-r from-purple-400 to-purple-500" />
            <span>Dated</span>
          </div>
        </div>
      </div>

      {/* Viewport transform container */}
      <div
        className="viewport-container"
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
          transformOrigin: "0 0",
          willChange: "transform",
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
  )
}
