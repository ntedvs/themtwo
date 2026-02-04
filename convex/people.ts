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
    positionX: v.number(),
    positionY: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("people", {
      name: args.name,
      positionX: args.positionX,
      positionY: args.positionY,
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
