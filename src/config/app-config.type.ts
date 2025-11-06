  export type AppConfig = {
    nodeEnv: string;
    name: string;
    workingDirectory: string;
    frontendDomain?: string;
    frontendUrl?: string;
    backendDomain: string;
    port: number;
    apiPrefix: string;
    fallbackLanguage: string;
    headerLanguage: string;
  };
