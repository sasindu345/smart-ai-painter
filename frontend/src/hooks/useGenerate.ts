"use client";

import { useMutation } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api";
import type { GenerateRequest, GenerateResponse } from "@/types/generate";

export function useGenerate() {
  const mutation = useMutation<GenerateResponse, Error, GenerateRequest>({
    mutationFn: (req) =>
      apiRequest<GenerateResponse>("/api/v1/generate/", {
        method: "POST",
        body: JSON.stringify(req),
      }),
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
