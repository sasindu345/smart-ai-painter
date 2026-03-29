const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const STATUS_MESSAGES: Record<number, string> = {
  400: "Invalid input — please check your sketch and try again.",
  422: "Missing or invalid fields. Please fill in all required inputs.",
  500: "Something went wrong on our end. Please try again.",
  502: "AI provider returned an error. Try again shortly.",
  503: "AI service is not available. Check your configuration.",
  504: "AI provider timed out. Try a simpler prompt or try again.",
};

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const fallback =
      STATUS_MESSAGES[res.status] ?? `Request failed (${res.status})`;
    let message = fallback;

    try {
      const body = await res.json();
      if (body.detail) message = body.detail;
    } catch {
      // Use fallback message
    }

    throw new ApiError(res.status, message);
  }

  return res.json() as Promise<T>;
}
