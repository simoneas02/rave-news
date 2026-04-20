export class ForbiddenError extends Error {
  constructor({ cause, message, action }) {
    super(message || "Access denied.", { cause });
    this.name = "ForbiddenError";
    this.action =
      action ||
      "Verify if you are using the correct account or contact your administrator to request access.";
    this.statusCode = 403;
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
