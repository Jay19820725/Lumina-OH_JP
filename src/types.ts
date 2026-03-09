import { Type } from "@google/genai";

export enum ElementType {
  WOOD = "Wood",
  FIRE = "Fire",
  EARTH = "Earth",
  METAL = "Metal",
  WATER = "Water",
}

export interface EnergyWeights {
  Wood: number;
  Fire: number;
  Earth: number;
  Metal: number;
  Water: number;
}

export interface OHCardData {
  id: string;
  name: string;
  element: ElementType;
  weight: Partial<EnergyWeights>;
  color: string;
  desc: string;
}

export interface ChatMessage {
  role: "user" | "model";
  content: string;
  energyUpdate?: EnergyWeights;
}

export const ELEMENT_COLORS: Record<ElementType, string> = {
  [ElementType.WOOD]: "#A8E6CF",
  [ElementType.FIRE]: "#FFB7B2",
  [ElementType.EARTH]: "#FDFD96",
  [ElementType.METAL]: "#E0E0E0",
  [ElementType.WATER]: "#B39DDB",
};

export const ELEMENT_NAMES_ZH: Record<ElementType, string> = {
  [ElementType.WOOD]: "木",
  [ElementType.FIRE]: "火",
  [ElementType.EARTH]: "土",
  [ElementType.METAL]: "金",
  [ElementType.WATER]: "水",
};
