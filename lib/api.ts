export type ApiResponse<T = Record<string, unknown>> = T & {
  success?: boolean;
  message?: string;
};

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<{ status: number; data: ApiResponse<T> }> {
  const headers = new Headers(init.headers);

  if (
    init.body !== undefined &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    ...init,
    headers,
    credentials: "include",
  });

  let data: ApiResponse<T> = {} as ApiResponse<T>;

  try {
    data = (await response.json()) as ApiResponse<T>;
  } catch {
    data = {
      success: false,
      message: "The server returned an unexpected response.",
    } as ApiResponse<T>;
  }

  return { status: response.status, data };
}
