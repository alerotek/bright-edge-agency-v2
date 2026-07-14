/**
 * Email Templates
 * --------------------------------------------------------------
 * HTML email templates for transactional emails.
 * Plain text alternatives are provided alongside HTML.
 */

export type OtpEmailProps = {
  code: string;
  agentName: string;
  expiresInMinutes?: number;
};

export function otpEmailHtml({ code, agentName, expiresInMinutes = 10 }: OtpEmailProps): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 480px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: #2F4DCC; padding: 32px 24px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 20px; font-weight: 600; }
    .body { padding: 32px 24px; }
    .code { text-align: center; margin: 24px 0; }
    .code span { display: inline-block; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #2F4DCC; background: #f0f2ff; padding: 16px 24px; border-radius: 12px; font-family: 'Courier New', monospace; }
    .info { color: #71717a; font-size: 14px; line-height: 1.6; margin-bottom: 8px; }
    .footer { padding: 24px; border-top: 1px solid #e4e4e7; text-align: center; }
    .footer p { color: #a1a1aa; font-size: 12px; margin: 4px 0; }
    .divider { border: none; border-top: 1px solid #e4e4e7; margin: 24px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Bright Edge Agency</h1>
    </div>
    <div class="body">
      <p style="font-size: 16px; color: #18181b; font-weight: 500;">Hi ${agentName},</p>
      <p class="info">Use the code below to verify your account. This code expires in ${expiresInMinutes} minutes.</p>
      <div class="code">
        <span>${code}</span>
      </div>
      <p class="info">If you didn't request this code, you can safely ignore this email.</p>
      <hr class="divider" />
      <p class="info" style="font-size: 12px;">
        Need help? Reply to this email or contact us at <a href="mailto:hello@brightedge.co.ke" style="color: #2F4DCC;">hello@brightedge.co.ke</a>
      </p>
    </div>
    <div class="footer">
      <p>Bright Edge Agency</p>
      <p>Westlands Commercial Centre, Nairobi, Kenya</p>
    </div>
  </div>
</body>
</html>`.trim();
}

export function otpEmailText({ code, agentName, expiresInMinutes = 10 }: OtpEmailProps): string {
  return [
    `Hi ${agentName},`,
    ``,
    `Use this code to verify your Bright Edge account: ${code}`,
    ``,
    `This code expires in ${expiresInMinutes} minutes.`,
    ``,
    `If you didn't request this code, you can safely ignore this email.`,
    ``,
    `---`,
    `Bright Edge Agency`,
    `Westlands Commercial Centre, Nairobi, Kenya`,
  ].join("\n");
}

/* ── Inquiry notification (agent/admin) ── */

export type InquiryNotificationProps = {
  inquiryName: string;
  inquiryEmail: string;
  inquiryPhone: string | null;
  message: string;
  propertyTitle?: string;
  source: string;
};

export function inquiryNotificationHtml(props: InquiryNotificationProps): string {
  const { inquiryName, inquiryEmail, inquiryPhone, message, propertyTitle, source } = props;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: #2F4DCC; padding: 24px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 18px; }
    .body { padding: 24px; }
    .label { font-size: 12px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 16px; }
    .value { font-size: 15px; color: #18181b; margin: 4px 0; }
    .message-box { background: #f4f4f5; border-radius: 8px; padding: 16px; margin-top: 8px; font-size: 14px; line-height: 1.6; color: #18181b; }
    .footer { padding: 24px; border-top: 1px solid #e4e4e7; text-align: center; font-size: 12px; color: #a1a1aa; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 New Inquiry Received</h1>
    </div>
    <div class="body">
      <p style="font-size: 15px; color: #18181b;">A new inquiry has been submitted via <strong>${source}</strong>.</p>
      ${propertyTitle ? `<p style="font-size: 14px; color: #2F4DCC; font-weight: 500;">Property: ${propertyTitle}</p>` : ""}
      <div class="label">Name</div>
      <div class="value">${inquiryName}</div>
      <div class="label">Email</div>
      <div class="value"><a href="mailto:${inquiryEmail}" style="color: #2F4DCC;">${inquiryEmail}</a></div>
      ${inquiryPhone ? `<div class="label">Phone</div><div class="value">${inquiryPhone}</div>` : ""}
      <div class="label">Message</div>
      <div class="message-box">${message}</div>
    </div>
    <div class="footer">
      <p>Bright Edge Agency — Respond within 4 working hours</p>
    </div>
  </div>
</body>
</html>`.trim();
}

export function inquiryNotificationText(props: InquiryNotificationProps): string {
  const lines = [
    `New Inquiry (${props.source})`,
    props.propertyTitle ? `Property: ${props.propertyTitle}` : "",
    ``,
    `Name: ${props.inquiryName}`,
    `Email: ${props.inquiryEmail}`,
    props.inquiryPhone ? `Phone: ${props.inquiryPhone}` : "",
    ``,
    `Message:`,
    props.message,
    ``,
    `---`,
    `Bright Edge Agency`,
  ];
  return lines.filter(Boolean).join("\n");
}