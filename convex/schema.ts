import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  people: defineTable({
    name: v.string(),
    positionX: v.number(),
    positionY: v.number(),
  }),

  connections: defineTable({
    personAId: v.id("people"),
    personBId: v.id("people"),
    connectionType: v.string(), // "kissed" | "fucked" | extensible
  })
    .index("by_personA", ["personAId"])
    .index("by_personB", ["personBId"]),
});
