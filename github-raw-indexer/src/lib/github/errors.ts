export interface ErrorLike {
  code: string;
  message: string;
  status?: number;
  details?: Record<string, unknown>;
}

export class AppError extends Error implements ErrorLike {
  code: string;
  status?: number;
  details?: Record<string, unknown>;

  constructor(code: string, message: string, options?: { status?: number; details?: Record<string, unknown>; cause?: unknown }) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = options?.status;
    this.details = options?.details;
    if (options?.cause) {
      this.cause = options.cause;
    }
  }
}

export function isErrorLike(value: unknown): value is ErrorLike {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    "message" in value &&
    typeof (value as { code: unknown }).code === "string" &&
    typeof (value as { message: unknown }).message === "string"
  );
}

export function toErrorLike(value: unknown, fallback?: ErrorLike): ErrorLike {
  if (value instanceof AppError) {
    return { code: value.code, message: value.message, status: value.status, details: value.details };
  }

  if (isErrorLike(value)) {
    return value;
  }

  if (value instanceof Error) {
    return { code: "unexpected_error", message: value.message || "Unexpected error" };
  }

  return fallback ?? { code: "unexpected_error", message: "Unexpected error" };
}
