import { z } from "zod";

// pay_[alphanumeric]{20} observed from sandbox; keep slightly loose for prod variation
export const paymentIdSchema = z.string().regex(/^pay_[A-Za-z0-9]{10,64}$/);
export const customerIdSchema = z.string().regex(/^[A-Za-z0-9_\-]{1,128}$/);
export const amountSchema = z.number().int().positive().max(99_999_999);

// E.164-ish: optional +, then 7–15 digits (spaces/dashes stripped server-side if needed)
const phoneSchema = z.string().regex(/^\+?[\d\s\-\(\)]{7,20}$/);

export const passengerSchema = z.object({
  firstName: z.string().regex(/^[A-Za-z\s\-']{1,50}/),
  lastName:  z.string().regex(/^[A-Za-z\s\-']{1,50}/),
  email:     z.string().email(),
  phone:     phoneSchema,
  dob:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const createPaymentSchema = z.object({
  amount:     amountSchema,
  currency:   z.string().length(3).optional(),
  customerId: customerIdSchema.nullish(),
  customer:   passengerSchema,
  booking:    z.object({ id: z.string(), route: z.string() }).optional(),
});

export const createCustomerSchema = z.object({
  email: z.string().email(),
  name:  z.string().regex(/^[A-Za-z\s\-']{1,50}$/).optional(),
  phone: phoneSchema.optional(),
});

export const capturePaymentSchema = z.object({
  paymentId: paymentIdSchema,
});

export const refundSchema = z.object({
  paymentId: paymentIdSchema,
  amount:    amountSchema.optional(),
});
