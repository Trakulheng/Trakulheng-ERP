import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "DDK ERP <noreply@ddk.co.th>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const url = `${APP_URL}/auth/verify-email?token=${token}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:32px 40px;text-align:center">
            <div style="display:inline-flex;align-items:center;gap:10px">
              <div style="width:40px;height:40px;background:rgba(255,255,255,.2);border-radius:10px;display:inline-block;line-height:40px;text-align:center;font-size:20px">📊</div>
              <span style="color:#fff;font-size:22px;font-weight:700;letter-spacing:-.5px">DDK ERP</span>
            </div>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px">
            <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0f172a">Verify your email</h1>
            <p style="margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.6">
              Hi ${name ? name.split(" ")[0] : "there"}, welcome to DDK ERP. Click the button below to verify your email address and activate your account.
            </p>
            <div style="text-align:center;margin:32px 0">
              <a href="${url}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:600;letter-spacing:.2px">
                Verify email address
              </a>
            </div>
            <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.6">
              This link expires in <strong>24 hours</strong>. If you didn't create a DDK ERP account, you can safely ignore this email.
            </p>
          </td>
        </tr>
        <!-- Divider -->
        <tr><td style="padding:0 40px"><div style="height:1px;background:#f1f5f9"></div></td></tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;text-align:center">
            <p style="margin:0;color:#94a3b8;font-size:12px">Or copy this link into your browser:</p>
            <p style="margin:8px 0 0;font-size:12px;word-break:break-all">
              <a href="${url}" style="color:#7c3aed;text-decoration:none">${url}</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  if (!process.env.RESEND_API_KEY) {
    console.log(`\n[DEV] Verification link for ${email}:\n${url}\n`);
    return;
  }

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Verify your DDK ERP account",
    html,
  });
}
