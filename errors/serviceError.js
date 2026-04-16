export class ServiceError extends Error {
  constructor({ cause, message, action, context }) {
    super(message || "Service currently unavailable.", { cause });
    this.name = "ServiceError";
    this.action = action || "Check if the service is available.";
    this.statusCode = 503;
    this.context = context;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
      context: this.context,
    };
  }
}
