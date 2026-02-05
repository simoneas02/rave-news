export class ValidationError extends Error {
  constructor({ cause, message, action }) {
    super(message || "A validation error occurred.", { cause });
    this.name = "ValidationError";
    this.action = action || "Please check your input and try again.";
    this.statusCode = 400;
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
