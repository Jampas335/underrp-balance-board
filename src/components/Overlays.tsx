import { useEffect, useState } from "react";
import { useReactFlow } from "@xyflow/react";
import {
  Plus,
  Minus,
  Maximize,
  Crosshair,
  X,
  Check,
  Info,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  LoaderCircle,
} from "lucide-react";
import { useBoard, createActivityNode } from "../lib/store";
import { getGitHubTarget, setSessionToken, validateToken } from "../lib/github";
import { ACTIVITY_CATEGORIES, ACTIVITY_STATUSES } from "../lib/types";
import type { ActivityCategory, ActivityStatus } from "../lib/types";

// ---------- Toast ----------
export function Toast() {
  const toast = useBoard((s) => s.toast);
  const dismissToast = useBoard((s) => s.dismissToast);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(dismissToast, 2200);
    return () => clearTimeout(t);
  }, [toast, dismissToast]);

  if (!toast) return null;

  const icon =
    toast.tone === "error" ? (
      <AlertCircle size={14} className="text-urp-red" />
    ) : toast.tone === "success" ? (
      <CheckCircle2 size={14} className="text-urp-green" />
    ) : (
      <Info size={14} className="text-urp-cyan" />
    );

  return (
    <div className="pointer-events-none absolute bottom-6 left-1/2 z-50 -translate-x-1/2">
      <div className="urp-toast clip-frame clip-btn">
        <div className="clip-surface flex items-center gap-2 bg-urp-elevated px-4 py-2.5">
          {icon}
          <span className="font-mono text-[11px] uppercase tracking-wider text-white/88">
            {toast.message}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------- Zoom Controls ----------
export function ZoomControls() {
  const rf = useReactFlow();
  return (
    <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1">
      <ZoomBtn label="Aproximar" onClick={() => rf.zoomIn({ duration: 200 })}>
        <Plus size={14} strokeWidth={1.5} />
      </ZoomBtn>
      <ZoomBtn label="Afastar" onClick={() => rf.zoomOut({ duration: 200 })}>
        <Minus size={14} strokeWidth={1.5} />
      </ZoomBtn>
      <ZoomBtn
        label="Centralizar"
        onClick={() => {
          const sel = useBoard.getState().selectedNodeId;
          if (sel) {
            const node = useBoard.getState().nodes.find((n) => n.id === sel);
            if (node) {
              rf.setCenter(node.position.x + 120, node.position.y + 60, {
                zoom: 1,
                duration: 300,
              });
              return;
            }
          }
          rf.fitView({ duration: 300, padding: 0.2 });
        }}
      >
        <Crosshair size={14} strokeWidth={1.5} />
      </ZoomBtn>
      <ZoomBtn
        label="Enquadrar"
        onClick={() => rf.fitView({ duration: 300, padding: 0.2 })}
      >
        <Maximize size={14} strokeWidth={1.5} />
      </ZoomBtn>
    </div>
  );
}

function ZoomBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="has-tooltip clip-frame clip-btn flex h-8 w-8 items-center justify-center"
    >
      <div className="clip-surface flex h-full w-full items-center justify-center bg-urp-elevated text-white/56 transition-colors hover:text-white">
        {children}
      </div>
      <span className="urp-tooltip">{label}</span>
    </button>
  );
}

// ---------- New Activity Modal ----------
export function NewActivityModal() {
  const open = useBoard((s) => s.newActivityOpen);
  const setOpen = useBoard((s) => s.setNewActivityOpen);
  const addNode = useBoard((s) => s.addNode);
  const showToast = useBoard((s) => s.showToast);
  const rf = useReactFlow();

  const [name, setName] = useState("");
  const [category, setCategory] = useState<ActivityCategory>("Criminal");
  const [status, setStatus] = useState<ActivityStatus>("Rascunho");

  useEffect(() => {
    if (open) {
      setName("");
      setCategory("Criminal");
      setStatus("Rascunho");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  if (!open) return null;

  function confirm() {
    const trimmed = name.trim();
    if (!trimmed) {
      showToast("Informe um nome", "error");
      return;
    }
    const el = document.querySelector(".react-flow") as HTMLElement | null;
    const rect = el?.getBoundingClientRect();
    let pos = { x: 200, y: 200 };
    if (rect) {
      pos = rf.screenToFlowPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
      pos = { x: pos.x - 120, y: pos.y - 50 };
    }
    const node = createActivityNode(trimmed, category, status, pos);
    addNode(node);
    setOpen(false);
    showToast("Atividade criada", "success");
  }

  return (
    <div className="urp-fade fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-[380px]">
        <div className="clip-frame clip-panel">
          <div className="clip-surface bg-urp-elevated">
            <div className="flex items-center justify-between border-b border-urp-border px-4 py-3">
              <span className="font-display text-base font-600 uppercase tracking-[0.14em] text-white">
                Nova atividade
              </span>
              <button
                type="button"
                aria-label="Fechar"
                onClick={() => setOpen(false)}
                className="text-white/40 transition-colors hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
            <div className="space-y-3 px-4 py-4">
              <div className="flex flex-col gap-1">
                <label className="urp-label">Nome</label>
                <div className="clip-frame clip-btn">
                  <div className="clip-surface">
                    <input
                      autoFocus
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") confirm();
                      }}
                      placeholder="Ex: Mergulho ilegal"
                      className="urp-input"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="urp-label">Categoria</label>
                  <div className="clip-frame clip-btn">
                    <div className="clip-surface">
                      <select
                        value={category}
                        onChange={(e) =>
                          setCategory(e.target.value as ActivityCategory)
                        }
                        className="urp-input cursor-pointer appearance-none bg-transparent"
                      >
                        {ACTIVITY_CATEGORIES.map((c) => (
                          <option
                            key={c}
                            value={c}
                            className="bg-urp-elevated"
                          >
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="urp-label">Status</label>
                  <div className="clip-frame clip-btn">
                    <div className="clip-surface">
                      <select
                        value={status}
                        onChange={(e) =>
                          setStatus(e.target.value as ActivityStatus)
                        }
                        className="urp-input cursor-pointer appearance-none bg-transparent"
                      >
                        {ACTIVITY_STATUSES.map((s) => (
                          <option
                            key={s}
                            value={s}
                            className="bg-urp-elevated"
                          >
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-urp-border px-4 py-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="font-mono text-[11px] uppercase tracking-wider text-white/56 transition-colors hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirm}
                className="clip-frame clip-btn"
              >
                <div className="clip-surface flex items-center gap-1.5 bg-urp-purple px-4 py-2">
                  <Check size={13} className="text-white" />
                  <span className="font-display text-xs font-600 uppercase tracking-[0.14em] text-white">
                    Criar
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Edit token ----------
export function EditTokenModal() {
  const open = useBoard((s) => s.tokenModalOpen);
  const setOpen = useBoard((s) => s.setTokenModalOpen);
  const setEditingEnabled = useBoard((s) => s.setEditingEnabled);
  const setRemoteStatus = useBoard((s) => s.setRemoteStatus);
  const showToast = useBoard((s) => s.showToast);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) return;
    setToken("");
    setMessage("");
  }, [open]);

  if (!open) return null;

  async function unlock() {
    const value = token.trim();
    if (!value) {
      setMessage("Informe o token de escrita.");
      return;
    }

    setBusy(true);
    setMessage("Validando acesso…");
    try {
      const access = await validateToken(value);
      setSessionToken(value);
      setEditingEnabled(true);
      setRemoteStatus(`Edição liberada para ${access.login}`);
      showToast("Edição liberada", "success");
      setOpen(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível validar o token.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="urp-fade fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) setOpen(false);
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-token-title"
        className="w-full max-w-[420px]"
      >
        <div className="clip-frame clip-panel">
          <div className="clip-surface bg-urp-elevated">
            <header className="flex items-center justify-between border-b border-urp-border px-4 py-3">
              <div className="flex items-center gap-2">
                <KeyRound size={15} className="text-urp-cyan" strokeWidth={1.6} />
                <h2 id="edit-token-title" className="font-display text-base font-600 uppercase tracking-[0.14em] text-white">
                  Liberar edição
                </h2>
              </div>
              <button
                type="button"
                aria-label="Fechar"
                onClick={() => setOpen(false)}
                disabled={busy}
                className="flex h-8 w-8 items-center justify-center text-white/40 transition-colors hover:text-white disabled:opacity-40"
              >
                <X size={14} />
              </button>
            </header>

            <form
              className="space-y-3 px-4 py-4"
              onSubmit={(event) => {
                event.preventDefault();
                void unlock();
              }}
            >
              <p className="font-sans text-xs leading-relaxed text-white/56">
                O quadro abre em modo leitura. Para editar e salvar no repositório, use um Fine-grained PAT com permissão <strong className="font-500 text-white/78">Contents: Read and write</strong>.
              </p>
              <p className="font-mono text-[10px] leading-relaxed text-white/36">
                // {getGitHubTarget()}
              </p>
              <div className="flex flex-col gap-1">
                <label htmlFor="github-token" className="urp-label">Token de escrita</label>
                <div className="clip-frame clip-btn">
                  <div className="clip-surface">
                    <input
                      id="github-token"
                      name="github-token"
                      type="password"
                      autoComplete="off"
                      spellCheck={false}
                      value={token}
                      onChange={(event) => setToken(event.target.value)}
                      placeholder="github_pat_…"
                      className="urp-input"
                      autoFocus
                      disabled={busy}
                    />
                  </div>
                </div>
              </div>
              <p aria-live="polite" className="min-h-4 font-mono text-[10px] leading-relaxed text-white/40">
                {message || "O token fica salvo neste navegador até você bloquear a edição."}
              </p>
              <div className="flex items-center justify-end gap-3 border-t border-urp-border pt-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={busy}
                  className="font-mono text-[11px] uppercase tracking-wider text-white/56 transition-colors hover:text-white disabled:opacity-40"
                >
                  Cancelar
                </button>
                <button type="submit" disabled={busy} className="clip-frame clip-btn disabled:opacity-50">
                  <span className="clip-surface flex items-center gap-1.5 bg-urp-purple px-4 py-2">
                    {busy ? <LoaderCircle size={13} className="animate-spin text-white" /> : <KeyRound size={13} className="text-white" />}
                    <span className="font-display text-xs font-600 uppercase tracking-[0.14em] text-white">
                      {busy ? "Validando" : "Liberar"}
                    </span>
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
