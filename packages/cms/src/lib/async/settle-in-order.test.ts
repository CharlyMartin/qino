import vm from "node:vm";

import { describe, expect, test } from "vitest";

import { settleInOrder } from "./settle-in-order";

describe("settleInOrder", () => {
  test("returns plain values and settled promises in order", async () => {
    expect(await settleInOrder([1, Promise.resolve(2), 3])).toEqual([1, 2, 3]);
  });

  test("throws the first rejection in order, not the first to settle", async () => {
    const late = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("first in order")), 10),
    );
    const early = Promise.reject(new Error("first to settle"));

    await expect(settleInOrder([1, late, early])).rejects.toThrow(
      "first in order",
    );
  });

  test("waits for every promise before throwing", async () => {
    let done = false;
    const slow = new Promise((resolve) =>
      setTimeout(() => {
        done = true;
        resolve(2);
      }, 10),
    );

    await expect(
      settleInOrder([Promise.reject(new Error("failed")), slow]),
    ).rejects.toThrow("failed");
    expect(done).toBe(true);
  });

  test("waits for a promise that isn't an instance of the global Promise", async () => {
    const foreign = vm.runInNewContext("Promise.resolve(2)");
    expect(foreign instanceof Promise).toBe(false);

    expect(await settleInOrder([1, foreign, 3])).toEqual([1, 2, 3]);
  });

  test("waits for a function with a then method", async () => {
    const thenable = Object.assign(() => {}, {
      // biome-ignore lint/suspicious/noThenProperty: a callable thenable
      then: (resolve: (value: number) => void) => resolve(2),
    }) as unknown as PromiseLike<number>;

    expect(await settleInOrder([1, thenable, 3])).toEqual([1, 2, 3]);
  });

  test("keeps each result in place when a thenable drops its then", async () => {
    const thenable = {
      // biome-ignore lint/suspicious/noThenProperty: a thenable that drops its then
      then(resolve: (value: number) => void) {
        Reflect.deleteProperty(this, "then");
        resolve(2);
      },
    } as unknown as PromiseLike<number>;

    expect(await settleInOrder([1, thenable, Promise.resolve(3)])).toEqual([
      1, 2, 3,
    ]);
  });

  test("returns an empty list for no values", async () => {
    expect(await settleInOrder([])).toEqual([]);
  });
});
