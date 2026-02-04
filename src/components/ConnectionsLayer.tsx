import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import ConnectionLine from "./ConnectionLine";

interface ConnectionsLayerProps {
  people: Array<{
    _id: Id<"people">;
    name: string;
    positionX: number;
    positionY: number;
  }>;
  connections: Array<{
    _id: Id<"connections">;
    personAId: Id<"people">;
    personBId: Id<"people">;
    connectionType: string;
  }>;
}

export default function ConnectionsLayer({
  people,
  connections,
}: ConnectionsLayerProps) {
  const peopleMap = new Map(people.map((p) => [p._id, p]));
  const updateConnection = useMutation(api.connections.update);

  const handleConnectionToggle = (connectionId: Id<"connections">, currentType: string) => {
    const newType = currentType === "kissed" ? "fucked" : "kissed";
    updateConnection({
      id: connectionId,
      connectionType: newType,
    });
  };

  return (
    <svg className="absolute inset-0 w-full h-full z-0">
      {connections.map((conn) => {
        const personA = peopleMap.get(conn.personAId);
        const personB = peopleMap.get(conn.personBId);

        if (!personA || !personB) return null;

        return (
          <ConnectionLine
            key={conn._id}
            connectionId={conn._id}
            personA={personA}
            personB={personB}
            connectionType={conn.connectionType}
            onToggle={handleConnectionToggle}
          />
        );
      })}
    </svg>
  );
}
