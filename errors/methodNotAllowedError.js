export class MethodNotAllowedError extends Error {
  constructor({ cause, message, action }) {
    super(message || "This method is not allowed for this endpoint.", {
      cause,
    });
    this.name = "MethodNotAllowedError";
    this.action =
      action || "Verify that the HTTP method sent is valid for this endpoint.";
    this.statusCode = 405;
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
