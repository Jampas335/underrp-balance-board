import { create } from "zustand";
import type { BoardNode, BoardEdge, EdgeType, BlockData, ActivityData } from "./types";
import { buildInitialNodes, buildInitialEdges, findCatalogItem } from "./data";

const STORAGE_KEY = "underrp-balance-board-v1";

interface ToastState {
  id: number;
  message: string;
  tone: "info" | "success" | "error";
}

interface Snapshot {
  nodes: BoardNode[];
  edges: BoardEdge[];
}

interface BoardStore {
  nodes: BoardNode[];
  edges: BoardEdge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  sidebarCollapsed: boolean;
  saveStatus: "saved" | "saving";
  editingEnabled: boolean;
  tokenModalOpen: boolean;
  remoteSaving: boolean;
  remoteStatus: string;
  remoteSha: string | null;
  toast: ToastState | null;
  newActivityOpen: boolean;
  menuOpen: boolean;
  searchQuery: string;
  past: Snapshot[];
  future: Snapshot[];
  loaded: boolean;

  load: () => void;
  setNodes: (nodes: BoardNode[]) => void;
  setEdges: (edges: BoardEdge[]) => void;
  commit: () => void;
  addNode: (node: BoardNode) => void;
  updateNode: (id: string, patch: Partial<BlockData>) => void;
  deleteNode: (id: string) => void;
  addEdge: (edge: BoardEdge) => void;
  updateEdge: (id: string, patch: Partial<NonNullable<BoardEdge["data"]>>) => void;
  deleteEdge: (id: string) => void;
  selectNode: (id: string | null) => void;
  selectEdge: (id: string | null) => void;
  clearSelection: () => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  setSaveStatus: (s: "saved" | "saving") => void;
  setEditingEnabled: (enabled: boolean) => void;
  setTokenModalOpen: (open: boolean) => void;
  requestEdit: () => boolean;
  setRemoteSaving: (saving: boolean) => void;
  setRemoteStatus: (status: string) => void;
  setRemoteSha: (sha: string | null) => void;
  replaceBoard: (snapshot: Snapshot) => void;
  showToast: (message: string, tone?: ToastState["tone"]) => void;
  dismissToast: () => void;
  setNewActivityOpen: (v: boolean) => void;
  setMenuOpen: (v: boolean) => void;
  setSearchQuery: (q: string) => void;
  undo: () => void;
  redo: () => void;
  restoreExample: () => void;
  clearBoard: () => void;
}

function snapshotOf(nodes: BoardNode[], edges: BoardEdge[]): Snapshot {
  return {
    nodes: nodes.map((n) => ({ ...n, data: { ...n.data } })),
    edges: edges.map((e) => ({ ...e, data: e.data ? { ...e.data } : undefined })),
  };
}

function readStorage(): Snapshot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
      return parsed as Snapshot;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function writeStorage(snapshot: Snapshot) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    /* ignore */
  }
}

export const useBoard = create<BoardStore>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  sidebarCollapsed: false,
  saveStatus: "saved",
  editingEnabled: false,
  tokenModalOpen: false,
  remoteSaving: false,
  remoteStatus: "Modo leitura",
  remoteSha: null,
  toast: null,
  newActivityOpen: false,
  menuOpen: false,
  searchQuery: "",
  past: [],
  future: [],
  loaded: false,

  load: () => {
    const stored = readStorage();
    if (stored) {
      set({ nodes: stored.nodes, edges: stored.edges, loaded: true });
    } else {
      set({
        nodes: buildInitialNodes(),
        edges: buildInitialEdges(),
        loaded: true,
      });
    }
  },

  setNodes: (nodes) => {
    if (!get().requestEdit()) return;
    set({ nodes });
  },
  setEdges: (edges) => {
    if (!get().requestEdit()) return;
    set({ edges });
  },

  commit: () => {
    if (!get().requestEdit()) return;
    const { nodes, edges, past } = get();
    const next = [...past, snapshotOf(nodes, edges)];
    if (next.length > 60) next.shift();
    set({ past: next, future: [] });
  },

  addNode: (node) => {
    if (!get().requestEdit()) return;
    get().commit();
    set({ nodes: [...get().nodes, node], selectedNodeId: node.id, selectedEdgeId: null });
  },

  updateNode: (id, patch) => {
    if (!get().requestEdit()) return;
    set({
      nodes: get().nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...patch } as BlockData } : n
      ),
    });
  },

  deleteNode: (id) => {
    if (!get().requestEdit()) return;
    get().commit();
    const nodes = get().nodes.filter((n) => n.id !== id);
    const edges = get().edges.filter((e) => e.source !== id && e.target !== id);
    set({
      nodes,
      edges,
      selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId,
    });
    get().showToast("Bloco excluído", "info");
  },

  addEdge: (edge) => {
    if (!get().requestEdit()) return;
    get().commit();
    set({ edges: [...get().edges, edge], selectedEdgeId: edge.id, selectedNodeId: null });
  },

  updateEdge: (id, patch) => {
    if (!get().requestEdit()) return;
    set({
      edges: get().edges.map((e) =>
        e.id === id && e.data ? { ...e, data: { ...e.data, ...patch } } : e
      ),
    });
  },

  deleteEdge: (id) => {
    if (!get().requestEdit()) return;
    get().commit();
    set({
      edges: get().edges.filter((e) => e.id !== id),
      selectedEdgeId: get().selectedEdgeId === id ? null : get().selectedEdgeId,
    });
    get().showToast("Conexão excluída", "info");
  },

  selectNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
  selectEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),
  clearSelection: () => set({ selectedNodeId: null, selectedEdgeId: null }),
  toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  setSaveStatus: (s) => set({ saveStatus: s }),
  setEditingEnabled: (enabled) => set({ editingEnabled: enabled }),
  setTokenModalOpen: (open) => set({ tokenModalOpen: open }),
  requestEdit: () => {
    if (get().editingEnabled) return true;
    set({ tokenModalOpen: true });
    get().showToast("Informe o token para editar", "info");
    return false;
  },
  setRemoteSaving: (saving) => set({ remoteSaving: saving }),
  setRemoteStatus: (status) => set({ remoteStatus: status }),
  setRemoteSha: (sha) => set({ remoteSha: sha }),
  replaceBoard: (snapshot) =>
    set({
      nodes: snapshot.nodes,
      edges: snapshot.edges,
      past: [],
      future: [],
      selectedNodeId: null,
      selectedEdgeId: null,
    }),

  showToast: (message, tone = "info") => {
    set({ toast: { id: Date.now(), message, tone } });
  },
  dismissToast: () => set({ toast: null }),

  setNewActivityOpen: (v) => {
    if (v && !get().requestEdit()) return;
    set({ newActivityOpen: v });
  },
  setMenuOpen: (v) => set({ menuOpen: v }),
  setSearchQuery: (q) => set({ searchQuery: q }),

  undo: () => {
    if (!get().requestEdit()) return;
    const { past, future, nodes, edges } = get();
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    set({
      nodes: previous.nodes,
      edges: previous.edges,
      past: past.slice(0, -1),
      future: [snapshotOf(nodes, edges), ...future].slice(0, 60),
      selectedNodeId: null,
      selectedEdgeId: null,
    });
  },

  redo: () => {
    if (!get().requestEdit()) return;
    const { past, future, nodes, edges } = get();
    if (future.length === 0) return;
    const next = future[0];
    set({
      nodes: next.nodes,
      edges: next.edges,
      past: [...past, snapshotOf(nodes, edges)].slice(0, 60),
      future: future.slice(1),
      selectedNodeId: null,
      selectedEdgeId: null,
    });
  },

  restoreExample: () => {
    if (!get().requestEdit()) return;
    get().commit();
    set({
      nodes: buildInitialNodes(),
      edges: buildInitialEdges(),
      selectedNodeId: null,
      selectedEdgeId: null,
      menuOpen: false,
    });
    get().showToast("Exemplo restaurado", "success");
  },

  clearBoard: () => {
    if (!get().requestEdit()) return;
    get().commit();
    set({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      selectedEdgeId: null,
      menuOpen: false,
    });
    get().showToast("Quadro limpo", "info");
  },
}));

// ---------- autosave subscription ----------
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSave() {
  const store = useBoard.getState();
  store.setSaveStatus("saving");
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const s = useBoard.getState();
    writeStorage({ nodes: s.nodes, edges: s.edges });
    s.setSaveStatus("saved");
  }, 700);
}

useBoard.subscribe((state, prevState) => {
  if (!state.loaded) return;
  if (state.nodes !== prevState.nodes || state.edges !== prevState.edges) {
    scheduleSave();
  }
});

// ---------- helpers ----------
export function createActivityNode(
  name: string,
  category: ActivityData["category"],
  status: ActivityData["status"],
  position: { x: number; y: number }
): BoardNode {
  return {
    id: `act-${Date.now()}`,
    type: "activity",
    position,
    data: {
      kind: "activity",
      name,
      category,
      status,
      description: "",
      durationMin: 10,
      playersMin: 1,
      playersMax: 1,
      cooldownMin: 0,
      paymentMin: 0,
      paymentMax: 0,
      moneyType: "limpo",
      observation: "",
    },
  };
}

export function createItemNode(
  itemId: string,
  position: { x: number; y: number }
): BoardNode | null {
  const item = findCatalogItem(itemId);
  if (!item) return null;
  return {
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: "item",
    position,
    data: {
      kind: "item",
      itemId: item.id,
      name: item.name,
      identifier: item.identifier,
      category: item.category,
      icon: item.icon,
      color: item.color,
      referenceValue: item.referenceValue,
      imageUrl: item.imageUrl,
      observation: "",
    },
  };
}

export function resolveEdgeType(
  sourceKind: string,
  targetKind: string
): EdgeType | null {
  if (sourceKind === "item" && targetKind === "activity") return "REQUER";
  if (sourceKind === "activity" && targetKind === "item") return "ENTREGA";
  if (sourceKind === "activity" && targetKind === "money") return "PAGA";
  if (sourceKind === "activity" && targetKind === "activity") return "ALIMENTA";
  if (sourceKind === "item" && targetKind === "item") return "CRAFTA";
  return null;
}

export function connectedNodeIds(
  edges: BoardEdge[],
  nodeId: string
): Set<string> {
  const ids = new Set<string>();
  for (const e of edges) {
    if (e.source === nodeId) ids.add(e.target);
    if (e.target === nodeId) ids.add(e.source);
  }
  return ids;
}

export interface AnalysisBreakdown {
  name: string;
  avgQty: number;
  expected: number;
  chance: number;
}

export interface AnalysisResult {
  totalExpected: number;
  moneyExpected: number;
  breakdown: AnalysisBreakdown[];
  hasMoney: boolean;
}

export function computeAnalysis(
  activity: ActivityData,
  edges: BoardEdge[],
  nodes: BoardNode[],
  activityId: string
): AnalysisResult {
  const itemEdges = edges.filter(
    (e) => e.source === activityId && e.data?.edgeType === "ENTREGA"
  );
  const moneyEdge = edges.find(
    (e) => e.source === activityId && e.data?.edgeType === "PAGA"
  );

  let totalExpected = 0;
  const breakdown: AnalysisBreakdown[] = [];

  for (const e of itemEdges) {
    const target = nodes.find((n) => n.id === e.target);
    if (!target || target.data.kind !== "item") continue;
    const ref = target.data.referenceValue;
    const d = e.data!;
    const avgQty = (d.qtyMin + d.qtyMax) / 2;
    const expected = ref * avgQty * (d.chance / 100);
    totalExpected += expected;
    breakdown.push({
      name: target.data.name,
      avgQty,
      expected,
      chance: d.chance,
    });
  }

  let moneyExpected = 0;
  if (moneyEdge) {
    moneyExpected = (activity.paymentMin + activity.paymentMax) / 2;
    totalExpected += moneyExpected;
  }

  return {
    totalExpected,
    moneyExpected,
    breakdown,
    hasMoney: !!moneyEdge,
  };
}

