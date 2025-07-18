import { z } from "zod";

// User validation schemas
export const UserRegistrationSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const UserLoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const UsageQuotaSchema = z.object({
  videosProcessed: z.number().int().min(0),
  monthlyLimit: z.number().int().min(1),
  resetDate: z.date(),
});

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  createdAt: z.date(),
  subscription: z.enum(["free", "premium"]),
  usageQuota: UsageQuotaSchema,
});

// Type inference from schemas
export type UserRegistration = z.infer<typeof UserRegistrationSchema>;
export type UserLogin = z.infer<typeof UserLoginSchema>;
export type UsageQuota = z.infer<typeof UsageQuotaSchema>;
export type User = z.infer<typeof UserSchema>;
