export const PLAN_LIMITS = {
  FREE:       { categories: 3,  menuItems: 15,  admins: 1 },
  PRO:        { categories: 15, menuItems: 100, admins: 5 },
  ENTERPRISE: { categories: Infinity, menuItems: Infinity, admins: Infinity },
} as const;

export type PlanKey = keyof typeof PLAN_LIMITS;
