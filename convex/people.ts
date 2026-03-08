import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("people").collect();
  },
});

export const get = query({
  args: { id: v.id("people") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("people").collect();
    const occupied = existing.map((p) => ({ x: p.positionX, y: p.positionY }));

    const minDist = 180; // minimum distance between node centers
    let positionX = 0;
    let positionY = 0;
    let placed = false;

    // Try random positions, checking for overlap
    for (let attempt = 0; attempt < 100; attempt++) {
      const cx = Math.random() * 500 + 100;
      const cy = Math.random() * 400 + 100;
      const tooClose = occupied.some(
        (o) => Math.hypot(o.x - cx, o.y - cy) < minDist,
      );
      if (!tooClose) {
        positionX = cx;
        positionY = cy;
        placed = true;
        break;
      }
    }

    // If no non-overlapping spot found, place in a grid extension
    if (!placed) {
      const cols = Math.ceil(Math.sqrt(existing.length + 1));
      const idx = existing.length;
      positionX = 100 + (idx % cols) * 200;
      positionY = 100 + Math.floor(idx / cols) * 200;
    }

    return await ctx.db.insert("people", {
      name: args.name,
      positionX,
      positionY,
    });
  },
});

export const updatePosition = mutation({
  args: {
    id: v.id("people"),
    positionX: v.number(),
    positionY: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      positionX: args.positionX,
      positionY: args.positionY,
    });
  },
});

export const rename = mutation({
  args: {
    id: v.id("people"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { name: args.name });
  },
});

export const remove = mutation({
  args: { id: v.id("people") },
  handler: async (ctx, args) => {
    // Delete all connections involving this person
    const connectionsA = await ctx.db
      .query("connections")
      .withIndex("by_personA", (q) => q.eq("personAId", args.id))
      .collect();
    const connectionsB = await ctx.db
      .query("connections")
      .withIndex("by_personB", (q) => q.eq("personBId", args.id))
      .collect();

    for (const conn of [...connectionsA, ...connectionsB]) {
      await ctx.db.delete(conn._id);
    }

    // Delete the person
    await ctx.db.delete(args.id);
  },
});
