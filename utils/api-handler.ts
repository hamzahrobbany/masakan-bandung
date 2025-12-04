import { error } from "@/utils/response";
import { isApiError } from "@/utils/api-errors";

export function handleApiError(errorValue: unknown) {
  if (isApiError(errorValue)) {
    return error(errorValue.code, errorValue.message, {
      status: errorValue.status,
      details: errorValue.details,
      headers: errorValue.headers,
    });
  }

  console.error("Unhandled API error:", errorValue);
  return error("INTERNAL_SERVER_ERROR", "Terjadi kesalahan pada server", {
    status: 500,
  });
}

export function withErrorHandling<Args extends unknown[], ResponseType>(
  handler: (...args: Args) => Promise<ResponseType>
) {
  return (async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (err) {
      return handleApiError(err);
    }
  }) as (...args: Args) => Promise<ResponseType>;
}
