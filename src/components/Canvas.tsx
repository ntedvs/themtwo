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
  const validSelectedPerson =
    selectedPerson && people?.find((p) => p._id === selectedPerson)
      ? selectedPerson
      : null
  const [activeDrag, setActiveDrag] = useState<{
    id: Id<"people">
    deltaX: number
    deltaY: number
  } | null>(null)

  // Viewport state (pan & zoom)
  const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 })
  const [isPanning, setIsPanning] = useState(false)
  const panRef = useRef({ startX: 0, startY: 0, didPan: false })

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement
      const isBackground =
        e.target === e.currentTarget ||
        target.classList?.contains("viewport-container") ||
        target.tagName === "svg" ||
        (target.classList?.contains("absolute") &&
          target.classList?.contains("inset-0"))

      if ((e.button === 0 || e.button === 1) && isBackground) {
        e.preventDefault()
        setIsPanning(true)
        panRef.current = {
          startX: e.clientX - viewport.x,
          startY: e.clientY - viewport.y,
          didPan: false,
        }
      }
    },
    [viewport.x, viewport.y],
  )

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        panRef.current.didPan = true
        setViewport((v) => ({
          ...v,
          x: e.clientX - panRef.current.startX,
          y: e.clientY - panRef.current.startY,
        }))
      }
    },
    [isPanning],
  )

  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const delta = e.deltaY * 0.001
    setViewport((v) => {
      const newScale = Math.max(0.1, Math.min(3, v.scale * (1 + delta)))
      const scaleRatio = newScale / v.scale
      return {
        scale: newScale,
        x: mouseX - (mouseX - v.x) * scaleRatio,
        y: mouseY - (mouseY - v.y) * scaleRatio,
      }
    })
  }, [])

  // Drag handling - store scale at drag start so effect doesn't need to track it
  const dragRef = useRef<{
    id: Id<"people">
    startX: number
    startY: number
    originX: number
    originY: number
    scale: number
  } | null>(null)

  const handleDragStart = useCallback(
    (id: Id<"people">, e: React.MouseEvent) => {
      const person = people?.find((p) => p._id === id)
      if (!person) return
      e.stopPropagation()
      dragRef.current = {
        id,
        startX: e.clientX,
        startY: e.clientY,
        originX: person.positionX,
        originY: person.positionY,
        scale: viewport.scale,
      }
    },
    [people, viewport.scale],
  )

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return
      const drag = dragRef.current
      const deltaX = (e.clientX - drag.startX) / drag.scale
      const deltaY = (e.clientY - drag.startY) / drag.scale
      setActiveDrag({ id: drag.id, deltaX, deltaY })
    }

    const handleMouseUp = async (e: MouseEvent) => {
      if (!dragRef.current) return
      const drag = dragRef.current
      dragRef.current = null
      // Compute final position from mouse event directly
      const deltaX = (e.clientX - drag.startX) / drag.scale
      const deltaY = (e.clientY - drag.startY) / drag.scale
      // Await mutation so server position updates before we clear the drag offset
      await updatePosition({
        id: drag.id,
        positionX: drag.originX + deltaX,
        positionY: drag.originY + deltaY,
      })
      setActiveDrag(null)
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [updatePosition])

  const handlePersonClick = useCallback(
    (personId: Id<"people">) => {
      if (validSelectedPerson === personId) {
        setSelectedPerson(null)
        return
      }
      if (!validSelectedPerson) {
        setSelectedPerson(personId)
        return
      }
      const existingConnection = connections?.find(
        (c) =>
          (c.personAId === validSelectedPerson && c.personBId === personId) ||
          (c.personAId === personId && c.personBId === validSelectedPerson),
      )
      if (existingConnection) {
        setSelectedPerson(null)
        return
      }
      createConnection({
        personAId: validSelectedPerson,
        personBId: personId,
        connectionType: "kissed",
      })
      setSelectedPerson(null)
    },
    [validSelectedPerson, connections, createConnection],
  )

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !panRef.current.didPan) {
      setSelectedPerson(null)
    }
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
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onWheel={handleWheel}
      style={{ cursor: isPanning ? "grabbing" : "grab" }}
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle, #d6d3d1 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <Toolbar selectedPerson={validSelectedPerson} />

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
        <ConnectionsLayer
          people={people}
          connections={connections}
          activeDrag={activeDrag}
        />
        {people.map((person) => (
          <PersonBox
            key={person._id}
            person={person}
            isSelected={validSelectedPerson === person._id}
            dragOffset={
              activeDrag?.id === person._id
                ? { x: activeDrag.deltaX, y: activeDrag.deltaY }
                : null
            }
            onDragStart={handleDragStart}
            onConnectionClick={handlePersonClick}
          />
        ))}
      </div>
    </div>
  )
}
