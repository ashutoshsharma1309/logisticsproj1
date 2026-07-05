import { z } from "zod";

/** Login form schema — email + password (min 8). */
export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  remember: z.boolean().default(false),
});
export type LoginValues = z.infer<typeof loginSchema>;

/** Selectable account roles for signup. */
export const roleValues = ["admin", "manager", "warehouse", "driver", "customer"] as const;

/** Signup form schema — name, email, password, confirm, role, terms. */
export const signupSchema = z
  .object({
    name: z.string().min(2, "Enter your full name"),
    company: z.string().min(2, "Enter your company name"),
    email: z.string().min(1, "Email is required").email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your password"),
    role: z.enum(roleValues, { required_error: "Select a role" }),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: "You must accept the terms to continue" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type SignupValues = z.infer<typeof signupSchema>;

/** Forgot-password form schema — email only. */
export const forgotSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
});
export type ForgotValues = z.infer<typeof forgotSchema>;

/** OTP verification schema — 6 digit code. */
export const otpSchema = z.object({
  code: z
    .string()
    .length(6, "Enter all 6 digits")
    .regex(/^\d{6}$/, "Code must be numeric"),
});
export type OtpValues = z.infer<typeof otpSchema>;
