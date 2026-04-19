export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = "Bad request", code: string = "BAD_REQUEST") {
    super(message, 400, code);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, code: string = "VALIDATION_ERROR") {
    super(message, 400, code);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication failed", code: string = "AUTH_ERROR") {
    super(message, 401, code);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Access denied", code: string = "FORBIDDEN") {
    super(message, 403, code);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found", code: string = "NOT_FOUND") {
    super(message, 404, code);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Resource already exists", code: string = "CONFLICT") {
    super(message, 409, code);
  }
}
