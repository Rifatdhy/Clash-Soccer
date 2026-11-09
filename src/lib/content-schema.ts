import { z } from "zod";

/**
 * Length limits for admin-authored text.
 *
 * These fields had no upper bound, so one request could store an arbitrarily
 * large blob in a TEXT column and every page render would carry it. FAQ also
 * accepted blank strings, which the public page then filtered out — the row
 * existed but could never be shown.
 */

export const FAQ_QUESTION_MAX = 300;
export const FAQ_ANSWER_MAX = 3000;
export const NEWS_CONTENT_MAX = 100_000;
export const NEWS_EXCERPT_MAX = 500;

export const faqInputSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, "Question is required")
    .max(FAQ_QUESTION_MAX, `Question must be ${FAQ_QUESTION_MAX} characters or less`),
  answer: z
    .string()
    .trim()
    .min(1, "Answer is required")
    .max(FAQ_ANSWER_MAX, `Answer must be ${FAQ_ANSWER_MAX} characters or less`),
});

export const newsInputSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Content is required")
    .max(NEWS_CONTENT_MAX, `Content must be ${NEWS_CONTENT_MAX} characters or less`),
  excerpt: z
    .string()
    .trim()
    .max(NEWS_EXCERPT_MAX, `Excerpt must be ${NEWS_EXCERPT_MAX} characters or less`)
    .optional()
    .or(z.literal("")),
});
