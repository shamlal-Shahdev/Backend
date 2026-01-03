export type EmailConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  secure: boolean;
  requireTLS: boolean;
  ignoreTLS: boolean;
  defaultName: string;
  defaultEmail: any;
};
