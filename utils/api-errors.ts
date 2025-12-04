export type ApiErrorOptions = {
  code?: string;
  status?: number;
  details?: unknown;
  headers?: HeadersInit;
};

export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;
  headers?: HeadersInit;

  constructor(message: string, options: ApiErrorOptions = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = options.code ?? "API_ERROR";
    this.status = options.status ?? 500;
    this.details = options.details;
    this.headers = options.headers;
  }
}

export class ValidationError extends ApiError {
  constructor(message = "Request tidak valid", options: ApiErrorOptions = {}) {
    super(message, { status: 400, code: "VALIDATION_ERROR", ...options });
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Resource tidak ditemukan", options: ApiErrorOptions = {}) {
    super(message, { status: 404, code: "NOT_FOUND", ...options });
  }
}

export class AuthError extends ApiError {
  constructor(message = "Tidak terautentikasi", options: ApiErrorOptions = {}) {
    super(message, { status: 401, code: "UNAUTHORIZED", ...options });
  }
}

export class PermissionError extends ApiError {
  constructor(message = "Tidak memiliki izin", options: ApiErrorOptions = {}) {
    super(message, { status: 403, code: "FORBIDDEN", ...options });
  }
}

export class RateLimitError extends ApiError {
  constructor(message = "Terlalu banyak permintaan", options: ApiErrorOptions = {}) {
    super(message, { status: 429, code: "RATE_LIMITED", ...options });
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
