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
  /** WATT tokens credited per 1 kWh for vendor monthly usage CSV imports. */
  vendorUsageTokensPerKwh: number;
  /** Kg CO2 reduced for each 1 kWh of clean energy generation. */
  carbonCo2KgPerKwh: number;
  /** WATT tokens for Predict & Win accuracy tiers (95%+, 90–94%, 80–89%). */
  predictionRewardHigh: number;
  predictionRewardMedium: number;
  predictionRewardLow: number;
  /** When true, prediction window is always open (for testing). Defaults to true in non-production. */
  predictionWindowAlwaysOpen: boolean;
};
