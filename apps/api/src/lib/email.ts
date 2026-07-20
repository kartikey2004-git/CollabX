import { Resend } from "resend";
import { config } from "../config";
import logger from "../config/logger";

const resend = new Resend(config.resendApiKey);
const FROM_EMAIL = config.resendFromEmail;

export async function sendVerificationEmail({
  email,
  verificationUrl,
}: {
  email: string;
  verificationUrl: string;
}) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Verify your CollabX email",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verify Your Email</h2>
          <p>Thank you for signing up! Click the link below to verify your email address.</p>
          <p>
            <a href="${verificationUrl}"
               style="background-color: #007bff; color: white; padding: 10px 20px;
                      text-decoration: none; border-radius: 4px; display: inline-block;">
              Verify Email
            </a>
          </p>
          <p style="color: #666; font-size: 12px;">
            This link expires in 1 hour.
          </p>
          <p style="color: #666; font-size: 12px;">
            Or copy this link: <br/>
            <code>${verificationUrl}</code>
          </p>
        </div>
      `,
    });
  } catch (error) {
    logger.error({ email, error }, "Verification email failed");
  }
}

export async function sendPasswordResetEmail({
  email,
  resetUrl,
}: {
  email: string;
  resetUrl: string;
}) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Reset your CollabX password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Reset Your Password</h2>
          <p>We received a request to reset your password. Click the link below to set a new password.</p>
          <p>
            <a href="${resetUrl}"
               style="background-color: #007bff; color: white; padding: 10px 20px;
                      text-decoration: none; border-radius: 4px; display: inline-block;">
              Reset Password
            </a>
          </p>
          <p style="color: #666; font-size: 12px;">
            This link expires in 1 hour.
          </p>
          <p style="color: #666; font-size: 12px;">
            If you didn't request this, ignore this email. Your password remains unchanged.
          </p>
          <p style="color: #666; font-size: 12px;">
            Or copy this link: <br/>
            <code>${resetUrl}</code>
          </p>
        </div>
      `,
    });
  } catch (error) {
    logger.error({ email, error }, "Password reset email failed");
  }
}
