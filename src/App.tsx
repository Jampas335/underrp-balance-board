import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  useReactFlow,
  applyNodeChanges,
  type Connection,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";
import { useBoard, resolveEdgeType, createItemNode } from "./lib/store";
import { EDGE_COLORS } from "./lib/types";
import type { BoardEdge } from "./lib/types";
import { getSessionToken, loadRemoteBoard } from "./lib/github";
import { CATALOG, loadRemoteCatalog } from "./lib/data";
import { nodeTypes } from "./components/Nodes";
import { edgeTypes } from "./components/Edge";
import { TopBar } from "./components/TopBar";
import { Sidebar } from "./components/Sidebar";
import { Inspector } from "./components/Inspector";
import { Toast, ZoomControls, NewActivityModal, EditTokenModal } from "./components/Overlays";

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    (el as HTMLElement).isContentEditable
  );
}

function hydrateCatalogNodes() {
  const current = useBoard.getState();
  const byId = new Map(CATALOG.map((item) => [item.id, item]));
  useBoard.setState({
    nodes: current.nodes.map((node) => {
      if (node.data.kind !== "item") return node;
      const item = byId.get(node.data.itemId) || byId.get(node.data.identifier) || CATALOG.find((candidate) =>
        candidate.name === node.data.name || candidate.identifier === node.data.itemId || candidate.id === node.data.identifier
      );
      return item
        ? { ...node, data: { ...node.data, imageUrl: item.imageUrl || `https://jampas335.github.io/underp-itens/ready-items/icons/${item.id}.png`, icon: item.icon, color: "#36c0ff" } }
        : node;
    }),
  });
}

function AppInner() {
  const rf = useReactFlow();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const storeNodes = useBoard((s) => s.nodes);
  const storeEdges = useBoard((s) => s.edges);
  const selectedNodeId = useBoard((s) => s.selectedNodeId);
  const selectedEdgeId = useBoard((s) => s.selectedEdgeId);
  const loaded = useBoard((s) => s.loaded);
  const editingEnabled = useBoard((s) => s.editingEnabled);

  const load = useBoard((s) => s.load);
  const setNodes = useBoard((s) => s.setNodes);
  const addNode = useBoard((s) => s.addNode);
  const addEdge = useBoard((s) => s.addEdge);
  const deleteNode = useBoard((s) => s.deleteNode);
  const deleteEdge = useBoard((s) => s.deleteEdge);
  const commit = useBoard((s) => s.commit);
  const undo = useBoard((s) => s.undo);
  const redo = useBoard((s) => s.redo);
  const clearSelection = useBoard((s) => s.clearSelection);
  const setMenuOpen = useBoard((s) => s.setMenuOpen);
  const showToast = useBoard((s) => s.showToast);
  const requestEdit = useBoard((s) => s.requestEdit);
  const replaceBoard = useBoard((s) => s.replaceBoard);
  const setRemoteStatus = useBoard((s) => s.setRemoteStatus);
  const setRemoteSha = useBoard((s) => s.setRemoteSha);
  const setEditingEnabled = useBoard((s) => s.setEditingEnabled);

  useEffect(() => {
    load();
    if (getSessionToken()) setEditingEnabled(true);
    let active = true;

    void loadRemoteCatalog().then(() => {
      hydrateCatalogNodes();
    }).catch(() => {
      // O catálogo local continua disponível como fallback offline.
    });
    const catalogRefresh = window.setInterval(() => {
      void loadRemoteCatalog().then(() => {
        const current = useBoard.getState();
        const byId = new Map(CATALOG.map((item) => [item.id, item]));
        useBoard.setState({ nodes: current.nodes.map((node) => {
          if (node.data.kind !== "item") return node;
          const item = byId.get(node.data.itemId) || byId.get(node.data.identifier) || CATALOG.find((candidate) => candidate.name === node.data.name || candidate.identifier === node.data.itemId || candidate.id === node.data.identifier);
          return item ? { ...node, data: { ...node.data, imageUrl: item.imageUrl || `https://jampas335.github.io/underp-itens/ready-items/icons/${item.id}.png`, icon: item.icon, color: "#36c0ff" } } : node;
        }) });
      }).catch(() => undefined);
    }, 5 * 60 * 1000);

    void loadRemoteBoard()
      .then((remote) => {
        if (!active) return;
        if (!remote) {
          setRemoteStatus("Quadro remoto ainda não existe");
          return;
        }
        replaceBoard({ nodes: remote.nodes, edges: remote.edges });
        hydrateCatalogNodes();
        setRemoteSha(remote.sha);
        setRemoteStatus("Quadro remoto carregado");
        window.setTimeout(() => {
          if (active) rf.fitView({ padding: 0.25, duration: 300 });
        }, 40);
      })
      .catch(() => {
        if (active) setRemoteStatus("Usando cópia local");
      });

    return () => {
      active = false;
      window.clearInterval(catalogRefresh);
    };
  }, [load, replaceBoard, setRemoteSha, setRemoteStatus, setEditingEnabled, rf]);

  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      rf.fitView({ padding: 0.25, duration: 400 });
    }, 120);
    return () => clearTimeout(t);
  }, [loaded, rf]);

  const nodes = useMemo(
    () => storeNodes.map((n) => ({ ...n, selected: n.id === selectedNodeId || n.selected })),
    [storeNodes, selectedNodeId]
  );

  const edges = useMemo(
    () =>
      storeEdges.map((e) => ({
        ...e,
        selected: e.id === selectedEdgeId,
      })),
    [storeEdges, selectedEdgeId]
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      for (const change of changes) {
        if (change.type === "remove") {
          deleteNode(change.id);
        } else if (change.type === "select") {
          const s = useBoard.getState();
          if (change.selected) {
            s.selectNode(change.id);
          } else if (s.selectedNodeId === change.id) {
            s.clearSelection();
          }
        }
      }
      const updates = changes.filter(
        (c) => c.type === "position" || c.type === "dimensions" || c.type === "select"
      );
      if (updates.length > 0 && (editingEnabled || updates.every((change) => change.type === "select"))) {
        const currentNodes = useBoard.getState().nodes;
        const updated = applyNodeChanges(updates, currentNodes).map((node) => {
          const others = currentNodes.filter((other) => other.id !== node.id);
          let x = node.position.x;
          let y = node.position.y;
          for (const other of others) {
            if (Math.abs(x - other.position.x) < 12) x = other.position.x;
            if (Math.abs(y - other.position.y) < 12) y = other.position.y;
          }
          return { ...node, position: { x, y } };
        });
        setNodes(updated);
      }
    },
    [deleteNode, setNodes, editingEnabled]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      for (const change of changes) {
        if (change.type === "remove") {
          deleteEdge(change.id);
        } else if (change.type === "select") {
          const s = useBoard.getState();
          if (change.selected) {
            s.selectEdge(change.id);
          } else if (s.selectedEdgeId === change.id) {
            s.clearSelection();
          }
        }
      }
    },
    [deleteEdge]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const store = useBoard.getState();
      if (!store.requestEdit()) return;
      const sourceNode = store.nodes.find((n) => n.id === connection.source);
      const targetNode = store.nodes.find((n) => n.id === connection.target);
      if (!sourceNode || !targetNode) return;

      const edgeType = resolveEdgeType(
        sourceNode.data.kind,
        targetNode.data.kind
      );
      if (!edgeType) {
        showToast("Conexão inválida entre esses blocos", "error");
        return;
      }

      const edge: BoardEdge = {
        id: `e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        source: connection.source!,
        target: connection.target!,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        type: "under",
        data: {
          edgeType,
          qtyMin: 1,
          qtyMax: 1,
          chance: 100,
          consumes: false,
          observation: "",
        },
      };
      addEdge(edge);
      showToast(`Conexão ${edgeType} criada`, "success");
    },
    [addEdge, showToast]
  );

  const onNodeDragStart = useCallback(() => {
    commit();
  }, [commit]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!requestEdit()) return;
      const itemId = e.dataTransfer.getData("application/underrp-item");
      if (!itemId) return;
      const pos = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const node = createItemNode(itemId, { x: pos.x - 100, y: pos.y - 40 });
      if (node) {
        addNode(node);
        showToast("Item adicionado", "success");
      }
    },
    [rf, addNode, showToast, requestEdit]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const onPaneClick = useCallback(() => {
    clearSelection();
    setMenuOpen(false);
  }, [clearSelection, setMenuOpen]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: { id: string }) => {
      useBoard.getState().selectNode(node.id);
    },
    []
  );

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: { id: string }) => {
      useBoard.getState().selectEdge(edge.id);
    },
    []
  );

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (isInputFocused()) return;

      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (
        ctrl &&
        (e.key.toLowerCase() === "y" ||
          (e.key.toLowerCase() === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        redo();
      } else if (ctrl && e.key.toLowerCase() === "f") {
        e.preventDefault();
        const input = document.querySelector(
          'input[aria-label="Buscar itens"]'
        ) as HTMLInputElement | null;
        input?.focus();
        input?.select();
      } else if (!ctrl && e.key === "f") {
        const sel = useBoard.getState().selectedNodeId;
        if (sel) {
          const node = useBoard.getState().nodes.find((n) => n.id === sel);
          if (node) {
            rf.setCenter(node.position.x + 120, node.position.y + 60, {
              zoom: 1,
              duration: 300,
            });
          }
        }
      } else if (e.key === "Escape") {
        const store = useBoard.getState();
        if (store.newActivityOpen) {
          store.setNewActivityOpen(false);
        } else if (store.menuOpen) {
          store.setMenuOpen(false);
        } else if (store.selectedNodeId || store.selectedEdgeId) {
          store.clearSelection();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [undo, redo, rf]);

  if (!loaded) return null;

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TopBar onOpenSearch={() => {}} />
      <div className="relative flex flex-1 overflow-hidden">
        <Sidebar />
        <div
          ref={wrapperRef}
          className="relative flex-1"
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDragStart={onNodeDragStart}
            onPaneClick={onPaneClick}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            selectionOnDrag
            selectionMode="partial"
            panOnDrag={[1, 2]}
            selectionKeyCode="Control"
            multiSelectionKeyCode="Control"
            nodesDraggable={editingEnabled}
            nodesConnectable={editingEnabled}
            deleteKeyCode="Delete"
            minZoom={0.2}
            maxZoom={2}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            proOptions={{ hideAttribution: true }}
            className="bg-transparent"
            defaultEdgeOptions={{ type: "under" }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={28}
              size={1}
              color="rgba(255,255,255,0.07)"
            />
          </ReactFlow>
          <ZoomControls />
          <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 border border-white/10 bg-urp-surface/90 px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider text-white/45 shadow-[0_8px_24px_rgba(0,0,0,.2)]">
            Botão do meio: mover canvas&nbsp;&nbsp;·&nbsp;&nbsp;Scroll: zoom&nbsp;&nbsp;·&nbsp;&nbsp;Arraste vazio: selecionar&nbsp;&nbsp;·&nbsp;&nbsp;Ctrl + clique: adicionar
          </div>
          <Inspector />
          <Toast />
        </div>
      </div>
      <NewActivityModal />
      <EditTokenModal />
      {/* SVG arrow markers for edges */}
      <svg
        style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
        aria-hidden="true"
      >
        <defs>
          {Object.entries(EDGE_COLORS).map(([type, color]) => (
            <marker
              key={type}
              id={`arrow-${type}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
            </marker>
          ))}
        </defs>
      </svg>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <AppInner />
    </ReactFlowProvider>
  );
}
