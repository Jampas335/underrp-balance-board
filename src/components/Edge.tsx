import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";
import { useBoard } from "../lib/store";
import { EDGE_COLORS } from "../lib/types";
import type { BoardEdge } from "../lib/types";
import { cn } from "../utils/cn";

function UnderEdgeInner(props: EdgeProps<BoardEdge>) {
  const {
    id,
    source,
    target,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    selected,
  } = props;

  const selectedNodeId = useBoard((s) => s.selectedNodeId);
  const selectedEdgeId = useBoard((s) => s.selectedEdgeId);

  const edgeType = data?.edgeType ?? "ENTREGA";
  const color = EDGE_COLORS[edgeType];

  const [path] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 4,
  });

  const isConnectedToSelected =
    selectedNodeId && (source === selectedNodeId || target === selectedNodeId);
  const dimmed =
    (selectedNodeId && !isConnectedToSelected) ||
    (selectedEdgeId && selectedEdgeId !== id);

  const labelParts: string[] = [];
  if (data) {
    if (data.qtyMin === data.qtyMax) {
      labelParts.push(`${data.qtyMin}x`);
    } else {
      labelParts.push(`${data.qtyMin}–${data.qtyMax}x`);
    }
    if (data.chance < 100) {
      labelParts.push(`${data.chance}%`);
    }
  }

  // Keep the relationship label attached to the outgoing horizontal segment.
  // This avoids stacking every label in the middle of a shared vertical lane.
  const horizontalFlow = sourcePosition === "right" || sourcePosition === "left";
  const direction = sourcePosition === "left" ? -1 : 1;
  const gap = Math.min(54, Math.max(26, Math.abs(targetX - sourceX) * 0.22));
  const labelX = horizontalFlow ? sourceX + direction * gap : (sourceX + targetX) / 2;
  const labelY = horizontalFlow ? sourceY : (sourceY + targetY) / 2;

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke: color,
          strokeWidth: selected || isConnectedToSelected ? 2 : 1.5,
          opacity: dimmed ? 0.18 : 1,
        }}
        markerEnd={`url(#arrow-${edgeType})`}
      />
      {data && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
            }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                useBoard.getState().selectEdge(id);
              }}
              className={cn(
                "clip-frame clip-btn transition-opacity duration-200",
                dimmed && "opacity-25"
              )}
              style={{ background: `${color}55` }}
            >
              <div
                className="clip-surface flex items-center gap-1.5 px-2 py-1"
                style={{ background: "rgba(11, 13, 20, 0.96)" }}
              >
                <span
                  className="font-mono text-[9px] font-600 uppercase tracking-wider"
                  style={{ color }}
                >
                  {edgeType}
                </span>
                <span className="font-mono text-[9px] tabular-nums text-white/56">
                  {labelParts.join(" · ")}
                </span>
              </div>
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const UnderEdge = memo(UnderEdgeInner);

export const edgeTypes = {
  under: UnderEdge,
};
