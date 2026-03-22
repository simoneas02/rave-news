export class UnauthorizedError extends Error {
  constructor({ cause, message, action }) {
    super(message || "Unauthenticated user.", { cause });
    this.name = "UnauthorizedError";
    this.action = action || "Try logging in again.";
    this.statusCode = 401;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}
