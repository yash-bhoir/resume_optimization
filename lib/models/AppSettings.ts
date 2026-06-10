import mongoose, { Schema, model, models } from "mongoose";

export interface IAppSettings {
  key: "global";
  freeCreditsPerMonth: number;
  signupBonusCredits: number;
  proMonthlyCreditCap: number;
  creditPackSize: number;
  proMonthlyPriceUsd: number;
  creditPackPriceUsd: number;
  rateLimitOptimizePerHour: number;
  requireSignInToOptimize: boolean;
  guestScorePreviewEnabled: boolean;
  updatedAt: Date;
  updatedBy?: string;
}

const SETTINGS_KEY = "global" as const;

const AppSettingsSchema = new Schema<IAppSettings>(
  {
    key: { type: String, required: true, unique: true, default: SETTINGS_KEY },
    freeCreditsPerMonth: { type: Number, default: 3, min: 0, max: 100 },
    signupBonusCredits: { type: Number, default: 1, min: 0, max: 50 },
    proMonthlyCreditCap: { type: Number, default: 50, min: 1, max: 500 },
    creditPackSize: { type: Number, default: 10, min: 1, max: 200 },
    proMonthlyPriceUsd: { type: Number, default: 12, min: 0, max: 999 },
    creditPackPriceUsd: { type: Number, default: 5, min: 0, max: 999 },
    rateLimitOptimizePerHour: { type: Number, default: 5, min: 1, max: 100 },
    requireSignInToOptimize: { type: Boolean, default: false },
    guestScorePreviewEnabled: { type: Boolean, default: true },
    updatedBy: { type: String, default: "" },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export const AppSettings =
  models.AppSettings || model<IAppSettings>("AppSettings", AppSettingsSchema);

export type PricingSettings = Omit<IAppSettings, "key" | "updatedAt" | "updatedBy"> & {
  updatedAt?: Date;
  updatedBy?: string;
};

export const DEFAULT_PRICING_SETTINGS: PricingSettings = {
  freeCreditsPerMonth: 3,
  signupBonusCredits: 1,
  proMonthlyCreditCap: 50,
  creditPackSize: 10,
  proMonthlyPriceUsd: 12,
  creditPackPriceUsd: 5,
  rateLimitOptimizePerHour: 5,
  requireSignInToOptimize: false,
  guestScorePreviewEnabled: true,
};
