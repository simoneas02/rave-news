export class NotFoundError extends Error {
  constructor({ cause, message, action }) {
    super(message, { cause });
    this.name = "NotFoundError";
    this.action = action;
    this.statusCode = 404;
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
