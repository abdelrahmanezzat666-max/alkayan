import { z } from "zod";

export const citySchema = z.object({
  name: z.string().trim().min(2).max(80)
});

export const cityIdParamsSchema = z.object({
  id: z.string().trim().min(1)
});
