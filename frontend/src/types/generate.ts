export type ArtStyle = "watercolor" | "oil" | "anime" | "realistic" | "sketch";

export const ART_STYLES: { value: ArtStyle; label: string }[] = [
  { value: "realistic", label: "Realistic" },
  { value: "watercolor", label: "Watercolor" },
  { value: "oil", label: "Oil Paint" },
  { value: "anime", label: "Anime" },
  { value: "sketch", label: "Sketch" },
];

export interface GenerateRequest {
  sketch_base64: string;
  prompt?: string;
  style: ArtStyle;
  strength: number;
  page_preset: string;
  page_width: number;
  page_height: number;
}

export interface GenerateResponse {
  image_base64: string;
  generation_id: string;
  mode: string;
  provider: string;
  scene_description?: string;
  confidence?: number;
  needs_hint?: boolean;
}
