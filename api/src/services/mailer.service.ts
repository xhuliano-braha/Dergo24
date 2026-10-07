const MAILER_URL = 'https://qkhq14bffd.17.sub-site.eu/api-mail-dispatcher.php';
const MAILER_SECRET = 'd24_sec_9938847291a8f94e2b0c';

export async function sendVerificationEmail({
  to,
  fullName,
  otp,
  actionLink,
}: {
  to: string;
  fullName: string;
  otp: string;
  actionLink: string;
}) {
  const safeName = fullName.trim() || 'Klient';
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 36px 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
      <div style="margin-bottom: 24px;">
        <span style="font-size: 26px; font-weight: 900; color: #071b33; letter-spacing: -0.5px;">DËRGO<span style="color: #ea580c;">24</span></span>
      </div>
      <h2 style="color: #0f172a; margin: 0 0 12px; font-size: 22px; font-weight: 800;">Verifikimi i Llogarisë tuaj</h2>
      <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
        Përshëndetje <strong>${safeName}</strong>,<br>
        Faleminderit që u regjistruat në platformën <strong>Dërgo24</strong>. Për të verifikuar adresën tuaj të email-it dhe për të hyrë në llogari, vendosni kodin e mëposhtëm në faqe:
      </p>
      <div style="text-align: center; margin: 26px 0; padding: 20px; background: #fff7ed; border: 2px dashed #f97316; border-radius: 14px;">
        <p style="margin: 0 0 6px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #9a3412;">Kodi i Verifikimit (OTP)</p>
        <span style="font-family: monospace; font-size: 34px; font-weight: 900; letter-spacing: 6px; color: #ea580c;">${otp}</span>
      </div>
      <div style="text-align: center; margin: 26px 0;">
        <a href="${actionLink}" style="display: inline-block; background: #ea580c; color: #ffffff; text-decoration: none; padding: 13px 30px; border-radius: 12px; font-weight: bold; font-size: 15px; box-shadow: 0 4px 12px rgba(234, 88, 12, 0.25);">
          Konfirmo me një klikim
        </a>
      </div>
      <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 20px 0 0;">
        Ose mund të klikoni linkun e drejtpërdrejtë:<br>
        <a href="${actionLink}" style="color: #ea580c; word-break: break-all; font-size: 12px;">${actionLink}</a>
      </p>
      <div style="margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 20px; color: #94a3b8; font-size: 12px; line-height: 1.5;">
        <p style="margin: 0;">Nëse nuk e keni kërkuar këtë veprim, ju lutem shpërfilleni këtë email.</p>
        <p style="margin: 6px 0 0;">Dërgo24 · Shërbim korrieri në të gjithë Shqipërinë · support@dergo24.com</p>
      </div>
    </div>
  `;

  const text = `Dërgo24 - Kodi i Verifikimit: ${otp}\n\nPërshëndetje ${safeName},\nKodi juaj i verifikimit është: ${otp}\n\nOse konfirmoni drejtpërdrejt: ${actionLink}\n\nEkipi Dërgo24`;

  try {
    const response = await fetch(MAILER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: MAILER_SECRET,
        to,
        subject: `Dërgo24 - Kodi i Verifikimit: ${otp}`,
        html,
        text,
      }),
    });
    if (!response.ok) {
      console.error('Mailer endpoint returned status:', response.status);
    }
    return { ok: response.ok };
  } catch (error) {
    console.error('Failed to dispatch verification email:', error);
    return { ok: false, error };
  }
}
