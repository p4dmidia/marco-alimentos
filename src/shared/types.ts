import z from "zod";

export const AffiliateSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  referral_code: z.string(),
  referred_by_id: z.number().nullable(),
  level: z.number(),
  is_active: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Affiliate = z.infer<typeof AffiliateSchema>;

export const OrderSchema = z.object({
  id: z.number(),
  affiliate_id: z.number(),
  status: z.string(),
  amount: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Order = z.infer<typeof OrderSchema>;

export const TestimonialSchema = z.object({
  id: z.number(),
  name: z.string(),
  content: z.string(),
  rating: z.number(),
  is_active: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Testimonial = z.infer<typeof TestimonialSchema>;

export const FaqSchema = z.object({
  id: z.number(),
  question: z.string(),
  answer: z.string(),
  display_order: z.number(),
  is_active: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Faq = z.infer<typeof FaqSchema>;
