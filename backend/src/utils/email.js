const { Resend } = require('resend');

let resend;
function getResendClient() {
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

async function sendVerificationEmail(user, token) {
  const verifyUrl = `${process.env.CLIENT_ORIGIN}/verify-email?token=${token}`;

  await getResendClient().emails.send({
    from: process.env.EMAIL_FROM || 'TrainMitra <onboarding@resend.dev>',
    to: user.email,
    subject: 'Verify your TrainMitra account',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #ea580c;">Welcome to TrainMitra, ${user.name}!</h2>
        <p>Confirm your email address to activate your account.</p>
        <p>
          <a href="${verifyUrl}" style="display:inline-block; background:#ea580c; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600;">
            Verify email
          </a>
        </p>
        <p style="color:#64748b; font-size:13px;">This link expires in 24 hours. If you didn't create this account, you can ignore this email.</p>
      </div>
    `,
  });
}

module.exports = { sendVerificationEmail };
