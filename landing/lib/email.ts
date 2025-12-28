import nodemailer from 'nodemailer';

// Create reusable transporter
function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

export async function sendWaitlistEmail(email: string, name?: string | null): Promise<void> {
  const transporter = getTransporter();
  const displayName = name || 'there';
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://lockin.app';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Welcome to LockIn</title>
</head>
<body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1)); border: 1px solid rgba(255, 255, 255, 0.1);">

          <!-- Header with Orb Graphic -->
          <tr>
            <td align="center" style="padding: 48px 40px 24px;">
              <!-- Animated Orb Representation (static for email) -->
              <div style="width: 120px; height: 120px; position: relative; margin: 0 auto;">
                <!-- Outer glow -->
                <div style="position: absolute; width: 140px; height: 140px; left: -10px; top: -10px; border-radius: 50%; background: radial-gradient(circle, rgba(84, 160, 255, 0.3) 0%, transparent 70%);"></div>
                <!-- Outer ring -->
                <div style="position: absolute; width: 120px; height: 120px; border-radius: 50%; background: linear-gradient(135deg, #a8d8ff, #74b9ff, #54a0ff);"></div>
                <!-- Middle ring -->
                <div style="position: absolute; width: 96px; height: 96px; left: 12px; top: 12px; border-radius: 50%; background: linear-gradient(135deg, #74b9ff, #54a0ff, #2e86de);"></div>
                <!-- Inner ring -->
                <div style="position: absolute; width: 72px; height: 72px; left: 24px; top: 24px; border-radius: 50%; background: linear-gradient(135deg, #54a0ff, #2e86de, #1e6fba);"></div>
                <!-- Core -->
                <div style="position: absolute; width: 42px; height: 42px; left: 39px; top: 39px; border-radius: 50%; background: linear-gradient(135deg, #ffffff, #54a0ff, #2e86de);"></div>
                <!-- Highlight -->
                <div style="position: absolute; width: 14px; height: 14px; left: 48px; top: 44px; border-radius: 50%; background: rgba(255, 255, 255, 0.8);"></div>
              </div>
            </td>
          </tr>

          <!-- Main Heading -->
          <tr>
            <td style="padding: 0 40px 16px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 32px; font-weight: 700; margin: 0; line-height: 1.2;">
                You're on the list, ${displayName}!
              </h1>
            </td>
          </tr>

          <!-- Subheading -->
          <tr>
            <td style="padding: 0 40px 32px; text-align: center;">
              <p style="color: rgba(255, 255, 255, 0.7); font-size: 16px; line-height: 1.6; margin: 0;">
                Thanks for joining the LockIn waitlist. We're building something special to help you take control of your screen time and reclaim your life.
              </p>
            </td>
          </tr>

          <!-- Features Section -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(255, 255, 255, 0.05); border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.08);">
                <tr>
                  <td style="padding: 24px;">
                    <p style="color: #3b82f6; font-size: 14px; font-weight: 600; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 0.5px;">What's coming:</p>

                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width: 24px; vertical-align: top;">
                                <span style="color: #10b981; font-size: 16px;">&#10003;</span>
                              </td>
                              <td style="color: rgba(255, 255, 255, 0.8); font-size: 15px;">
                                <strong style="color: #ffffff;">Smart App Blocking</strong> - Block distracting apps automatically
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width: 24px; vertical-align: top;">
                                <span style="color: #10b981; font-size: 16px;">&#10003;</span>
                              </td>
                              <td style="color: rgba(255, 255, 255, 0.8); font-size: 15px;">
                                <strong style="color: #ffffff;">Focus Sessions</strong> - Deep work with task verification
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width: 24px; vertical-align: top;">
                                <span style="color: #10b981; font-size: 16px;">&#10003;</span>
                              </td>
                              <td style="color: rgba(255, 255, 255, 0.8); font-size: 15px;">
                                <strong style="color: #ffffff;">Screen Time Insights</strong> - Beautiful analytics
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width: 24px; vertical-align: top;">
                                <span style="color: #10b981; font-size: 16px;">&#10003;</span>
                              </td>
                              <td style="color: rgba(255, 255, 255, 0.8); font-size: 15px;">
                                <strong style="color: #ffffff;">AI Coach</strong> - Personalized recommendations
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Stats Section -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align: center; padding: 16px;">
                    <p style="font-size: 28px; font-weight: 700; margin: 0; background: linear-gradient(135deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">3+ hrs</p>
                    <p style="color: rgba(255, 255, 255, 0.5); font-size: 12px; margin: 4px 0 0;">Saved daily</p>
                  </td>
                  <td style="text-align: center; padding: 16px;">
                    <p style="font-size: 28px; font-weight: 700; margin: 0; background: linear-gradient(135deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">92%</p>
                    <p style="color: rgba(255, 255, 255, 0.5); font-size: 12px; margin: 4px 0 0;">Complete goals</p>
                  </td>
                  <td style="text-align: center; padding: 16px;">
                    <p style="font-size: 28px; font-weight: 700; margin: 0; background: linear-gradient(135deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">1000+</p>
                    <p style="color: rgba(255, 255, 255, 0.5); font-size: 12px; margin: 4px 0 0;">On waitlist</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <div style="height: 1px; background: rgba(255, 255, 255, 0.1);"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px 48px; text-align: center;">
              <p style="color: rgba(255, 255, 255, 0.5); font-size: 14px; margin: 0 0 16px;">
                We'll notify you as soon as LockIn is ready for download.
              </p>
              <p style="color: rgba(255, 255, 255, 0.3); font-size: 12px; margin: 0;">
                LockIn - Take control of your digital life
              </p>
            </td>
          </tr>

          <!-- Footer note -->
          <tr>
            <td style="padding: 24px 40px 32px; text-align: center; background-color: #000000;">
              <p style="color: rgba(255, 255, 255, 0.3); font-size: 11px; margin: 0;">
                You're receiving this email because you signed up for the LockIn waitlist.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  await transporter.sendMail({
    from: `"LockIn App" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: "Welcome to the LockIn Waitlist",
    text: `Hi ${displayName},\n\nThanks for joining the LockIn waitlist! We're building something special to help you take control of your screen time.\n\nWhat's coming:\n- Smart App Blocking\n- Focus Sessions\n- Screen Time Insights\n- AI Coach\n\nWe'll notify you as soon as LockIn is ready for download.\n\nBest,\nThe LockIn Team`,
    html,
  });
}
