import axios from "axios";

export class EmailVerifier {
  private readonly apiKey: string;
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendVerificationEmail(
    email: string,
    verificationCode: string
  ): Promise<void> {
    const url = "https://api.elasticemail.com/v2/email/send";

    const data = new URLSearchParams();
    data.append("apikey", this.apiKey);
    data.append("subject", "RC4 Gym Email Verification");
    data.append("from", "rc4gym@yongtaufoo.xyz");
    data.append("to", email);
    data.append(
      "bodyHtml",
      `<p>Dear User,</p>
     <p>Your verification code is: ${verificationCode}</p>
     <p>Please enter this code to verify your email.</p>`
    );
    data.append("isTransactional", "true");

    // Log the result of the post
    try {
      const res = await axios.post(url, data.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      console.log(res.data);
    } catch (error) {
      console.error("Error sending email:", error);
      throw new Error("An error occurred while sending the email.");
    }
  }
  static build(apiKey: string): EmailVerifier {
    return new EmailVerifier(apiKey);
  }
}

export default EmailVerifier;
