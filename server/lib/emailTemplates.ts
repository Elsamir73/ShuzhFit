export type EmailTemplate = {
  subject: string;
  html: string;
  text: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function emailLayout(content: string): string {
  return `<div style="background:#f4f1ea;padding:32px 16px;font-family:Arial,sans-serif;color:#1b1b1b">
  <div style="max-width:560px;margin:0 auto;background:#fff;padding:32px;border-radius:12px">
    <p style="font-weight:bold;letter-spacing:1px">SHUZHFIT</p>
    ${content}
  </div>
</div>`;
}

function actionButton(label: string, link: string): string {
  return `<a href="${escapeHtml(link)}" style="display:inline-block;background:#ff5a36;color:#1b1b1b;padding:13px 20px;border-radius:6px;text-decoration:none;font-weight:bold">${escapeHtml(label)}</a>`;
}

export function verifyEmail(name: string, link: string): EmailTemplate {
  const safeName = escapeHtml(name);
  return {
    subject: "Verify your ShuzhFit email",
    html: emailLayout(`<h1>Verify your email</h1><p>Hi ${safeName}, confirm your email address to finish creating your ShuzhFit account.</p><p>${actionButton("Verify email", link)}</p><p>This link expires in 24 hours.</p>`),
    text: `Hi ${name},\n\nConfirm your email address to finish creating your ShuzhFit account:\n${link}\n\nThis link expires in 24 hours.`,
  };
}

export function welcomeEmail(name: string, appUrl: string): EmailTemplate {
  const safeName = escapeHtml(name);
  const todayLink = `${appUrl.replace(/\/+$/u, "")}/today`;
  return {
    subject: "Welcome to ShuzhFit",
    html: emailLayout(`<h1>Welcome, ${safeName}!</h1><p>Here is what you can do in ShuzhFit:</p><ul><li>Open Today for your next workout.</li><li>Follow a plan that fits your schedule and equipment.</li><li>Track food and keep an eye on your nutrition targets.</li></ul><p>${actionButton("Go to Today", todayLink)}</p><p>Keep showing up,<br>Samir</p>`),
    text: `Welcome, ${name}!\n\nHere is what you can do in ShuzhFit:\n- Open Today for your next workout.\n- Follow a plan that fits your schedule and equipment.\n- Track food and keep an eye on your nutrition targets.\n\nGo to Today: ${todayLink}\n\nKeep showing up,\nSamir`,
  };
}

export function contactNotification(
  name: string,
  email: string,
  message: string,
): EmailTemplate {
  return {
    subject: "New ShuzhFit contact message",
    html: emailLayout(`<h1>New contact message</h1><p><strong>Name:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><p><strong>Message:</strong></p><pre style="white-space:pre-wrap;font:inherit">${escapeHtml(message)}</pre>`),
    text: `New contact message\n\nName: ${name}\nEmail: ${email}\n\n${message}`,
  };
}
