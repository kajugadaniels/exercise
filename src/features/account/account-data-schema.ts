import { z } from "zod";

export const ACCOUNT_DATA_DELETE_CONFIRMATION = "DELETE MY FITNESS DATA";

export const deleteAccountDataSchema = z
  .object({
    confirmation: z.literal(ACCOUNT_DATA_DELETE_CONFIRMATION),
  })
  .strict();
