import { describe, expect, it } from "vitest";
import { createUnsubscribeToken, renderFollowupEmail, verifyUnsubscribeToken } from "./followupEmail.js";
import type { FollowupCandidate } from "./segments.js";

const recipient: FollowupCandidate = {
  id: 7,
  name: "<Samir> Pathak",
  email: "samir@example.test",
  role: "user",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  emailVerifiedAt: new Date("2026-01-02T00:00:00.000Z"),
  emailOptOutAt: null,
  onboardedAt: new Date("2026-01-03T00:00:00.000Z"),
  lastLoginAt: null,
  lastFollowupAt: null,
  hasRecentFoodLog: false,
  missedCount: 3,
};

describe("follow-up email rendering", () => {
  it("merges known fields, removes unknown placeholders, and escapes HTML values", () => {
    const rendered = renderFollowupEmail({
      subject: "Hi {{name}} {{unknown}}",
      body: "Hello {{name}}\n\nMissed {{missedCount}}. {{unknown}}",
      buttonLabel: "Go <now>",
      buttonPath: "/today",
    }, recipient, "https://fit.example", "https://fit.example/unsubscribe?token=abc", 10);

    expect(rendered.subject).toBe("Hi <Samir> ");
    expect(rendered.html).toContain("Hello &lt;Samir&gt;");
    expect(rendered.html).toContain("Go &lt;now&gt;");
    expect(rendered.html).not.toContain("{{unknown}}");
    expect(rendered.html).not.toContain("<Samir>");
  });

  it("rejects off-site or protocol-relative button paths", () => {
    expect(() => renderFollowupEmail({
      subject: "Hi",
      body: "Hello",
      buttonLabel: "Open",
      buttonPath: "//attacker.example",
    }, recipient, "https://fit.example", "https://fit.example/unsubscribe?token=abc", 10)).toThrow();
  });
});

describe("unsubscribe tokens", () => {
  const secret = "test-signing-secret";

  it("verifies valid signatures and rejects tampering", () => {
    const token = createUnsubscribeToken(7, secret);
    expect(verifyUnsubscribeToken(token, secret)).toBe(7);
    expect(verifyUnsubscribeToken(`8${token.slice(token.indexOf("."))}`, secret)).toBeNull();
    expect(verifyUnsubscribeToken(token, "wrong-secret")).toBeNull();
  });
});
