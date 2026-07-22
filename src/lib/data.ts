import type { BoardNode, BoardEdge, CatalogItem, ActivityData } from "./types";

export let CATALOG: CatalogItem[] = [];

export let CATALOG_CATEGORIES: string[] = [];

export const CATALOG_SOURCE_URL = "https://jampas335.github.io/underp-itens/data/ready-items-export.json";
const catalogListeners = new Set<() => void>();

export function subscribeCatalog(listener: () => void): () => void {
  catalogListeners.add(listener);
  return () => catalogListeners.delete(listener);
}

export async function loadRemoteCatalog(): Promise<number> {
  const response = await fetch(`${CATALOG_SOURCE_URL}?t=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`CatÃ¡logo indisponÃ­vel (${response.status})`);
  const payload = (await response.json()) as { items?: Array<Record<string, unknown>> };
  const items = (payload.items ?? [])
    .filter((item) => typeof item.id === "string" && typeof item.name === "string")
    .map((item): CatalogItem => ({
      id: String(item.id),
      name: String(item.label || item.name),
      identifier: String(item.name),
      category: String(item.category || "Outros"),
      referenceValue: Number(item.referenceValue ?? item.value ?? 0) || 0,
      icon: String(item.type) === "weapon" ? "Shield" : "Boxes",
      color: String(item.type) === "weapon" ? "#f59e0b" : "#36c0ff",
      imageUrl: typeof item.imageUrl === "string" ? item.imageUrl : undefined,
    }));
  if (!items.length) throw new Error("CatÃ¡logo remoto vazio");
  CATALOG = items;
  CATALOG_CATEGORIES = [...new Set(items.map((item) => item.category))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  catalogListeners.forEach((listener) => listener());
  return items.length;
}

export function findCatalogItem(id: string): CatalogItem {
  return CATALOG.find((c) => c.id === id) ?? { id, name: id, identifier: id, category: "Remoto", referenceValue: 0, icon: "Boxes", color: "#36c0ff" };
}

export function buildInitialNodes(): BoardNode[] {
  const mergulho: ActivityData = {
    kind: "activity",
    name: "Mergulho Ilegal",
    category: "Criminal",
    status: "Ativo",
    description: "Recupera materiais submersos em Ã¡rea restrita.",
    durationMin: 20,
    playersMin: 1,
    playersMax: 2,
    cooldownMin: 30,
    paymentMin: 700,
    paymentMax: 1200,
    moneyType: "sujo",
    observation: "",
  };

  const mineracao: ActivityData = {
    kind: "activity",
    name: "MineraÃ§Ã£o",
    category: "Industrial",
    status: "Ativo",
    description: "ExtraÃ§Ã£o de minÃ©rio bruto em pedreira.",
    durationMin: 15,
    playersMin: 1,
    playersMax: 3,
    cooldownMin: 10,
    paymentMin: 300,
    paymentMax: 500,
    moneyType: "limpo",
    observation: "",
  };

  const fundicao: ActivityData = {
    kind: "activity",
    name: "FundiÃ§Ã£o",
    category: "Industrial",
    status: "Ativo",
    description: "Refina minÃ©rio em lingotes comercializÃ¡veis.",
    durationMin: 10,
    playersMin: 1,
    playersMax: 2,
    cooldownMin: 5,
    paymentMin: 0,
    paymentMax: 0,
    moneyType: "limpo",
    observation: "Processamento intermediÃ¡rio.",
  };

  const sucatItem = findCatalogItem("sucata_eletronica")!;
  const joiaItem = findCatalogItem("joia_perdida")!;
  const pecaItem = findCatalogItem("peca_metalica")!;
  const docItem = findCatalogItem("documento_molhado")!;
  const minerioFe = findCatalogItem("minerio_ferro")!;
  const lingoteFe = findCatalogItem("lingote_ferro")!;

  const nodes: BoardNode[] = [
    {
      id: "act-mergulho",
      type: "activity",
      position: { x: 120, y: 200 },
      data: mergulho,
    },
    {
      id: "item-sucata",
      type: "item",
      position: { x: 520, y: 60 },
      data: {
        kind: "item",
        itemId: sucatItem.id,
        name: sucatItem.name,
        identifier: sucatItem.identifier,
        category: sucatItem.category,
        icon: sucatItem.icon,
        color: sucatItem.color,
        referenceValue: sucatItem.referenceValue,
        observation: "",
      },
    },
    {
      id: "item-joia",
      type: "item",
      position: { x: 520, y: 200 },
      data: {
        kind: "item",
        itemId: joiaItem.id,
        name: joiaItem.name,
        identifier: joiaItem.identifier,
        category: joiaItem.category,
        icon: joiaItem.icon,
        color: joiaItem.color,
        referenceValue: joiaItem.referenceValue,
        observation: "",
      },
    },
    {
      id: "item-peca",
      type: "item",
      position: { x: 520, y: 340 },
      data: {
        kind: "item",
        itemId: pecaItem.id,
        name: pecaItem.name,
        identifier: pecaItem.identifier,
        category: pecaItem.category,
        icon: pecaItem.icon,
        color: pecaItem.color,
        referenceValue: pecaItem.referenceValue,
        observation: "",
      },
    },
    {
      id: "item-doc",
      type: "item",
      position: { x: 520, y: 470 },
      data: {
        kind: "item",
        itemId: docItem.id,
        name: docItem.name,
        identifier: docItem.identifier,
        category: docItem.category,
        icon: docItem.icon,
        color: docItem.color,
        referenceValue: docItem.referenceValue,
        observation: "",
      },
    },
    {
      id: "money-mergulho",
      type: "money",
      position: { x: 520, y: 610 },
      data: {
        kind: "money",
        label: "Pagamento",
        moneyType: "sujo",
        amountMin: 700,
        amountMax: 1200,
        perPlayer: true,
        observation: "",
      },
    },
    {
      id: "act-mineracao",
      type: "activity",
      position: { x: 120, y: 760 },
      data: mineracao,
    },
    {
      id: "item-minerio",
      type: "item",
      position: { x: 520, y: 760 },
      data: {
        kind: "item",
        itemId: minerioFe.id,
        name: minerioFe.name,
        identifier: minerioFe.identifier,
        category: minerioFe.category,
        icon: minerioFe.icon,
        color: minerioFe.color,
        referenceValue: minerioFe.referenceValue,
        observation: "",
      },
    },
    {
      id: "act-fundicao",
      type: "activity",
      position: { x: 820, y: 760 },
      data: fundicao,
    },
    {
      id: "item-lingote",
      type: "item",
      position: { x: 1120, y: 760 },
      data: {
        kind: "item",
        itemId: lingoteFe.id,
        name: lingoteFe.name,
        identifier: lingoteFe.identifier,
        category: lingoteFe.category,
        icon: lingoteFe.icon,
        color: lingoteFe.color,
        referenceValue: lingoteFe.referenceValue,
        observation: "",
      },
    },
    {
      id: "note-titulo",
      type: "note",
      position: { x: 120, y: 40 },
      data: {
        kind: "note",
        title: "ECONOMIA GERAL",
        text: "Mapa tÃ©cnico de atividades, itens e fluxos de valor do UnderRP.",
      },
    },
  ];

  return nodes;
}

export function buildInitialEdges(): BoardEdge[] {
  return [
    {
      id: "e-mergulho-sucata",
      source: "act-mergulho",
      target: "item-sucata",
      type: "under",
      data: {
        edgeType: "ENTREGA",
        qtyMin: 2,
        qtyMax: 5,
        chance: 70,
        consumes: false,
        observation: "",
      },
    },
    {
      id: "e-mergulho-joia",
      source: "act-mergulho",
      target: "item-joia",
      type: "under",
      data: {
        edgeType: "ENTREGA",
        qtyMin: 1,
        qtyMax: 1,
        chance: 25,
        consumes: false,
        observation: "",
      },
    },
    {
      id: "e-mergulho-peca",
      source: "act-mergulho",
      target: "item-peca",
      type: "under",
      data: {
        edgeType: "ENTREGA",
        qtyMin: 1,
        qtyMax: 3,
        chance: 50,
        consumes: false,
        observation: "",
      },
    },
    {
      id: "e-mergulho-doc",
      source: "act-mergulho",
      target: "item-doc",
      type: "under",
      data: {
        edgeType: "ENTREGA",
        qtyMin: 1,
        qtyMax: 1,
        chance: 10,
        consumes: false,
        observation: "",
      },
    },
    {
      id: "e-mergulho-money",
      source: "act-mergulho",
      target: "money-mergulho",
      type: "under",
      data: {
        edgeType: "PAGA",
        qtyMin: 1,
        qtyMax: 1,
        chance: 100,
        consumes: false,
        observation: "",
      },
    },
    {
      id: "e-mineracao-minerio",
      source: "act-mineracao",
      target: "item-minerio",
      type: "under",
      data: {
        edgeType: "ENTREGA",
        qtyMin: 3,
        qtyMax: 6,
        chance: 90,
        consumes: false,
        observation: "",
      },
    },
    {
      id: "e-minerio-fundicao",
      source: "item-minerio",
      target: "act-fundicao",
      type: "under",
      data: {
        edgeType: "REQUER",
        qtyMin: 2,
        qtyMax: 4,
        chance: 100,
        consumes: true,
        observation: "",
      },
    },
    {
      id: "e-fundicao-lingote",
      source: "act-fundicao",
      target: "item-lingote",
      type: "under",
      data: {
        edgeType: "ENTREGA",
        qtyMin: 1,
        qtyMax: 2,
        chance: 100,
        consumes: false,
        observation: "",
      },
    },
  ];
}




