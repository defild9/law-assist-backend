export interface IEmailTemplate {
  subject: string;
  getText(url: string): string;
  getHtml(url: string): string;
}
