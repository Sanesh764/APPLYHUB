const { z } = require("zod");

const createProfileSchema = z.object({
  preferredRole: z
    .string({ required_error: "Preferred role is required" })
    .min(2, "Preferred role must be at least 2 characters")
    .max(100),
  experienceLevel: z.enum(["entry", "mid", "senior", "lead", "executive"], {
    errorMap: () => ({ message: "Experience level must be: entry, mid, senior, lead, or executive" }),
  }),
  skills: z.array(z.string()).default([]),
  preferredCountries: z.array(z.string()).default([]),
  preferredCities: z.array(z.string()).default([]),
  workMode: z.enum(["remote", "hybrid", "onsite", "any"], {
    errorMap: () => ({ message: "Work mode must be: remote, hybrid, onsite, or any" }),
  }),
  expectedSalary: z.number().nonnegative("Salary must be positive").optional(),
  employmentType: z.enum(["full-time", "part-time", "contract", "internship"], {
    errorMap: () => ({ message: "Employment type must be: full-time, part-time, contract, or internship" }),
  }),
  noticePeriod: z.number().int().nonnegative("Notice period cannot be negative").default(0),
  workAuthorization: z.string().optional(),
  languages: z.array(z.string()).default([]),
});

module.exports = {
  createProfileSchema,
};
