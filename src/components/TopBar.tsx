import { useEffect, useRef } from "react";
import {
  Search,
  Undo2,
  Redo2,
  Plus,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  KeyRound,
  CloudUpload,
  LogOut,
} from "lucide-react";
import { useBoard } from "../lib/store";
import {
  clearSessionToken,
  getGitHubTarget,
  getSessionToken,
  loadRemoteBoard,
  saveRemoteBoard,
} from "../lib/github";
import { cn } from "../utils/cn";

function IconBtn({
  label,
  onClick,
  disabled,
  children,
  className,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "has-tooltip relative flex h-9 w-9 items-center justify-center text-white/56 transition-colors",
        "hover:text-white disabled:opacity-30 disabled:hover:text-white/56",
        className
      )}
    >
      {children}
      <span className="urp-tooltip">{label}</span>
    </button>
  );
}

export function TopBar({
  onOpenSearch,
}: {
  onOpenSearch: () => void;
}) {
  const saveStatus = useBoard((s) => s.saveStatus);
  const sidebarCollapsed = useBoard((s) => s.sidebarCollapsed);
  const toggleSidebar = useBoard((s) => s.toggleSidebar);
  const undo = useBoard((s) => s.undo);
  const redo = useBoard((s) => s.redo);
  const past = useBoard((s) => s.past);
  const future = useBoard((s) => s.future);
  const setNewActivityOpen = useBoard((s) => s.setNewActivityOpen);
  const menuOpen = useBoard((s) => s.menuOpen);
  const setMenuOpen = useBoard((s) => s.setMenuOpen);
  const restoreExample = useBoard((s) => s.restoreExample);
  const clearBoard = useBoard((s) => s.clearBoard);
  const searchQuery = useBoard((s) => s.searchQuery);
  const setSearchQuery = useBoard((s) => s.setSearchQuery);
  const editingEnabled = useBoard((s) => s.editingEnabled);
  const setEditingEnabled = useBoard((s) => s.setEditingEnabled);
  const setTokenModalOpen = useBoard((s) => s.setTokenModalOpen);
  const remoteSaving = useBoard((s) => s.remoteSaving);
  const setRemoteSaving = useBoard((s) => s.setRemoteSaving);
  const remoteSha = useBoard((s) => s.remoteSha);
  const setRemoteSha = useBoard((s) => s.setRemoteSha);
  const setRemoteStatus = useBoard((s) => s.setRemoteStatus);
  const nodes = useBoard((s) => s.nodes);
  const edges = useBoard((s) => s.edges);
  const showToast = useBoard((s) => s.showToast);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen, setMenuOpen]);

  async function saveRemote() {
    const token = getSessionToken();
    if (!editingEnabled || !token) {
      setTokenModalOpen(true);
      return;
    }

    setRemoteSaving(true);
    setRemoteStatus("Salvando no GitHub…");
    try {
      const latest = await loadRemoteBoard(token);
      if (remoteSha && latest?.sha && latest.sha !== remoteSha) {
        throw new Error("O quadro foi alterado no GitHub. Recarregue a página antes de salvar.");
      }
      const result = await saveRemoteBoard(
        { nodes, edges },
        token,
        latest?.sha || remoteSha
      );
      setRemoteSha(result.sha);
      setRemoteStatus("Quadro salvo no GitHub");
      showToast("Quadro publicado", "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível salvar o quadro.";
      setRemoteStatus("Falha ao salvar");
      showToast(message, "error");
    } finally {
      setRemoteSaving(false);
    }
  }

  function disconnect() {
    clearSessionToken();
    setEditingEnabled(false);
    setRemoteStatus("Modo leitura");
    showToast("Edição bloqueada nesta sessão", "info");
    setMenuOpen(false);
  }

  return (
    <header className="relative z-30 flex h-14 items-center gap-3 border-b border-urp-border bg-urp-surface px-4">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center bg-urp-purple">
          <span className="font-display text-sm font-700 uppercase leading-none text-white">
            U
          </span>
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-display text-sm font-600 uppercase tracking-[0.18em] text-white">
            Underrp
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">
            Balance Board
          </span>
        </div>
      </div>

      <div className="mx-1 h-6 w-px bg-urp-border" />

      <button
        type="button"
        aria-label="Recolher catálogo"
        title="Recolher catálogo"
        onClick={toggleSidebar}
        className="has-tooltip relative flex h-9 w-9 items-center justify-center text-white/56 transition-colors hover:text-white"
      >
        {sidebarCollapsed ? (
          <PanelLeftOpen size={16} strokeWidth={1.5} />
        ) : (
          <PanelLeftClose size={16} strokeWidth={1.5} />
        )}
        <span className="urp-tooltip">Catálogo</span>
      </button>

      {/* Board name */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-white/32">
          Quadro
        </span>
        <span className="font-display text-sm font-600 uppercase tracking-[0.16em] text-white/78">
          Economia Geral
        </span>
      </div>

      {/* Save status */}
      <div className="ml-1 flex items-center gap-1.5">
        <span
          className={cn(
            "h-1.5 w-1.5",
            saveStatus === "saving" ? "bg-urp-amber" : "bg-urp-green"
          )}
        />
        <span className="font-mono text-[10px] uppercase tracking-wider text-white/40">
          {saveStatus === "saving" ? "Salvando…" : "Salvo"}
        </span>
      </div>

      <div className="hidden items-center gap-1.5 xl:flex">
        <span className={cn("h-1.5 w-1.5", editingEnabled ? "bg-urp-cyan" : "bg-white/28")} />
        <span className="font-mono text-[10px] uppercase tracking-wider text-white/40">
          {editingEnabled ? "Edição ativa" : "Somente leitura"}
        </span>
      </div>

      {/* Search */}
      <div className="ml-auto flex items-center gap-2">
        <div className="clip-frame clip-btn">
          <div className="clip-surface flex items-center gap-2 px-2.5">
            <Search size={13} className="text-white/40" strokeWidth={1.5} />
            <input
              aria-label="Buscar itens"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={onOpenSearch}
              placeholder="Buscar item…"
              className="urp-input w-44 bg-transparent px-0"
            />
          </div>
        </div>

        <div className="mx-1 h-6 w-px bg-urp-border" />

        <IconBtn
          label="Desfazer (Ctrl+Z)"
          onClick={undo}
          disabled={past.length === 0}
        >
          <Undo2 size={16} strokeWidth={1.5} />
        </IconBtn>

        {editingEnabled ? (
          <button
            type="button"
            onClick={saveRemote}
            disabled={remoteSaving}
            title={`Salvar em ${getGitHubTarget()}`}
            className="clip-frame clip-btn"
          >
            <div className="clip-surface flex items-center gap-1.5 bg-urp-elevated px-3 py-2 text-white/78 transition-colors hover:text-white">
              <CloudUpload size={14} strokeWidth={1.6} />
              <span className="font-display text-xs font-600 uppercase tracking-[0.14em]">
                {remoteSaving ? "Salvando" : "Salvar"}
              </span>
            </div>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setTokenModalOpen(true)}
            className="clip-frame clip-btn"
          >
            <div className="clip-surface flex items-center gap-1.5 bg-urp-elevated px-3 py-2 text-white/78 transition-colors hover:text-white">
              <KeyRound size={14} strokeWidth={1.6} />
              <span className="font-display text-xs font-600 uppercase tracking-[0.14em]">
                Editar
              </span>
            </div>
          </button>
        )}
        <IconBtn
          label="Refazer (Ctrl+Shift+Z)"
          onClick={redo}
          disabled={future.length === 0}
        >
          <Redo2 size={16} strokeWidth={1.5} />
        </IconBtn>

        {/* Menu */}
        <div className="relative" ref={menuRef}>
          <IconBtn label="Menu" onClick={() => setMenuOpen(!menuOpen)}>
            <MoreHorizontal size={16} strokeWidth={1.5} />
          </IconBtn>
          {menuOpen && (
            <div className="urp-fade absolute right-0 top-full mt-1 z-50 w-52">
              <div className="clip-frame clip-panel">
                <div className="clip-surface bg-urp-elevated py-1">
                  <button
                    type="button"
                    onClick={restoreExample}
                    className="block w-full px-4 py-2 text-left font-mono text-[11px] uppercase tracking-wider text-white/78 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    Restaurar exemplo
                  </button>
                  <button
                    type="button"
                    onClick={clearBoard}
                    className="block w-full px-4 py-2 text-left font-mono text-[11px] uppercase tracking-wider text-urp-red/80 transition-colors hover:bg-urp-red/10 hover:text-urp-red"
                  >
                    Limpar quadro
                  </button>
                  {editingEnabled && (
                    <button
                      type="button"
                      onClick={disconnect}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left font-mono text-[11px] uppercase tracking-wider text-white/56 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      <LogOut size={13} strokeWidth={1.5} />
                      Bloquear edição
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* New activity */}
        <button
          type="button"
          onClick={() => setNewActivityOpen(true)}
          className="clip-frame clip-btn"
        >
          <div className="clip-surface flex items-center gap-2 bg-urp-purple px-3.5 py-2">
            <Plus size={14} strokeWidth={2} className="text-white" />
            <span className="font-display text-xs font-600 uppercase tracking-[0.14em] text-white">
              Nova atividade
            </span>
          </div>
        </button>
      </div>
    </header>
  );
}
