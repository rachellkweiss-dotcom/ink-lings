import { z } from 'zod';

/**
 * Validation schemas for API endpoints
 */

// Email validation schema
export const emailSchema = z.string().email('Invalid email address').max(255, 'Email too long');

// Send email API validation
export const sendEmailSchema = z.object({
  email: emailSchema,
  subject: z.string().max(200, 'Subject too long').optional(),
  text: z.string().max(10000, 'Text content too long').optional(),
  html: z.string().max(50000, 'HTML content too long').optional(),
});

// User prompt history validation
export const userPromptHistorySchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
});

// Donation session validation
export const donationSessionSchema = z.object({
  amount: z.number().positive('Amount must be positive').max(100000, 'Amount too large'),
  donationType: z.enum(['one-time', 'monthly', 'coffee_journaling', 'custom_donation'], {
    message: 'Donation type must be one-time, monthly, coffee_journaling, or custom_donation',
  }),
  customerEmail: emailSchema,
});

// Feedback validation
export const feedbackSchema = z.object({
  token: z.string().min(1, 'Token is required').max(255, 'Token too long'),
  type: z.enum(['up', 'down'], {
    message: 'Type must be up or down',
  }),
  promptId: z.string().uuid('Invalid prompt ID format'),
});

// Social media render validation
export const textElementSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  x: z.number().int().min(0, 'X position must be non-negative'),
  y: z.number().int().min(0, 'Y position must be non-negative'),
  fontFamily: z.string().min(1, 'Font family is required'),
  fontSize: z.number().positive('Font size must be positive'),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color must be a valid hex color'),
  textAlign: z.enum(['left', 'center', 'right']).optional().default('left'),
  fontWeight: z.enum(['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900']).optional().default('normal'),
  maxWidth: z.number().positive().optional(), // Optional max width for text wrapping
});

export const renderSocialSchema = z.object({
  backgroundImage: z.string().min(1, 'Background image is required'), // URL or base64
  width: z.number().int().positive().max(5000, 'Width too large'),
  height: z.number().int().positive().max(5000, 'Height too large'),
  textElements: z.array(textElementSchema).min(1, 'At least one text element is required'),
});

/**
 * Validate request body against a schema
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ data: T; error: null } | { data: null; error: Response }> {
  try {
    const body = await request.json();
    const validated = schema.parse(body);
    return { data: validated, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        data: null,
        error: new Response(
          JSON.stringify({
            error: 'Validation failed',
            details: error.issues,
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
      };
    }
    return {
      data: null,
      error: new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }
}

/**
 * Validate query parameters against a schema
 */
export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): { data: T; error: null } | { data: null; error: Response } {
  try {
    const params = Object.fromEntries(searchParams.entries());
    const validated = schema.parse(params);
    return { data: validated, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        data: null,
        error: new Response(
          JSON.stringify({
            error: 'Validation failed',
            details: error.issues,
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
      };
    }
    return {
      data: null,
      error: new Response(
        JSON.stringify({ error: 'Invalid query parameters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }
}

