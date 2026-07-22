import type { Node, Edge } from "@xyflow/react";

export type ActivityCategory =
  | "Criminal"
  | "Legal"
  | "Industrial"
  | "Serviço"
  | "Evento"
  | "Outro";

export type ActivityStatus = "Ativo" | "Pausado" | "Rascunho";

export type MoneyType = "limpo" | "sujo";

export type EdgeType = "REQUER" | "ENTREGA" | "PAGA" | "ALIMENTA" | "CRAFTA";

export type BlockKind = "activity" | "item" | "money" | "note";

export interface ActivityData {
  kind: "activity";
  name: string;
  category: ActivityCategory;
  status: ActivityStatus;
  description: string;
  durationMin: number;
  playersMin: number;
  playersMax: number;
  cooldownMin: number;
  paymentMin: number;
  paymentMax: number;
  moneyType: MoneyType;
  observation: string;
  imageUrl?: string;
  accentColor?: string;
  [key: string]: unknown;
}

export interface ItemData {
  kind: "item";
  itemId: string;
  name: string;
  identifier: string;
  category: string;
  icon: string;
  color: string;
  referenceValue: number;
  observation: string;
  imageUrl?: string;
  [key: string]: unknown;
}

export interface MoneyData {
  kind: "money";
  label: string;
  moneyType: MoneyType;
  amountMin: number;
  amountMax: number;
  perPlayer: boolean;
  observation: string;
  [key: string]: unknown;
}

export interface NoteData {
  kind: "note";
  title: string;
  text: string;
  [key: string]: unknown;
}

export type BlockData = ActivityData | ItemData | MoneyData | NoteData;

export interface EdgeData {
  edgeType: EdgeType;
  qtyMin: number;
  qtyMax: number;
  chance: number;
  consumes: boolean;
  observation: string;
  [key: string]: unknown;
}

export type BoardNode = Node<BlockData>;
export type BoardEdge = Edge<EdgeData>;

export interface CatalogItem {
  id: string;
  name: string;
  identifier: string;
  category: string;
  referenceValue: number;
  icon: string;
  color: string;
  imageUrl?: string;
}

export const EDGE_COLORS: Record<EdgeType, string> = {
  REQUER: "#f59e0b",
  ENTREGA: "#36c0ff",
  PAGA: "#22c55e",
  ALIMENTA: "#8b5cf6",
  CRAFTA: "#facc15",
};

export const EDGE_LABELS: Record<EdgeType, string> = {
  REQUER: "REQUER",
  ENTREGA: "ENTREGA",
  PAGA: "PAGA",
  ALIMENTA: "ALIMENTA",
  CRAFTA: "CRAFTA",
};

export const ACTIVITY_CATEGORIES: ActivityCategory[] = [
  "Criminal",
  "Legal",
  "Industrial",
  "Serviço",
  "Evento",
  "Outro",
];

export const ACTIVITY_STATUSES: ActivityStatus[] = ["Ativo", "Pausado", "Rascunho"];
