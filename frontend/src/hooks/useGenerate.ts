"use client";

import { useMutation } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { GenerateRequest, GenerateResponse } from "@/types/generate";

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` };
    }
  } catch {
    // Not authenticated — generate without saving
  }
  return {};
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
