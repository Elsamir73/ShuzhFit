import { beforeEach, describe, expect, it } from "vitest";
import {
  addAdminComment,
  getAdminComments,
  saveAdminComments,
} from "./adminData";

const createLocalStorage = () => {
  const store = new Map<string, string>();

  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
};

Object.defineProperty(globalThis, "window", {
  value: { localStorage: createLocalStorage() },
  configurable: true,
});

describe("admin comments", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("saves and reads an admin comment list from local storage", () => {
    const items = [
      {
        id: "comment-1",
        author: "Jordan",
        email: "jordan@example.com",
        body: "Love the new programming.",
        createdAt: "2026-09-20T06:00:00.000Z",
      },
    ];

    saveAdminComments(items);

    expect(getAdminComments()).toEqual(items);
  });

  it("adds a trimmed comment to the front of the list", () => {
    const result = addAdminComment({
      author: "  Alex  ",
      email: "  alex@example.com  ",
      body: "  This is a good post.  ",
    });

    expect(result.author).toBe("Alex");
    expect(result.email).toBe("alex@example.com");
    expect(result.body).toBe("This is a good post.");
    expect(getAdminComments()[0]).toEqual(result);
  });
});
