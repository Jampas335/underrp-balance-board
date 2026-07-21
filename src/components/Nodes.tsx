import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  Cpu,
  Gem,
  Wrench,
  FileText,
  Mountain,
  Boxes,
  Waves,
  Fuel,
  Shield,
  Cog,
  type LucideIcon,
} from "lucide-react";
import { useBoard, connectedNodeIds } from "../lib/store";
import type { BoardNode } from "../lib/types";
import { cn } from "../utils/cn";

const ICONS: Record<string, LucideIcon> = {
  Cpu,
  Gem,
  Wrench,
  FileText,
  Mountain,
  Boxes,
  Waves,
  Fuel,
  Shield,
  Cog,
};

function formatMoney(v: number): string {
  return "$" + v.toLocaleString("pt-BR");
}

function formatRange(min: number, max: number): string {
  if (min === max) return formatMoney(min);
  return `${formatMoney(min)}–${formatMoney(max)}`;
}

function useDimmed(nodeId: string): boolean {
  const selectedNodeId = useBoard((s) => s.selectedNodeId);
  const selectedEdgeId = useBoard((s) => s.selectedEdgeId);
  const edges = useBoard((s) => s.edges);

  if (selectedNodeId) {
    if (selectedNodeId === nodeId) return false;
    const connected = connectedNodeIds(edges, selectedNodeId);
    return !connected.has(nodeId);
  }

  if (selectedEdgeId) {
    const edge = edges.find((e) => e.id === selectedEdgeId);
    if (edge) {
      return edge.source !== nodeId && edge.target !== nodeId;
    }
  }

  return false;
}

interface NodeShellProps {
  nodeId: string;
  width: number;
  children: React.ReactNode;
  className?: string;
}

function NodeShell({ nodeId, width, children, className }: NodeShellProps) {
  const dimmed = useDimmed(nodeId);
  return (
    <div
      className={cn(
        "urp-node-in transition-opacity duration-200",
        dimmed && "opacity-35",
        className
      )}
      style={{ width }}
    >
      <div className="clip-frame clip-block">
        <div className="clip-surface">{children}</div>
      </div>
    </div>
  );
}

// ---------- Activity ----------
function ActivityNodeInner({ id, data }: NodeProps<BoardNode>) {
  const d = data as Extract<BoardNode["data"], { kind: "activity" }>;
  const edges = useBoard((s) => s.edges);

  const requisitos = edges.filter(
    (e) => e.target === id && e.data?.edgeType === "REQUER"
  ).length;
  const recompensas = edges.filter(
    (e) => e.source === id && e.data?.edgeType === "ENTREGA"
  ).length;
  const hasPayment = d.paymentMin > 0 || d.paymentMax > 0;

  return (
    <NodeShell nodeId={id} width={240}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="font-display text-xl font-600 uppercase leading-tight tracking-wide text-white">
            {d.name || "Sem nome"}
          </div>
        </div>
        <div className="mt-0.5 font-mono text-[10px] tracking-wider text-white/56">
          // {d.category.toUpperCase()} · {d.status.toUpperCase()}
        </div>
        <div className="urp-divider my-2.5" />
        <div className="space-y-1">
          <Stat label="REQUISITOS" value={String(requisitos)} />
          <Stat label="RECOMPENSAS" value={String(recompensas)} />
          <Stat
            label="PAGAMENTO"
            value={hasPayment ? formatRange(d.paymentMin, d.paymentMax) : "—"}
            accent={hasPayment ? (d.moneyType === "sujo" ? "amber" : "green") : undefined}
          />
        </div>
        <div className="mt-2.5 flex items-center gap-2 font-mono text-[10px] text-white/40">
          <span>{d.durationMin}min</span>
          <span className="text-white/20">·</span>
          <span>
            {d.playersMin}–{d.playersMax}p
          </span>
          {d.cooldownMin > 0 && (
            <>
              <span className="text-white/20">·</span>
              <span>cd {d.cooldownMin}min</span>
            </>
          )}
        </div>
      </div>
    </NodeShell>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "amber" | "green";
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="font-mono text-[10px] tracking-wider text-white/40">
        {label}
      </span>
      <span
        className={cn(
          "font-mono text-[11px] font-500 tabular-nums",
          accent === "amber" && "text-urp-amber",
          accent === "green" && "text-urp-green",
          !accent && "text-white/78"
        )}
      >
        {value}
      </span>
    </div>
  );
}

export const ActivityNode = memo(ActivityNodeInner);

// ---------- Item ----------
function ItemNodeInner({ id, data }: NodeProps<BoardNode>) {
  const d = data as Extract<BoardNode["data"], { kind: "item" }>;
  const Icon = ICONS[d.icon] || Cpu;
  const hasValue = d.referenceValue > 0;

  return (
    <NodeShell nodeId={id} width={210}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="flex items-center gap-3 px-3 py-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center"
          style={{
            background: `${d.color}1a`,
            border: `1px solid ${d.color}40`,
          }}
        >
          <Icon size={16} style={{ color: d.color }} strokeWidth={1.5} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-base font-600 uppercase leading-tight tracking-wide text-white">
            {d.name}
          </div>
          <div className="truncate font-mono text-[10px] text-white/40">
            {d.identifier}
          </div>
          <div className="mt-0.5 flex items-center justify-between gap-2">
            <span className="font-mono text-[9px] uppercase tracking-wider text-white/32">
              {d.category}
            </span>
            {hasValue && (
              <span className="font-mono text-[10px] font-500 text-urp-green">
                {formatMoney(d.referenceValue)}
              </span>
            )}
          </div>
        </div>
      </div>
    </NodeShell>
  );
}

export const ItemNode = memo(ItemNodeInner);

// ---------- Money ----------
function MoneyNodeInner({ id, data }: NodeProps<BoardNode>) {
  const d = data as Extract<BoardNode["data"], { kind: "money" }>;
  const isDirty = d.moneyType === "sujo";
  const color = isDirty ? "#f59e0b" : "#22c55e";

  return (
    <NodeShell nodeId={id} width={200}>
      <Handle type="target" position={Position.Left} />
      <div className="px-4 py-3">
        <div className="font-display text-xl font-600 uppercase leading-tight tracking-wide text-white">
          {d.label || "Pagamento"}
        </div>
        <div
          className="mt-0.5 font-mono text-[10px] tracking-wider"
          style={{ color: `${color}cc` }}
        >
          // DINHEIRO {d.moneyType.toUpperCase()}
        </div>
        <div className="urp-divider my-2.5" />
        <div
          className="font-mono text-lg font-600 tabular-nums"
          style={{ color }}
        >
          {formatRange(d.amountMin, d.amountMax)}
        </div>
        <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-white/40">
          {d.perPlayer ? "POR JOGADOR" : "FIXO"}
        </div>
      </div>
    </NodeShell>
  );
}

export const MoneyNode = memo(MoneyNodeInner);

// ---------- Note ----------
function NoteNodeInner({ id, data }: NodeProps<BoardNode>) {
  const d = data as Extract<BoardNode["data"], { kind: "note" }>;
  return (
    <NodeShell nodeId={id} width={260}>
      <div className="px-4 py-3">
        <div className="font-display text-lg font-600 uppercase leading-tight tracking-wide text-white/78">
          {d.title}
        </div>
        {d.text && (
          <div className="mt-1 font-sans text-xs leading-relaxed text-white/56">
            {d.text}
          </div>
        )}
      </div>
    </NodeShell>
  );
}

export const NoteNode = memo(NoteNodeInner);

export const nodeTypes = {
  activity: ActivityNode,
  item: ItemNode,
  money: MoneyNode,
  note: NoteNode,
};
