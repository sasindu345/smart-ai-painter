"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { apiRequest } from "@/lib/api";
import type { Sketch } from "@/types/sketch";

interface SketchApiItem {
  id: string;
  title: string;
  image_url: string;
  page_preset: string;
  page_width: number;
  page_height: number;
  created_at: string;
  updated_at: string;
}

interface SketchPage {
  items: SketchApiItem[];
  total: number;
  page: number;
  has_more: boolean;
}

function mapItem(item: SketchApiItem): Sketch {
  return {
    id: item.id,
    title: item.title,
    imageUrl: item.image_url,
    pagePreset: item.page_preset,
    pageWidth: item.page_width,
    pageHeight: item.page_height,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

const PAGE_SIZE = 20;

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export function useSketches() {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: ["sketches"],
    queryFn: async ({ pageParam = 1 }) => {
      const headers = await getAuthHeaders();
      return apiRequest<SketchPage>(
        `/api/v1/sketches/?page=${pageParam}&limit=${PAGE_SIZE}`,
        { headers },
      );
    },
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  });

  const allItems = query.data?.pages.flatMap((p) => p.items.map(mapItem)) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;

  const saveMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      image_base64: string;
      page_preset: string;
      page_width: number;
      page_height: number;
    }) => {
      const headers = await getAuthHeaders();
      return apiRequest<SketchApiItem>("/api/v1/sketches/", {
        method: "POST",
        body: JSON.stringify(data),
        headers,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sketches"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const headers = await getAuthHeaders();
      await apiRequest(`/api/v1/sketches/${id}`, {
        method: "DELETE",
        headers,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sketches"] });
    },
  });

  return {
    items: allItems,
    total,
    isLoading: query.isLoading,
    isError: query.isError,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    saveSketch: saveMutation.mutate,
    saveSketchAsync: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    isSaveSuccess: saveMutation.isSuccess,
    resetSave: saveMutation.reset,
    deleteSketch: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}
