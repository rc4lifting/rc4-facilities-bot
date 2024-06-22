import axios from "axios";

export class EmailVerifier {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  public async sendVerificationEmail(
    to: string,
    verificationCode: string
  ): Promise<void> {
    const url = "https://api.elasticemail.com/v2/email/send";

    const data = new URLSearchParams();
    data.append("apikey", this.apiKey);
    data.append("subject", "RC4 Gym Email Verification");
    data.append("from", "rc4gym@yongtaufoo.xyz");
    data.append("to", to);
    data.append(
      "bodyHtml",
      `<p>Dear User,</p>
       <p>Your verification code is: <strong>${verificationCode}</strong></p>
       <p>Please enter this code to verify your email.</p>`
    );
    data.append("isTransactional", "true");

    try {
      const response = await axios.post(url, data.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      console.log(`Email sent successfully: ${response.data}`);
    } catch (error) {
      console.error("Error sending verification email:", error);
      throw new Error("Failed to send verification email");
    }
  }

  public static build(apiKey: string): EmailVerifier {
    return new EmailVerifier(apiKey);
  }
}

export default EmailVerifier;
