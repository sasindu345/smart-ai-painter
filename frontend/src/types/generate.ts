export type ArtStyle =
  | "watercolor"
  | "oil"
  | "anime"
  | "realistic"
  | "sketch";

export interface GenerateRequest {
  sketchBase64: string;
  prompt: string;
  style: ArtStyle;
  strength: number;
}

export interface GenerateResponse {
  imageBase64: string;
  generationId: string;
}
