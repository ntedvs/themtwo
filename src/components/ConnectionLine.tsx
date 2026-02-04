import { useState } from "react";
import type { Id } from "../../convex/_generated/dataModel";

interface ConnectionLineProps {
  connectionId: Id<"connections">;
  personA: { positionX: number; positionY: number };
  personB: { positionX: number; positionY: number };
  connectionType: string;
  onToggle: (id: Id<"connections">, currentType: string) => void;
  isPulsing: boolean;
}

const BOX_WIDTH = 128; // w-32 = 8rem = 128px
const BOX_HEIGHT = 80;

function calculateControlPoint(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const offset = Math.min(distance * 0.3, 100);

  return {
    cx: midX - (dy * offset) / distance,
    cy: midY + (dx * offset) / distance,
  };
}

export default function ConnectionLine({
  connectionId,
  personA,
  personB,
  connectionType,
  onToggle,
  isPulsing,
}: ConnectionLineProps) {
  const [isHovered, setIsHovered] = useState(false);
  // Calculate center points of boxes in world space
  const x1 = personA.positionX + BOX_WIDTH / 2;
  const y1 = personA.positionY + BOX_HEIGHT / 2;
  const x2 = personB.positionX + BOX_WIDTH / 2;
  const y2 = personB.positionY + BOX_HEIGHT / 2;

  const { cx, cy } = calculateControlPoint(x1, y1, x2, y2);

  // Color based on connection type
  const strokeColor = connectionType === "kissed"
    ? "url(#gradient-kissed)"
    : connectionType === "fucked"
    ? "url(#gradient-fucked)"
    : "url(#gradient-dated)";

  return (
    <>
      <defs>
        <linearGradient id="gradient-kissed" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: "#f9a8d4", stopOpacity: 0.8 }} />
          <stop offset="100%" style={{ stopColor: "#fb7185", stopOpacity: 0.8 }} />
        </linearGradient>
        <linearGradient id="gradient-fucked" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: "#fb923c", stopOpacity: 0.8 }} />
          <stop offset="100%" style={{ stopColor: "#ef4444", stopOpacity: 0.8 }} />
        </linearGradient>
        <linearGradient id="gradient-dated" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: "#c084fc", stopOpacity: 0.8 }} />
          <stop offset="100%" style={{ stopColor: "#a855f7", stopOpacity: 0.8 }} />
        </linearGradient>
      </defs>

      {/* Invisible wide path for easy clicking/hovering */}
      <path
        d={`M ${x1},${y1} Q ${cx},${cy} ${x2},${y2}`}
        stroke="transparent"
        strokeWidth="20"
        fill="none"
        strokeLinecap="round"
        style={{ cursor: 'pointer' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          onToggle(connectionId, connectionType);
        }}
      />

      {/* Visible path with animated width */}
      <path
        d={`M ${x1},${y1} Q ${cx},${cy} ${x2},${y2}`}
        stroke={strokeColor}
        strokeWidth={isPulsing ? "10" : isHovered ? "5" : "2.5"}
        fill="none"
        strokeLinecap="round"
        className="drop-shadow-sm transition-[stroke-width] duration-200 pointer-events-none"
      />
    </>
  );
}
