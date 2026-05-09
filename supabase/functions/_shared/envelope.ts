import { corsHeaders } from './cors.ts';

export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'VALIDATION_FAILED'
  | 'AI_QUOTA_EXCEEDED'
  | 'RESUME_NOT_FOUND'
  | 'AI_PROVIDER_FAILED'
  | 'PDF_RENDER_FAILED'
  | 'METHOD_NOT_ALLOWED'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR';

export class ApiError extends Error {
  code: ErrorCode;
  status: number;
  details?: unknown;

  constructor(code: ErrorCode, message: string, status = 400, details?: unknown) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function json<T>(data: T, status = 200) {
  return new Response(
    JSON.stringify({
      success: true,
      data,
      meta: { requestId: crypto.randomUUID(), timestamp: new Date().toISOString() },
    }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    },
  );
}

export function errorResponse(error: unknown) {
  const apiError =
    error instanceof ApiError
      ? error
      : new ApiError('INTERNAL_ERROR', error instanceof Error ? error.message : 'Unexpected error', 500);

  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code: apiError.code,
        message: apiError.message,
        details: apiError.details,
      },
    }),
    {
      status: apiError.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    },
  );
}
