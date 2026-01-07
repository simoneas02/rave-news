export class InternalServerError extends Error {
  constructor({ cause, statusCode }) {
    super("An unexpected internal error occurred.", { cause });
    this.name = "InternalServerError";
    this.action = "Contact support.";
    this.statusCode = statusCode || 500;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      statusCode: this.statusCode,
    };
  }
}
