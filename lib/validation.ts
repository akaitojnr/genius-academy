import { z } from "zod";

export const classLevels = ["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"] as const;

export const studentRegisterSchema = z.object({
  fullName: z.string().min(3, "Full name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(10, "Enter a valid phone number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  classLevel: z.enum(classLevels),
  school: z.string().optional(),
  state: z.string().optional(),
  preferredSubjectSlugs: z.array(z.string()).optional().default([]),
  parentName: z.string().min(2, "Parent/guardian name is required"),
  parentPhone: z.string().min(10, "Enter a valid parent/guardian phone number"),
});

export type StudentRegisterInput = z.infer<typeof studentRegisterSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export const parentRegisterSchema = z.object({
  fullName: z.string().min(3, "Full name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(10, "Enter a valid phone number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
