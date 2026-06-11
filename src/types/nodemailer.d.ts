declare module 'nodemailer' {
  interface Transporter {
    sendMail(mailOptions: SendMailOptions): Promise<any>;
  }

  interface SendMailOptions {
    from?: string;
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    attachments?: any[];
  }

  interface TransportOptions {
    host: string;
    port: number;
    secure?: boolean;
    auth?: {
      user: string;
      pass: string;
    };
  }

  function createTransport(options: TransportOptions): Transporter;

  export { createTransport, Transporter, SendMailOptions, TransportOptions };
}
