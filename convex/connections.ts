import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("connections").collect();
  },
});

export const getForPerson = query({
  args: { personId: v.id("people") },
  handler: async (ctx, args) => {
    const asPersonA = await ctx.db
      .query("connections")
      .withIndex("by_personA", (q) => q.eq("personAId", args.personId))
      .collect();
    const asPersonB = await ctx.db
      .query("connections")
      .withIndex("by_personB", (q) => q.eq("personBId", args.personId))
      .collect();

    return [...asPersonA, ...asPersonB];
  },
});

export const create = mutation({
  args: {
    personAId: v.id("people"),
    personBId: v.id("people"),
    connectionType: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("connections", {
      personAId: args.personAId,
      personBId: args.personBId,
      connectionType: args.connectionType,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("connections") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const update = mutation({
  args: {
    id: v.id("connections"),
    connectionType: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      connectionType: args.connectionType,
    });
  },
});
