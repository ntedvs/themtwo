import { useMutation } from "convex/react"
import { memo, useCallback, useEffect, useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import ConnectionLine from "./ConnectionLine"

interface ConnectionsLayerProps {
  people: Array<{
    _id: Id<"people">
    positionX: number
    positionY: number
  }>
  connections: Array<{
    _id: Id<"connections">
    personAId: Id<"people">
    personBId: Id<"people">
    connectionType: string
  }>
  activeDrag: {
    id: Id<"people">
    deltaX: number
    deltaY: number
  } | null
}

const GRADIENTS = (
  <defs>
    <linearGradient id="gradient-kissed" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style={{ stopColor: "#f9a8d4", stopOpacity: 0.8 }} />
      <stop offset="100%" style={{ stopColor: "#fb7185", stopOpacity: 0.8 }} />
    </linearGradient>
    <linearGradient id="gradient-fucked" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style={{ stopColor: "#fb923c", stopOpacity: 0.8 }} />
      <stop offset="100%" style={{ stopColor: "#ef4444", stopOpacity: 0.8 }} />
    </linearGradient>
    <linearGradient id="gradient-talked" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style={{ stopColor: "#94a3b8", stopOpacity: 0.8 }} />
      <stop offset="100%" style={{ stopColor: "#64748b", stopOpacity: 0.8 }} />
    </linearGradient>
    <linearGradient id="gradient-dated" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style={{ stopColor: "#c084fc", stopOpacity: 0.8 }} />
      <stop offset="100%" style={{ stopColor: "#a855f7", stopOpacity: 0.8 }} />
    </linearGradient>
  </defs>
)

function getPosition(
  person: { positionX: number; positionY: number },
  activeDrag: ConnectionsLayerProps["activeDrag"],
  id: Id<"people">,
) {
  if (activeDrag && activeDrag.id === id) {
    return {
      positionX: person.positionX + activeDrag.deltaX,
      positionY: person.positionY + activeDrag.deltaY,
    }
  }
  return person
}

export default memo(function ConnectionsLayer({
  people,
  connections,
  activeDrag,
}: ConnectionsLayerProps) {
  const updateConnection = useMutation(api.connections.update)
  const [pulsingConnectionId, setPulsingConnectionId] =
    useState<Id<"connections"> | null>(null)

  useEffect(() => {
    if (pulsingConnectionId) {
      const timer = setTimeout(() => setPulsingConnectionId(null), 300)
      return () => clearTimeout(timer)
    }
  }, [pulsingConnectionId])

  const handleConnectionToggle = useCallback(
    (connectionId: Id<"connections">, currentType: string) => {
      const types = ["kissed", "fucked", "talked", "dated"]
      const currentIndex = types.indexOf(currentType)
      const newType = types[(currentIndex + 1) % types.length]
      setPulsingConnectionId(connectionId)
      updateConnection({ id: connectionId, connectionType: newType })
    },
    [updateConnection],
  )

  return (
    <svg
      className="absolute inset-0 z-0 h-full w-full"
      style={{ overflow: "visible" }}
    >
      {GRADIENTS}
      {connections.map((conn) => {
        const personA = people.find((p) => p._id === conn.personAId)
        const personB = people.find((p) => p._id === conn.personBId)
        if (!personA || !personB) return null

        return (
          <ConnectionLine
            key={conn._id}
            connectionId={conn._id}
            personA={getPosition(personA, activeDrag, conn.personAId)}
            personB={getPosition(personB, activeDrag, conn.personBId)}
            connectionType={conn.connectionType}
            onToggle={handleConnectionToggle}
            isPulsing={pulsingConnectionId === conn._id}
          />
        )
      })}
    </svg>
  )
})
