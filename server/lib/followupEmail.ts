import { createHmac, timingSafeEqual } from "node:crypto";
import { getFirstName, type FollowupCandidate } from "./segments.js";

export interface FollowupMessage {
  subject: string;
  body: string;
  buttonLabel: string;
  buttonPath: string;
}

export interface RenderedFollowup {
  subject: string;
  html: string;
  text: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function mergeFollowupFields(
  value: string,
  candidate: FollowupCandidate,
  appUrl: string,
  daysAway: number,
): string {
  const fields: Record<string, string> = {
    name: getFirstName(candidate.name),
    missedCount: String(candidate.missedCount),
    daysAway: String(daysAway),
    appUrl,
  };
  return value.replace(/\{\{\s*([A-Za-z][A-Za-z0-9]*)\s*\}\}/gu, (_match, key: string) => fields[key] ?? "");
}

export function createUnsubscribeToken(userId: number, secret: string): string {
  if (!Number.isSafeInteger(userId) || userId < 1 || !secret) {
    throw new Error("A valid user ID and signing secret are required.");
  }
  const id = String(userId);
  const signature = createHmac("sha256", secret).update(id).digest("hex");
  return `${id}.${signature}`;
}

export function verifyUnsubscribeToken(token: string, secret: string): number | null {
  const match = /^([1-9]\d*)\.([a-f0-9]{64})$/u.exec(token);
  if (!match || !secret) return null;
  const id = Number(match[1]);
  if (!Number.isSafeInteger(id) || id < 1) return null;
  const expected = createHmac("sha256", secret).update(match[1]!).digest();
  const supplied = Buffer.from(match[2]!, "hex");
  return expected.length === supplied.length && timingSafeEqual(expected, supplied) ? id : null;
}

export function getFollowupButtonUrl(appUrl: string, buttonPath: string): string {
  const base = new URL(appUrl);
  if (base.protocol !== "https:" && base.protocol !== "http:") {
    throw new Error("APP_URL must use HTTP or HTTPS.");
  }
  if (!buttonPath.startsWith("/") || buttonPath.startsWith("//") || buttonPath.includes("\\")) {
    throw new Error("Button path must be a same-origin app path.");
  }
  const target = new URL(buttonPath, base);
  if (target.origin !== base.origin) throw new Error("Button path must be on the app origin.");
  return target.toString();
}

export function renderFollowupEmail(
  message: FollowupMessage,
  candidate: FollowupCandidate,
  appUrl: string,
  unsubscribeUrl: string,
  daysAway: number,
): RenderedFollowup {
  const subject = mergeFollowupFields(message.subject, candidate, appUrl, daysAway);
  const body = mergeFollowupFields(message.body, candidate, appUrl, daysAway);
  const buttonLabel = mergeFollowupFields(message.buttonLabel, candidate, appUrl, daysAway);
  const buttonUrl = getFollowupButtonUrl(appUrl, message.buttonPath);
  const paragraphs = body.split(/\n\s*\n/u).map((part) => part.trim()).filter(Boolean);
  const htmlParagraphs = paragraphs
    .map((paragraph) => `<p style="margin:0 0 16px;line-height:1.6">${escapeHtml(paragraph).replace(/\n/gu, "<br>")}</p>`)
    .join("");
  const safeButtonLabel = escapeHtml(buttonLabel);
  const safeButtonUrl = escapeHtml(buttonUrl);
  const safeUnsubscribeUrl = escapeHtml(unsubscribeUrl);
  const html = `<div style="background:#f4f1ea;padding:32px 16px;font-family:Arial,sans-serif;color:#1b1b1b"><div style="max-width:560px;margin:0 auto;background:#fff;padding:32px;border-radius:12px"><p style="font-weight:bold;letter-spacing:1px">SHUZHFIT</p>${htmlParagraphs}<p style="margin:24px 0"><a href="${safeButtonUrl}" style="display:inline-block;background:#ff5a36;color:#1b1b1b;padding:13px 20px;border-radius:6px;text-decoration:none;font-weight:bold">${safeButtonLabel}</a></p><p style="margin:0 0 24px">Samir, ShuzhFit</p><p style="margin:0;font-size:12px;color:#666">You get this email because you have a ShuzhFit account. <a href="${safeUnsubscribeUrl}">Unsubscribe</a></p></div></div>`;
  const text = `${paragraphs.join("\n\n")}\n\n${buttonLabel}: ${buttonUrl}\n\nSamir, ShuzhFit\n\nYou get this email because you have a ShuzhFit account. Unsubscribe: ${unsubscribeUrl}`;
  return { subject, html, text };
}
