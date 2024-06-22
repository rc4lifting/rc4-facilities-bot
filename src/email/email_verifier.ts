import { Resend } from "resend";
import config from "../config/default";

export class EmailVerifier {
  private resend: Resend;

  private constructor(apiKey: string) {
    this.resend = new Resend(apiKey);
  }

  public static async build(): Promise<EmailVerifier> {
    return new EmailVerifier(config.resendAPIKey);
  }

  public async sendVerificationEmail(
    to: string,
    verificationCode: string
  ): Promise<void> {
    const emailDetails = {
      from: "verification@rc4-facilities-bot.yongtaufoo.xyz",
      to: to,
      subject: "RC4 Gym Email Verification",
      html: `
        <p>Dear User,</p>
        <p>Your verification code is: <strong>${verificationCode}</strong></p>
        <p>Please enter this code to verify your email.</p>
      `,
    };

    try {
      const response = await this.resend.emails.send(emailDetails);
      console.log("Email sent successfully:", response);
    } catch (error) {
      console.error("Error sending verification email:", error);
      throw new Error("Failed to send verification email");
    }
  }
}

export default EmailVerifier;
