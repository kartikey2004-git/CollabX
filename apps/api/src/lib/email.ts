import { Resend } from "resend";
import { config } from "../config";
import logger from "../config/logger";

// Sets up the Resend client (a third-party service for sending emails) using API key.
const resend = new Resend(config.resendApiKey);
const FROM_EMAIL = config.resendFromEmail; // email id from which email will be sent

// Sends a "verify your email" message to a new user after they sign up.
export async function sendVerificationEmail({
  email,
  verificationUrl,
}: {
  email: string;
  verificationUrl: string;
}) {
  try {
    // Send the actual email via Resend, with a clickable verification button/link.
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Verify your CollabX email",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="text-align: center; color: #007bff; margin-top: 0; margin-bottom: 24px; border-bottom: 2px solid #f0f0f0; padding-bottom: 16px;">
            GroundWork
          </h1>
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
    // If sending fails, just log it instead of crashing , the user can request a new link later.
    logger.error({ email, error }, "Verification email failed");
  }
}

// Sends a "reset your password" message when a user requests a password reset.
export async function sendPasswordResetEmail({
  email,
  resetUrl,
}: {
  email: string;
  resetUrl: string;
}) {
  try {
    // Send the actual email via Resend, with a clickable reset button/link.
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Reset your CollabX password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="text-align: center; color: #007bff; margin-top: 0; margin-bottom: 24px; border-bottom: 2px solid #f0f0f0; padding-bottom: 16px;">
            GroundWork
          </h1>
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
    // If sending fails, just log it instead of crashing the request.
    logger.error({ email, error }, "Password reset email failed");
  }
}
