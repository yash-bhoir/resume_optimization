/** @deprecated Import from ./credits instead */
export {
  type CreditStatus as QuotaStatus,
  type CreditAction as QuotaAction,
  type ReservedCredit,
  getCreditStatus as checkQuota,
  reserveCredit as reserveQuota,
  releaseCredit as releaseQuota,
  getUserPlan,
  canDownload,
  addPackCredits,
  setUserPlan,
} from "./credits";
