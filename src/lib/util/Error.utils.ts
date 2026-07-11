import { HttpErrorResponse } from "@angular/common/http";
import { ViesErrorResponse } from "../model/error.model";

// Normalized field/general error shape for forms and toasts.
// `field` is undefined for general (entity-level) errors.
export interface FieldError {
  field?: string;
  message: string;
}

// Normalize any thrown error from an HTTP call into a list of FieldError entries the
// UI can route to form controls (when `field` is set) or display as toasts (when not).
//
// Recognized backend shapes (most → least specific):
//   1. Spring @Valid: { errors: [{ field, defaultMessage }] }
//   2. Spring @Valid alt: { fieldErrors: [{ field, message }] }
//   3. Generic: { errors: [{ field, message }] }
//   4. Vies framework: ViesErrorResponse with `reason` / `message` / `localizedMessage`
//   5. Plain string body
//   6. JS Error
//   7. Anything else → one generic FieldError with `defaultMessage`
//
// Build ONE error-mapper service on the Angular app and route every thrown error
// through here (intent § 7.5).
export class ErrorMapper {

  static map(error: unknown, defaultMessage = 'An unexpected error has occurred'): FieldError[] {
    if (!error) return [{ message: defaultMessage }];

    // Most HttpClient errors arrive as HttpErrorResponse with `.error` carrying the
    // server body. Drill into that first.
    const body = ErrorMapper.unwrapBody(error);
    if (body !== undefined && body !== null) {
      const fromBody = ErrorMapper.fromBody(body);
      if (fromBody.length) return fromBody;
    }

    // Fall back on outer-level info (HttpErrorResponse.message, Error.message).
    if (error instanceof HttpErrorResponse) {
      return [{ message: error.message || defaultMessage }];
    }
    if (error instanceof Error) {
      return [{ message: error.message || defaultMessage }];
    }
    if (typeof error === 'string') {
      return [{ message: error }];
    }
    return [{ message: defaultMessage }];
  }

  // Return the first error whose `field` matches (case-sensitive). Useful in
  // template: `getFieldError(errors, 'email')?.message`.
  static getFieldError(errors: FieldError[] | null | undefined, field: string): FieldError | undefined {
    if (!errors) return undefined;
    return errors.find(e => e.field === field);
  }

  // Return entries with no `field` — entity-level / general messages. Use for toasts
  // or banners.
  static getGeneralErrors(errors: FieldError[] | null | undefined): FieldError[] {
    if (!errors) return [];
    return errors.filter(e => !e.field);
  }

  // Convenience: a single string suitable for a snackbar/toast.
  static toMessage(errors: FieldError[] | null | undefined, fallback = ''): string {
    if (!errors || errors.length === 0) return fallback;
    return errors.map(e => (e.field ? `${e.field}: ${e.message}` : e.message)).join('\n');
  }

  // ----------------------------------------------------------------------

  private static unwrapBody(error: unknown): any {
    if (error instanceof HttpErrorResponse) return error.error;
    if (typeof error === 'object' && error !== null && 'error' in error) {
      return (error as any).error;
    }
    return error;
  }

  private static fromBody(body: any): FieldError[] {
    const out: FieldError[] = [];

    // Pattern 1: Spring's default Valid response — `{ errors: [{ field, defaultMessage }] }`.
    if (Array.isArray(body?.errors)) {
      for (const e of body.errors) {
        const field = e.field ?? e.objectName;
        const message = e.defaultMessage ?? e.message ?? '';
        if (message) out.push(field ? { field, message } : { message });
      }
    }

    // Pattern 2: `{ fieldErrors: [{ field, message }] }` — some Vies/other Spring configs.
    if (Array.isArray(body?.fieldErrors)) {
      for (const e of body.fieldErrors) {
        const field = e.field;
        const message = e.message ?? e.defaultMessage ?? '';
        if (message) out.push(field ? { field, message } : { message });
      }
    }

    if (out.length) return out;

    // Pattern 4: ViesErrorResponse shape (existing lib model).
    const viesMessage = body?.reason || body?.localizedMessage || body?.message;
    if (typeof viesMessage === 'string' && viesMessage) {
      return [{ message: viesMessage }];
    }

    // Pattern 5: plain string body.
    if (typeof body === 'string' && body) {
      return [{ message: body }];
    }

    return [];
  }

  // Type guard helper: extract a typed ViesErrorResponse if the error matches.
  static asViesError(error: unknown): ViesErrorResponse | undefined {
    const body = ErrorMapper.unwrapBody(error);
    if (body && typeof body === 'object' && ('reason' in body || 'localizedMessage' in body || 'message' in body)) {
      return body as ViesErrorResponse;
    }
    return undefined;
  }
}
