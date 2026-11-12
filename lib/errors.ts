import { NextResponse } from 'next/server';
import { ApiErrorResponse } from './types';

export type ErrorCode =
  | 'FILE_MISSING'
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_FILE_TYPE'
  | 'PDF_PAGE_LIMIT_EXCEEDED'
  | 'UNPARSEABLE_CONTENT'
  | 'DOCUMENT_EMPTY_OR_UNREADABLE'
  | 'INVALID_QUESTION_COUNT'
  | 'INVALID_QUESTION_TYPE'
  | 'INVALID_DIFFICULTY'
  | 'MISSING_API_KEY'
  | 'INVALID_API_KEY'
  | 'RATE_LIMIT_EXCEEDED'
  | 'GATEWAY_TIMEOUT'
  | 'MALFORMED_OUTPUT'
  | 'LLM_PARSE_ERROR'
  | 'LLM_PROVIDER_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'SESSION_NOT_FOUND'
  | 'INTERNAL_SERVER_ERROR';

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;

  constructor(message: string, statusCode = 400, code: ErrorCode = 'INTERNAL_SERVER_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function createErrorResponse(err: unknown): NextResponse<ApiErrorResponse> {
  if (err instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: err.message,
          code: err.code,
        },
      },
      { status: err.statusCode }
    );
  }

  const message = err instanceof Error ? err.message : String(err);
  console.error('Unhandled internal error in API:', err);

  return NextResponse.json(
    {
      success: false,
      error: {
        message: `Terjadi kendala internal pada server: ${message}`,
        code: 'INTERNAL_SERVER_ERROR',
      },
    },
    { status: 500 }
  );
}
