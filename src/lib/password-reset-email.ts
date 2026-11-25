import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

function escapeHtml(value: unknown): string {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return String(value ?? "").replace(/[&<>"']/g, (c) => entities[c]);
}

const BRAND = {
  name: "JSMLS Ventures",
  color: "#1d4ed8",
  colorSoft: "#eff4ff",
  text: "#1f2937",
  muted: "#6b7280",
  border: "#e5e7eb",
  bg: "#f3f4f6",
};

const OTP_VALID_MINUTES = 5;

function buildPasswordResetHtml(name: string, otp: string): string {
  const safeName = escapeHtml(name || "there");
  const otpDigits = escapeHtml(otp)
    .split("")
    .map(
      (d) =>
        `<td align="center" style="width:44px;height:56px;background:${BRAND.colorSoft};border:1px solid #c7d7fe;border-radius:8px;font-family:'Courier New',Courier,monospace;font-size:28px;font-weight:700;color:${BRAND.color};">${d}</td>`
    )
    .join(`<td style="width:8px;font-size:0;line-height:0;">&nbsp;</td>`);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>Reset your password</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};">
  <!-- Preheader: shown in inbox preview -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    Your verification code is ${escapeHtml(otp)}. It expires in ${OTP_VALID_MINUTES} minutes.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid ${BRAND.border};border-radius:12px;overflow:hidden;">

          <!-- Brand bar -->
          <tr>
            <td style="background:${BRAND.color};padding:20px 32px;font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:700;color:#ffffff;letter-spacing:0.3px;">
              ${BRAND.name}
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 32px 8px;font-family:Arial,Helvetica,sans-serif;color:${BRAND.text};">
              <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;font-weight:700;color:${BRAND.text};">
                Reset your password
              </h1>
              <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">Hi ${safeName},</p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">
                Use this code to reset the password for your ${BRAND.name} account.
                Enter it on the password reset page to continue.
              </p>
            </td>
          </tr>

          <!-- OTP -->
          <tr>
            <td align="center" style="padding:0 32px 8px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>${otpDigits}</tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:12px 32px 24px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${BRAND.muted};">
              This code expires in ${OTP_VALID_MINUTES} minutes.
            </td>
          </tr>

          <!-- Security note -->
          <tr>
            <td style="padding:0 32px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:4px;">
                <tr>
                  <td style="padding:14px 16px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#78350f;">
                    <strong>Keep this code private.</strong> ${BRAND.name} will never ask you for it
                    by phone, chat or email. If you didn’t request a password reset, you can safely
                    ignore this email. Your password won’t change.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid ${BRAND.border};font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:${BRAND.muted};">
              Regards,<br />
              The ${BRAND.name} Team<br /><br />
              This is an automated message. Please don’t reply to this email.
            </td>
          </tr>
        </table>

        <p style="margin:16px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:${BRAND.muted};">
          © ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildPasswordResetText(name: string, otp: string): string {
  return [
    `Hi ${name || "there"},`,
    "",
    `Your ${BRAND.name} password reset code is: ${otp}`,
    `It expires in ${OTP_VALID_MINUTES} minutes.`,
    "",
    "Keep this code private. If you didn’t request a password reset, you can ignore this email.",
    "",
    `The ${BRAND.name} Team`,
  ].join("\n");
}

export async function sendPasswordResetEmail(
  email: string,
  otp: string,
  name: string
) {
  return transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `${otp} is your ${BRAND.name} password reset code`,
    text: buildPasswordResetText(name, otp),
    html: buildPasswordResetHtml(name, otp),
  });
}