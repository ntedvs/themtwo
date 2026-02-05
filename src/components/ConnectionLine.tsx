import { memo, useState } from "react"
import type { Id } from "../../convex/_generated/dataModel"

interface ConnectionLineProps {
  connectionId: Id<"connections">
  personA: { positionX: number; positionY: number }
  personB: { positionX: number; positionY: number }
  connectionType: string
  onToggle: (id: Id<"connections">, currentType: string) => void
  isPulsing: boolean
}

const BOX_WIDTH = 128 // w-32 = 8rem = 128px
const BOX_HEIGHT = 80

function calculateControlPoint(x1: number, y1: number, x2: number, y2: number) {
  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2
  const dx = x2 - x1
  const dy = y2 - y1
  const distance = Math.sqrt(dx * dx + dy * dy)
  const offset = Math.min(distance * 0.3, 100)

  return {
    cx: midX - (dy * offset) / distance,
    cy: midY + (dx * offset) / distance,
  }
}

export default memo(function ConnectionLine({
  connectionId,
  personA,
  personB,
  connectionType,
  onToggle,
  isPulsing,
}: ConnectionLineProps) {
  const [isHovered, setIsHovered] = useState(false)
  // Calculate center points of boxes in world space
  const x1 = personA.positionX + BOX_WIDTH / 2
  const y1 = personA.positionY + BOX_HEIGHT / 2
  const x2 = personB.positionX + BOX_WIDTH / 2
  const y2 = personB.positionY + BOX_HEIGHT / 2

  const { cx, cy } = calculateControlPoint(x1, y1, x2, y2)

  // Color based on connection type
  const strokeColor =
    connectionType === "kissed"
      ? "url(#gradient-kissed)"
      : connectionType === "fucked"
        ? "url(#gradient-fucked)"
        : connectionType === "talked"
          ? "url(#gradient-talked)"
          : "url(#gradient-dated)"

  return (
    <g>
      {/* Invisible wide path for easy clicking/hovering */}
      <path
        d={`M ${x1},${y1} Q ${cx},${cy} ${x2},${y2}`}
        stroke="transparent"
        strokeWidth="20"
        fill="none"
        strokeLinecap="round"
        style={{ cursor: "pointer" }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={(e) => {
          e.stopPropagation()
          onToggle(connectionId, connectionType)
        }}
      />

      {/* Visible path with animated width */}
      <path
        d={`M ${x1},${y1} Q ${cx},${cy} ${x2},${y2}`}
        stroke={strokeColor}
        strokeWidth={isPulsing ? "10" : isHovered ? "5" : "2.5"}
        fill="none"
        strokeLinecap="round"
        className="pointer-events-none transition-[stroke-width] duration-200"
      />
    </g>
  )
})
