import { z } from "zod";

// Validates the login form: a real email, and a non-empty password. Kept loose on purpose — we don't re-check the min length here, since the server is the source of truth for "is this actually a valid account".

export const loginSchema = z.object({
  email: z.email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

// Validates the signup form. `.refine()` adds a check that can't be expressed with a single field's rules: password and confirmPassword must match, with the error attached to the confirmPassword field so it shows there.

export const signUpSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    email: z.email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

// Validates the "set a new password" form (after clicking a reset-password email link). Same password-match check as signup, just without the name/email fields.

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
