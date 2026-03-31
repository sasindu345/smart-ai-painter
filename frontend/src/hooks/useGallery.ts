"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { apiRequest } from "@/lib/api";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { Generation } from "@/types/gallery";

interface GalleryApiItem {
  id: string;
  prompt: string;
  style: string;
  image_url: string;
  created_at: string;
}

interface GalleryPage {
  items: GalleryApiItem[];
  total: number;
  page: number;
  has_more: boolean;
}

function mapItem(item: GalleryApiItem): Generation {
  return {
    id: item.id,
    prompt: item.prompt,
    style: item.style as Generation["style"],
    imageUrl: item.image_url,
    createdAt: item.created_at,
  };
}

const PAGE_SIZE = 20;

async function getAuthHeaders(): Promise<Record<string, string>> {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

export function useGallery() {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: ["gallery"],
    queryFn: async ({ pageParam = 1 }) => {
      const headers = await getAuthHeaders();
      return apiRequest<GalleryPage>(
        `/api/v1/gallery/?page=${pageParam}&limit=${PAGE_SIZE}`,
        { headers },
      );
    },
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  });

  const allItems = query.data?.pages.flatMap((p) => p.items.map(mapItem)) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const headers = await getAuthHeaders();
      await apiRequest(`/api/v1/gallery/${id}`, {
        method: "DELETE",
        headers,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
    },
  });

  return {
    items: allItems,
    total,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    deleteGeneration: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}
