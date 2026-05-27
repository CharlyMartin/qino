import { describe, expect, test, vi } from "vitest";

import type { Segment } from "./parse-path";
import { walkAndSet } from "./walk-and-set";

const upper = async (leaf: unknown) =>
  typeof leaf == "string" ? leaf.toUpperCase() : leaf;

describe("walkAndSet", () => {
  test("calls setLeaf with the value and returns its result when segments are empty", async () => {
    const setLeaf = vi.fn(async (leaf: unknown) => `wrapped:${String(leaf)}`);

    const result = await walkAndSet({
      value: "hello",
      segments: [],
      setLeaf,
    });

    expect(result).toBe("wrapped:hello");
    expect(setLeaf).toHaveBeenCalledTimes(1);
    expect(setLeaf).toHaveBeenCalledWith("hello");
  });

  test("walks a single key and returns a new object with the leaf transformed", async () => {
    const segments: Array<Segment> = [{ kind: "key", name: "name" }];

    const result = await walkAndSet({
      value: { name: "alice" },
      segments,
      setLeaf: upper,
    });

    expect(result).toEqual({ name: "ALICE" });
  });

  test("walks nested keys", async () => {
    const segments: Array<Segment> = [
      { kind: "key", name: "profile" },
      { kind: "key", name: "name" },
    ];

    const result = await walkAndSet({
      value: { profile: { name: "alice", age: 30 } },
      segments,
      setLeaf: upper,
    });

    expect(result).toEqual({ profile: { name: "ALICE", age: 30 } });
  });

  test("spreads setLeaf across each array item via Promise.all", async () => {
    const segments: Array<Segment> = [{ kind: "array" }];
    const setLeaf = vi.fn(upper);

    const result = await walkAndSet({
      value: ["a", "b", "c"],
      segments,
      setLeaf,
    });

    expect(result).toEqual(["A", "B", "C"]);
    expect(setLeaf).toHaveBeenCalledTimes(3);
  });

  test("walks a mixed key → array → key path", async () => {
    const segments: Array<Segment> = [
      { kind: "key", name: "tags" },
      { kind: "array" },
      { kind: "key", name: "slug" },
    ];

    const result = await walkAndSet({
      value: {
        tags: [{ slug: "a" }, { slug: "b" }],
        title: "post",
      },
      segments,
      setLeaf: upper,
    });

    expect(result).toEqual({
      tags: [{ slug: "A" }, { slug: "B" }],
      title: "post",
    });
  });

  test("returns the value unchanged when an intermediate key is missing", async () => {
    const segments: Array<Segment> = [
      { kind: "key", name: "missing" },
      { kind: "key", name: "name" },
    ];
    const setLeaf = vi.fn(upper);
    const value = { name: "alice" };

    const result = await walkAndSet({ value, segments, setLeaf });

    expect(result).toBe(value);
    expect(setLeaf).not.toHaveBeenCalled();
  });

  test("returns null unchanged when value is null at a key segment", async () => {
    const segments: Array<Segment> = [{ kind: "key", name: "name" }];

    const result = await walkAndSet({ value: null, segments, setLeaf: upper });

    expect(result).toBeNull();
  });

  test("returns a primitive unchanged when value is a string at a key segment", async () => {
    const segments: Array<Segment> = [{ kind: "key", name: "name" }];

    const result = await walkAndSet({
      value: "scalar",
      segments,
      setLeaf: upper,
    });

    expect(result).toBe("scalar");
  });

  test("returns an array unchanged when value is an array at a key segment", async () => {
    const segments: Array<Segment> = [{ kind: "key", name: "name" }];
    const value = ["a", "b"];

    const result = await walkAndSet({ value, segments, setLeaf: upper });

    expect(result).toBe(value);
  });

  test("throws with [*] and the typeof when an array segment hits a non-array", async () => {
    const segments: Array<Segment> = [{ kind: "array" }];

    await expect(
      walkAndSet({ value: { not: "array" }, segments, setLeaf: upper }),
    ).rejects.toThrow(/\[\*\].*object/);
  });

  test("does not mutate the input object when setLeaf returns a new leaf", async () => {
    const segments: Array<Segment> = [
      { kind: "key", name: "profile" },
      { kind: "key", name: "name" },
    ];
    const input = { profile: { name: "alice", age: 30 } };

    const result = await walkAndSet({ value: input, segments, setLeaf: upper });

    expect(input).toEqual({ profile: { name: "alice", age: 30 } });
    expect(result).not.toBe(input);
    expect((result as { profile: object }).profile).not.toBe(input.profile);
  });

  test("does not mutate the input array when walking an array segment", async () => {
    const segments: Array<Segment> = [{ kind: "array" }];
    const input = ["a", "b", "c"];

    const result = await walkAndSet({ value: input, segments, setLeaf: upper });

    expect(input).toEqual(["a", "b", "c"]);
    expect(result).not.toBe(input);
  });
});
