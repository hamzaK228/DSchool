import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  full_name: z.string().min(1, "Full name is required"),
  join_code: z.string().min(1, "Join code is required"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const homeworkSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  due_date: z.string().optional(),
});

export const announcementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
});

export const surveySchema = z.object({
  question: z.string().min(1, "Question is required"),
  options: z.array(z.string().min(1, "Option cannot be empty")).min(2, "At least 2 options required"),
  closes_at: z.string().optional(),
});

export const examQuestionSchema = z.object({
  id: z.string(),
  type: z.enum(["multiple_choice", "essay"]),
  text: z.string().min(1, "Question text is required"),
  image_url: z.string().nullable(),
  options: z.array(z.string()),
  correct: z.number().int().min(0).default(0),
  points: z.number().int().min(1).default(1),
});

export const examSchema = z.object({
  title: z.string().min(1, "Title is required"),
  questions: z.array(examQuestionSchema).min(1, "At least one question is required"),
  time_limit_minutes: z.number().int().positive().nullable().optional(),
  visible_from: z.string().optional(),
  closes_at: z.string().nullable().optional(),
});

export const textSubmissionSchema = z.object({
  homework_id: z.string().uuid(),
  text_content: z.string().min(1, "Content is required"),
});

export const messageSchema = z.object({
  receiver_id: z.string().uuid(),
  body: z.string().min(1, "Message cannot be empty"),
});