import type { ArtStyle } from "./generate";

export interface Generation {
  id: string;
  prompt: string;
  style: ArtStyle;
  imageUrl: string;
  createdAt: string;
}
