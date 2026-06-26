"use client";

import { useMutation } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api";
import type { GenerateRequest, GenerateResponse } from "@/types/generate";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export function useGenerate() {
  const mutation = useMutation<GenerateResponse, Error, GenerateRequest>({
    mutationFn: async (req) => {
      const headers = await getAuthHeaders();
      return apiRequest<GenerateResponse>("/api/v1/generate/", {
        method: "POST",
        body: JSON.stringify(req),
        headers,
      });
    },
  });

  return {
    generate: mutation.mutate,
    generateAsync: mutation.mutateAsync,
    data: mutation.data,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    reset: mutation.reset,
  };
}
