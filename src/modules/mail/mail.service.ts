import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as SibApiV3Sdk from 'sib-api-v3-sdk';

@Injectable()
export class MailService {
  constructor(private readonly configService: ConfigService) {}

  async sendToAdmin(subject: string, body: string): Promise<void> {
    await this.send({
      to: 'Influencegate2025@gmail.com',
      subject,
      html: `<div style="font-family: Arial, sans-serif; padding: 20px;">${body}</div>`,
      text: body,
    });
  }

  async sendOtp(email: string, otp: string): Promise<void> {
    const html = this.buildOtpTemplate(otp);

    await this.send({
      to: email,
      subject: 'رمز التحقق - InfluenceGate',
      html,
      text: `رمز التحقق الخاص بك هو: ${otp}\nهذا الرمز صالح لمدة 10 دقائق فقط.`,
    });
  }

  private async send(params: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<void> {
    try {
      const defaultClient = SibApiV3Sdk.ApiClient.instance;
      const apiKey = defaultClient.authentications['api-key'];
      apiKey.apiKey = this.configService.get<string>('email.brevoApiKey');

      const api = new SibApiV3Sdk.TransactionalEmailsApi();

      await api.sendTransacEmail({
        sender: {
          email: this.configService.get<string>('email.senderEmail'),
          name: this.configService.get<string>('email.senderName'),
        },
        to: [{ email: params.to }],
        subject: params.subject,
        textContent: params.text,
        htmlContent: params.html,
      });
    } catch {
      throw new InternalServerErrorException('فشل إرسال البريد الإلكتروني');
    }
  }

  private buildOtpTemplate(otp: string): string {
    return `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <tr>
                  <td style="background: #007bff; color: white; padding: 30px 20px; text-align: center;">
                    <h2 style="margin: 0; font-size: 28px;">رمز التحقق</h2>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 30px 20px; text-align: center;">
                    <p style="font-size: 18px; color: #333; margin: 0 0 20px;">
                      استخدم الرمز التالي للتحقق من حسابك:
                    </p>
                    <div style="font-size: 40px; font-weight: bold; letter-spacing: 12px; background: #f0f8ff; color: #007bff; padding: 25px; border-radius: 12px; display: inline-block; margin: 20px 0;">
                      ${otp}
                    </div>
                    <p style="font-size: 16px; color: #555; margin: 0 0 10px;">
                      هذا الرمز صالح لمدة 10 دقائق فقط.
                    </p>
                    <p style="font-size: 14px; color: #888; margin: 20px 0 0;">
                      إذا لم تطلب هذا الرمز، يرجى تجاهل هذه الرسالة.
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
  }
}
