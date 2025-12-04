import { NextResponse } from "next/server";

export type ApiSuccessResponse<T> = {
  success: true;
  data?: T;
};

export type ApiErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

type ResponseOptions = Omit<ResponseInit, "status"> & { status?: number };

export function success<T>(data?: T, init?: ResponseOptions) {
  const payload: ApiSuccessResponse<T> = { success: true };

  if (data !== undefined) {
    payload.data = data;
  }

  return NextResponse.json(payload, init);
}

export function error(
  code: string,
  message: string,
  options?: { details?: unknown } & ResponseOptions
) {
  const payload: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(options?.details !== undefined ? { details: options.details } : {}),
    },
  };

  return NextResponse.json(payload, options);
}
