import { IEmailTemplate } from './email-template.interface';

export class VerificationEmailTemplate implements IEmailTemplate {
  public subject = 'Підтвердіть свою електронну пошту';

  getText(url: string): string {
    return `Перейдіть за цим лінком, щоб підтвердити Email: ${url}`;
  }

  getHtml(url: string): string {
    return `
    <!DOCTYPE html>
    <html lang="uk">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Підтвердження Email</title>
    </head>
    <body style="margin:0; padding:0; background-color:#f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4; padding: 20px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
              <tr>
                <td style="background-color:#4a90e2; padding: 20px; text-align:center;">
                  <h1 style="margin:0; color:#ffffff; font-family:Arial, sans-serif; font-size:24px;">Підтвердіть свою пошту</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 30px; font-family:Arial, sans-serif; color:#333333; font-size:16px; line-height:1.5;">
                  <p style="margin-top:0;">Привіт!</p>
                  <p>Дякуємо, що зареєструвалися в нашому застосунку. Щоб підтвердити свою електронну адресу, натисніть на кнопку нижче:</p>
                  <p style="text-align:center; margin: 30px 0;">
                    <a href="${url}"
                       style="
                         background-color:#4a90e2;
                         color:#ffffff;
                         text-decoration:none;
                         padding: 12px 24px;
                         border-radius:4px;
                         display:inline-block;
                         font-weight:bold;
                       "
                       target="_blank"
                    >
                      Підтвердити Email
                    </a>
                  </p>
                  <p>Якщо кнопка не працює, скопіюйте та вставте цей URL у браузер:</p>
                  <p style="word-break:break-all; color:#4a90e2;">
                    <a href="${url}" style="color:#4a90e2; text-decoration:none;" target="_blank">
                      ${url}
                    </a>
                  </p>
                  <p>Якщо ви не реєструвалися, просто ігноруйте цей лист.</p>
                  <p style="margin-bottom:0;">З найкращими побажаннями,<br />Команда вашого застосунку</p>
                </td>
              </tr>
              <tr>
                <td style="background-color:#f4f4f4; padding:20px; text-align:center; font-family:Arial, sans-serif; font-size:12px; color:#777777;">
                  <p style="margin:0;">© ${new Date().getFullYear()} Law Assist. Всі права захищено.</p>
                  <p style="margin:5px 0 0;">Ви отримали цей лист, бо зареєструвалися на нашому сайті.</p>
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
