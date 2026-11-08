import { z } from "zod";

const matchStatus = z.enum(["upcoming", "completed", "ongoing"]);

const baseMatchSchema = z.object({
  id: z.string().trim().min(1, "ID is required"),
  title: z.string().trim().min(1, "Title is required"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
  location: z.string().trim().min(1, "Location is required"),
  slotsTotal: z.number().int().positive("Total slots must be a positive number"),
  slotsAvailable: z
    .number()
    .int()
    .nonnegative("Available slots must be a non-negative number")
    .optional(),
  status: matchStatus,
});

function slotsWithinTotal(data: {
  slotsAvailable?: number;
  slotsTotal?: number;
}): boolean {
  return (
    data.slotsAvailable === undefined ||
    data.slotsTotal === undefined ||
    data.slotsAvailable <= data.slotsTotal
  );
}

export const matchCreateSchema = baseMatchSchema
  .extend({ status: matchStatus.default("upcoming") })
  .refine(slotsWithinTotal, {
    message: "Available slots cannot exceed total slots",
    path: ["slotsAvailable"],
  });

export const matchUpdateSchema = baseMatchSchema
  .partial()
  .required({ id: true })
  .refine(slotsWithinTotal, {
    message: "Available slots cannot exceed total slots",
    path: ["slotsAvailable"],
  });
