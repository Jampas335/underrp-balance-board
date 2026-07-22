import { useEffect, useMemo, useState } from "react";
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
import { useBoard } from "../lib/store";
import { CATALOG, CATALOG_CATEGORIES, subscribeCatalog } from "../lib/data";
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

export function Sidebar() {
  const [, refreshCatalog] = useState(0);
  useEffect(() => subscribeCatalog(() => refreshCatalog((value) => value + 1)), []);
  const collapsed = useBoard((s) => s.sidebarCollapsed);
  const searchQuery = useBoard((s) => s.searchQuery);
  const setSearchQuery = useBoard((s) => s.setSearchQuery);
  const editingEnabled = useBoard((s) => s.editingEnabled);
  const requestEdit = useBoard((s) => s.requestEdit);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return CATALOG.filter((item) => {
      if (activeCategory && item.category !== activeCategory) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.identifier.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, activeCategory]);

  if (collapsed) return null;

  return (
    <aside className="relative z-20 flex h-full w-[260px] shrink-0 flex-col border-r border-urp-border bg-urp-surface shadow-[8px_0_28px_rgba(0,0,0,.14)]">
      <div className="flex items-center justify-between px-4 pb-2 pt-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
          Itens
        </span>
        <span className="font-mono text-[10px] tabular-nums text-white/32">
          {filtered.length}/{CATALOG.length}
        </span>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="clip-frame clip-btn">
          <div className="clip-surface flex items-center px-2.5">
            <input
              aria-label="Buscar item no catálogo"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar…"
              className="urp-input bg-transparent"
            />
          </div>
        </div>
      </div>

      {/* Category filters */}
      <div className="urp-scroll flex max-h-[112px] flex-wrap content-start gap-1.5 overflow-y-auto px-3 pb-2">
        <CatChip
          active={activeCategory === null}
          onClick={() => setActiveCategory(null)}
          label="Todos"
        />
        {CATALOG_CATEGORIES.map((cat) => (
          <CatChip
            key={cat}
            active={activeCategory === cat}
            onClick={() =>
              setActiveCategory((prev) => (prev === cat ? null : cat))
            }
            label={cat}
          />
        ))}
      </div>

      <div className="urp-divider mx-3" />

      {/* List */}
      <div className="urp-scroll flex-1 overflow-y-auto py-1">
        {filtered.length === 0 && (
          <div className="px-4 py-6 text-center font-mono text-[11px] text-white/32">
            Nenhum item encontrado
          </div>
        )}
        {filtered.map((item) => {
          const Icon = ICONS[item.icon] || Cpu;
          return (
            <div
              key={item.id}
              draggable={editingEnabled}
              onDragStart={(e) => {
                if (!editingEnabled) {
                  e.preventDefault();
                  requestEdit();
                  return;
                }
                e.dataTransfer.setData("application/underrp-item", item.id);
                e.dataTransfer.effectAllowed = "copy";
              }}
              className={cn(
                "group flex items-center gap-2.5 px-3 py-1.5 transition-colors hover:bg-white/5",
                editingEnabled ? "cursor-grab active:cursor-grabbing" : "cursor-default"
              )}
            >
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden"
                style={{
                  background: `${item.color}14`,
                  border: `1px solid ${item.color}30`,
                }}
              >
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt="" width={28} height={28} loading="lazy" className="h-full w-full object-contain" />
                ) : (
                  <Icon size={13} style={{ color: item.color }} strokeWidth={1.5} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-sm font-500 uppercase leading-tight tracking-wide text-white/88 group-hover:text-white">
                  {item.name}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-mono text-[9px] text-white/36">
                    {item.identifier}
                  </span>
                  <span className="text-white/16">·</span>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-white/32">
                    {item.category}
                  </span>
                </div>
              </div>
              <span className="font-mono text-[10px] tabular-nums text-urp-green/70">
                ${item.referenceValue.toLocaleString("pt-BR")}
              </span>
            </div>
          );
        })}
      </div>

      <div className="border-t border-urp-border px-4 py-2">
        <p className="font-mono text-[9px] uppercase tracking-wider text-white/28">
          Arraste para o canvas
        </p>
      </div>
    </aside>
  );
}

function CatChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "border px-1.5 py-1 font-mono text-[9px] uppercase leading-none tracking-wider transition-colors",
        active
          ? "border-urp-cyan/45 bg-urp-cyan/10 text-urp-cyan"
          : "border-white/8 bg-white/[0.02] text-white/45 hover:border-white/20 hover:bg-white/[0.05] hover:text-white/80"
      )}
    >
      {label}
    </button>
  );
}

