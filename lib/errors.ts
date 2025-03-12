import { showToast } from "@/lib/toast";

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "AppError";
    Object.setPrototypeOf(this, AppError.prototype);
  };
};

export class DatabaseError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, "DATABASE_ERROR", details);
    this.name = "DatabaseError";
    Object.setPrototypeOf(this, DatabaseError.prototype);
  };
};

export class AuthError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, "AUTH_ERROR", details);
    this.name = "AuthError";
    Object.setPrototypeOf(this, AuthError.prototype);
  };
};

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
    Object.setPrototypeOf(this, ValidationError.prototype);
  };
};

export function handleError(error: unknown, friendlyMessage?: string): void {
  console.error("Error occurred:", error);

  const defaultMessage = "Something went wrong. Please try again later.";
  const message = friendlyMessage || defaultMessage;

  if (error instanceof AppError) {
    showToast({
      title: error.name,
      description: error.message,
      type: "error"
    });
    return;
  };
  showToast({
    title: "Error",
    description: message,
    type: "error"
  });
};