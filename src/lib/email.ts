import { Resend } from "resend";

export async function enviarEmailVerificacion(email: string, nombre: string, token: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Sin configurar todavía: no rompemos el registro, solo avisamos por consola.
    console.warn(
      "RESEND_API_KEY no está configurada. No se pudo enviar el email de verificación."
    );
    return;
  }

  const resend = new Resend(apiKey);
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const link = `${baseUrl}/verificar-email?token=${token}`;
  const fromAddress = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

  await resend.emails.send({
    from: `Gestión de Pedidos LYA <${fromAddress}>`,
    to: email,
    subject: "Confirmá tu cuenta - Gestión de Pedidos LYA",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Hola ${nombre},</h2>
        <p>Gracias por registrarte en Gestión de Pedidos LYA. Para activar tu cuenta, confirmá tu email haciendo clic en el siguiente botón:</p>
        <p style="margin: 24px 0;">
          <a href="${link}" style="background:#1d4ed8;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
            Confirmar mi cuenta
          </a>
        </p>
        <p>Si el botón no funciona, copiá y pegá este link en tu navegador:</p>
        <p style="word-break: break-all; color: #475569;">${link}</p>
        <p style="color: #94a3b8; font-size: 12px;">Este link vence en 24 horas.</p>
      </div>
    `,
  });
}
