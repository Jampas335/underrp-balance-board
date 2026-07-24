import { useState } from "react";
import {
  X,
  ChevronDown,
  ChevronRight,
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
  LockKeyhole,
  type LucideIcon,
} from "lucide-react";
import { useBoard, computeAnalysis } from "../lib/store";
import { ACTIVITY_CATEGORIES, ACTIVITY_STATUSES } from "../lib/types";

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
import type {
  ActivityData,
  ItemData,
  MoneyData,
  NoteData,
  EdgeData,
  EdgeType,
} from "../lib/types";
import { cn } from "../utils/cn";

function fmtMoney(v: number): string {
  return "$" + v.toLocaleString("pt-BR");
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="urp-label">{label}</label>
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  onCommit,
  placeholder,
  mono,
}: {
  value: string;
  onChange: (v: string) => void;
  onCommit: () => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <div className="clip-frame clip-btn">
      <div className="clip-surface">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onCommit}
          placeholder={placeholder}
          className={cn("urp-input", mono && "font-mono")}
        />
      </div>
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  onCommit,
  min,
  max,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  onCommit: () => void;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  return (
    <div className="clip-frame clip-btn">
      <div className="clip-surface flex items-center">
        <input
          type="number"
          value={Number.isFinite(value) ? value : 0}
          min={min}
          max={max}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          onFocus={onCommit}
          className="urp-input w-full"
        />
        {suffix && (
          <span className="pr-2.5 font-mono text-[10px] text-white/40">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function SelectInput<T extends string>({
  value,
  onChange,
  onCommit,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  onCommit: () => void;
  options: readonly T[];
}) {
  return (
    <div className="clip-frame clip-btn">
      <div className="clip-surface">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          onFocus={onCommit}
          className="urp-input cursor-pointer appearance-none bg-transparent pr-2"
        >
          {options.map((opt) => (
            <option key={opt} value={opt} className="bg-urp-elevated text-white">
              {opt}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function TextArea({
  value,
  onChange,
  onCommit,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onCommit: () => void;
  placeholder?: string;
}) {
  return (
    <div className="clip-frame clip-btn">
      <div className="clip-surface">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onCommit}
          placeholder={placeholder}
          rows={2}
          className="urp-input resize-none"
        />
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="urp-section-title px-4 pb-1 pt-3">{children}</div>
  );
}

// ---------- Activity Inspector ----------
function ActivityInspector({
  id,
  data,
}: {
  id: string;
  data: ActivityData;
}) {
  const updateNode = useBoard((s) => s.updateNode);
  const commit = useBoard((s) => s.commit);
  const nodes = useBoard((s) => s.nodes);
  const edges = useBoard((s) => s.edges);
  const [analysisOpen, setAnalysisOpen] = useState(false);

  const analysis = computeAnalysis(data, edges, nodes, id);

  const u = (patch: Partial<ActivityData>) => updateNode(id, patch);

  return (
    <>
      <SectionTitle>Identidade</SectionTitle>
      <div className="space-y-2.5 px-4 pb-3">
        <Field label="Nome">
          <TextInput
            value={data.name}
            onChange={(v) => u({ name: v })}
            onCommit={commit}
            placeholder="Nome da atividade"
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Categoria">
            <SelectInput
              value={data.category}
              onChange={(v) => u({ category: v })}
              onCommit={commit}
              options={ACTIVITY_CATEGORIES}
            />
          </Field>
          <Field label="Status">
            <SelectInput
              value={data.status}
              onChange={(v) => u({ status: v })}
              onCommit={commit}
              options={ACTIVITY_STATUSES}
            />
          </Field>
        </div>
        <Field label="Descrição curta">
          <TextArea
            value={data.description}
            onChange={(v) => u({ description: v })}
            onCommit={commit}
            placeholder="O que esta atividade faz…"
          />
        </Field>
      </div>
      <Field label="Cor do bloco">
        <div className="clip-frame clip-btn"><div className="clip-surface flex items-center gap-2 px-2.5 py-1.5"><input type="color" value={data.accentColor || "#36c0ff"} onChange={(e) => u({ accentColor: e.target.value })} className="h-7 w-9 cursor-pointer border-0 bg-transparent p-0" aria-label="Cor do bloco" /><span className="font-mono text-[10px] uppercase tracking-wider text-white/45">Escolher cor</span></div></div>
      </Field>
      <div className="urp-divider mx-4" />
      <SectionTitle>Pagamento</SectionTitle>
      <div className="space-y-2.5 px-4 pb-3">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Mínimo">
            <NumberInput
              value={data.paymentMin}
              onChange={(v) => u({ paymentMin: v })}
              onCommit={commit}
              min={0}
            />
          </Field>
          <Field label="Máximo">
            <NumberInput
              value={data.paymentMax}
              onChange={(v) => u({ paymentMax: v })}
              onCommit={commit}
              min={0}
            />
          </Field>
        </div>
        <Field label="Tipo de dinheiro">
          <SelectInput
            value={data.moneyType}
            onChange={(v) => u({ moneyType: v })}
            onCommit={commit}
            options={["limpo", "sujo"] as const}
          />
        </Field>
      </div>
      <div className="urp-divider mx-4" />

      <SectionTitle>Observação</SectionTitle>
      <div className="px-4 pb-3">
        <TextArea
          value={data.observation}
          onChange={(v) => u({ observation: v })}
          onCommit={commit}
          placeholder="Notas internas…"
        />
      </div>

      {/* Analysis */}
      <div className="urp-divider mx-4" />
      <div className="px-4 py-2">
        <button
          type="button"
          onClick={() => setAnalysisOpen((v) => !v)}
          className="flex w-full items-center justify-between"
        >
          <span className="urp-section-title">Análise</span>
          {analysisOpen ? (
            <ChevronDown size={14} className="text-white/40" />
          ) : (
            <ChevronRight size={14} className="text-white/40" />
          )}
        </button>
        {analysisOpen && (
          <div className="urp-fade mt-2 space-y-1.5">
            <p className="font-mono text-[9px] uppercase tracking-wider text-white/28">
              Estimativa — não é garantia
            </p>
            {analysis.breakdown.length === 0 && !analysis.hasMoney && (
              <p className="font-mono text-[10px] text-white/32">
                Conecte itens e dinheiro para ver a estimativa.
              </p>
            )}
            {analysis.breakdown.map((b, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-2 font-mono text-[10px]"
              >
                <span className="truncate text-white/56">{b.name}</span>
                <span className="flex items-center gap-1.5 tabular-nums text-white/40">
                  <span>
                    {b.avgQty}x · {b.chance}%
                  </span>
                  <span className="text-urp-cyan">
                    {fmtMoney(Math.round(b.expected))}
                  </span>
                </span>
              </div>
            ))}
            {analysis.hasMoney && (
              <div className="flex items-center justify-between gap-2 font-mono text-[10px]">
                <span className="text-white/56">Dinheiro médio</span>
                <span className="tabular-nums text-urp-green">
                  {fmtMoney(Math.round(analysis.moneyExpected))}
                </span>
              </div>
            )}
            <div className="urp-divider my-1.5" />
            <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
              <span className="uppercase tracking-wider text-white/56">
                Valor esperado total
              </span>
              <span className="font-600 tabular-nums text-urp-cyan">
                {fmtMoney(Math.round(analysis.totalExpected))}
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ---------- Item Inspector ----------
function ItemInspector({ id, data }: { id: string; data: ItemData }) {
  const updateNode = useBoard((s) => s.updateNode);
  const commit = useBoard((s) => s.commit);
  const u = (patch: Partial<ItemData>) => updateNode(id, patch);

  return (
    <>
      <SectionTitle>Item</SectionTitle>
      <div className="space-y-2.5 px-4 pb-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center"
            style={{
              background: `${data.color}1a`,
              border: `1px solid ${data.color}40`,
            }}
          >
            <ItemIcon icon={data.icon} color={data.color} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-base font-600 uppercase tracking-wide text-white">
              {data.name}
            </div>
            <div className="truncate font-mono text-[10px] text-white/40">
              {data.identifier}
            </div>
          </div>
        </div>
        <Field label="Nome oficial">
          <div className="urp-input cursor-not-allowed bg-white/3 text-white/40">
            {data.name}
          </div>
        </Field>
        <Field label="Identificador">
          <div className="urp-input cursor-not-allowed font-mono bg-white/3 text-white/40">
            {data.identifier}
          </div>
        </Field>
        <Field label="Categoria">
          <div className="urp-input cursor-not-allowed bg-white/3 text-white/40">
            {data.category}
          </div>
        </Field>
        <Field label="Valor de referência">
          <NumberInput
            value={data.referenceValue}
            onChange={(v) => u({ referenceValue: v })}
            onCommit={commit}
            min={0}
          />
        </Field>
      </div>
      <div className="urp-divider mx-4" />
      <SectionTitle>Observação local</SectionTitle>
      <div className="px-4 pb-3">
        <TextArea
          value={data.observation}
          onChange={(v) => u({ observation: v })}
          onCommit={commit}
          placeholder="Notas sobre este item no quadro…"
        />
      </div>
    </>
  );
}

function ItemIcon({ icon, color }: { icon: string; color: string }) {
  const Icon = ICONS[icon] || Cpu;
  return <Icon size={20} color={color} strokeWidth={1.5} />;
}

// ---------- Money Inspector ----------
function MoneyInspector({ id, data }: { id: string; data: MoneyData }) {
  const updateNode = useBoard((s) => s.updateNode);
  const commit = useBoard((s) => s.commit);
  const u = (patch: Partial<MoneyData>) => updateNode(id, patch);

  return (
    <>
      <SectionTitle>Dinheiro</SectionTitle>
      <div className="space-y-2.5 px-4 pb-3">
        <Field label="Rótulo">
          <TextInput
            value={data.label}
            onChange={(v) => u({ label: v })}
            onCommit={commit}
            placeholder="Pagamento"
          />
        </Field>
        <Field label="Tipo de dinheiro">
          <SelectInput
            value={data.moneyType}
            onChange={(v) => u({ moneyType: v })}
            onCommit={commit}
            options={["limpo", "sujo"] as const}
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Mínimo">
            <NumberInput
              value={data.amountMin}
              onChange={(v) => u({ amountMin: v })}
              onCommit={commit}
              min={0}
            />
          </Field>
          <Field label="Máximo">
            <NumberInput
              value={data.amountMax}
              onChange={(v) => u({ amountMax: v })}
              onCommit={commit}
              min={0}
            />
          </Field>
        </div>
        <Field label="Por jogador">
          <SelectInput
            value={data.perPlayer ? "sim" : "nao"}
            onChange={(v) => u({ perPlayer: v === "sim" })}
            onCommit={commit}
            options={["sim", "nao"] as const}
          />
        </Field>
      </div>
      <div className="urp-divider mx-4" />
      <SectionTitle>Observação</SectionTitle>
      <div className="px-4 pb-3">
        <TextArea
          value={data.observation}
          onChange={(v) => u({ observation: v })}
          onCommit={commit}
          placeholder="Notas internas…"
        />
      </div>
    </>
  );
}

// ---------- Note Inspector ----------
function NoteInspector({ id, data }: { id: string; data: NoteData }) {
  const updateNode = useBoard((s) => s.updateNode);
  const commit = useBoard((s) => s.commit);
  const u = (patch: Partial<NoteData>) => updateNode(id, patch);

  return (
    <>
      <SectionTitle>Anotação</SectionTitle>
      <div className="space-y-2.5 px-4 pb-3">
        <Field label="Título">
          <TextInput
            value={data.title}
            onChange={(v) => u({ title: v })}
            onCommit={commit}
            placeholder="Título"
          />
        </Field>
        <Field label="Texto">
          <TextArea
            value={data.text}
            onChange={(v) => u({ text: v })}
            onCommit={commit}
            placeholder="Texto curto…"
          />
        </Field>
      </div>
    </>
  );
}

// ---------- Edge Inspector ----------
function EdgeInspector({ id, data }: { id: string; data: EdgeData }) {
  const updateEdge = useBoard((s) => s.updateEdge);
  const commit = useBoard((s) => s.commit);
  const deleteEdge = useBoard((s) => s.deleteEdge);
  const u = (patch: Partial<EdgeData>) => updateEdge(id, patch);

  const edgeTypes: EdgeType[] = ["REQUER", "ENTREGA", "PAGA", "ALIMENTA", "CRAFTA"];

  return (
    <>
      <SectionTitle>Conexão</SectionTitle>
      <div className="space-y-2.5 px-4 pb-3">
        <Field label="Tipo">
          <SelectInput
            value={data.edgeType}
            onChange={(v) => u({ edgeType: v })}
            onCommit={commit}
            options={edgeTypes}
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Qtd. mín.">
            <NumberInput
              value={data.qtyMin}
              onChange={(v) => u({ qtyMin: v })}
              onCommit={commit}
              min={0}
            />
          </Field>
          <Field label="Qtd. máx.">
            <NumberInput
              value={data.qtyMax}
              onChange={(v) => u({ qtyMax: v })}
              onCommit={commit}
              min={0}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Revenda mín."><NumberInput value={data.resaleMin || 0} onChange={(v) => u({ resaleMin: v })} onCommit={commit} min={0} /></Field>
          <Field label="Revenda máx."><NumberInput value={data.resaleMax || 0} onChange={(v) => u({ resaleMax: v })} onCommit={commit} min={0} /></Field>
        </div>
        {data.edgeType === "REQUER" && (
          <div className="grid grid-cols-2 gap-2">
            <Field label="Custo em dinheiro mín."><NumberInput value={data.moneyCostMin || 0} onChange={(v) => u({ moneyCostMin: v })} onCommit={commit} min={0} /></Field>
            <Field label="Custo em dinheiro máx."><NumberInput value={data.moneyCostMax || 0} onChange={(v) => u({ moneyCostMax: v })} onCommit={commit} min={0} /></Field>
          </div>
        )}
        <Field label="Chance">
          <NumberInput
            value={data.chance}
            onChange={(v) => u({ chance: Math.min(100, Math.max(0, v)) })}
            onCommit={commit}
            min={0}
            max={100}
            suffix="%"
          />
        </Field>
        <Field label="Item consumido">
          <SelectInput
            value={data.consumes ? "sim" : "nao"}
            onChange={(v) => u({ consumes: v === "sim" })}
            onCommit={commit}
            options={["sim", "nao"] as const}
          />
        </Field>
      </div>
      <div className="urp-divider mx-4" />
      <SectionTitle>Observação</SectionTitle>
      <div className="px-4 pb-3">
        <TextArea
          value={data.observation}
          onChange={(v) => u({ observation: v })}
          onCommit={commit}
          placeholder="Notas sobre a conexão…"
        />
      </div>
      <div className="urp-divider mx-4" />
      <div className="px-4 py-3">
        <button
          type="button"
          onClick={() => deleteEdge(id)}
          className="font-mono text-[11px] uppercase tracking-wider text-urp-red/80 transition-colors hover:text-urp-red"
        >
          Excluir conexão
        </button>
      </div>
    </>
  );
}

// ---------- Main Inspector ----------
export function Inspector() {
  const selectedNodeId = useBoard((s) => s.selectedNodeId);
  const selectedEdgeId = useBoard((s) => s.selectedEdgeId);
  const nodes = useBoard((s) => s.nodes);
  const edges = useBoard((s) => s.edges);
  const clearSelection = useBoard((s) => s.clearSelection);
  const deleteNode = useBoard((s) => s.deleteNode);
  const editingEnabled = useBoard((s) => s.editingEnabled);

  const node = nodes.find((n) => n.id === selectedNodeId);
  const edge = edges.find((e) => e.id === selectedEdgeId);

  if (!node && !edge) return null;

  const title = node
    ? node.data.kind === "activity"
      ? "Atividade"
      : node.data.kind === "item"
      ? "Item"
      : node.data.kind === "money"
      ? "Dinheiro"
      : "Anotação"
    : "Conexão";

  return (
    <div className="urp-slide pointer-events-auto absolute right-0 top-0 z-20 flex h-full w-[320px] flex-col">
      <div className="clip-frame clip-panel h-full">
        <div className="clip-surface flex h-full flex-col bg-urp-elevated">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-urp-border px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="urp-section-title">{title}</span>
              {node && (
                <span className="font-mono text-[9px] uppercase tracking-wider text-white/28">
                  {node.id.slice(0, 12)}
                </span>
              )}
              {!editingEnabled && (
                <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-white/36">
                  <LockKeyhole size={10} strokeWidth={1.5} /> Leitura
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {node && (
                <button
                  type="button"
                  aria-label="Excluir bloco"
                  title="Excluir bloco"
                  onClick={() => deleteNode(node.id)}
                  disabled={!editingEnabled}
                  className="flex h-7 w-7 items-center justify-center text-urp-red/70 transition-colors hover:text-urp-red"
                >
                  <X size={14} />
                </button>
              )}
              <button
                type="button"
                aria-label="Fechar inspetor"
                title="Fechar"
                onClick={clearSelection}
                className="flex h-7 w-7 items-center justify-center text-white/40 transition-colors hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Body */}
          <fieldset disabled={!editingEnabled} className="urp-scroll m-0 min-h-0 flex-1 border-0 p-0 disabled:opacity-70">
            {!editingEnabled && (
              <div className="border-b border-urp-border px-4 py-2 font-mono text-[9px] uppercase tracking-wider text-white/36">
                // Informe o token para editar
              </div>
            )}
            {node?.data.kind === "activity" && (
              <ActivityInspector id={node.id} data={node.data} />
            )}
            {node?.data.kind === "item" && (
              <ItemInspector id={node.id} data={node.data} />
            )}
            {node?.data.kind === "money" && (
              <MoneyInspector id={node.id} data={node.data} />
            )}
            {node?.data.kind === "note" && (
              <NoteInspector id={node.id} data={node.data} />
            )}
            {edge?.data && <EdgeInspector id={edge.id} data={edge.data} />}
          </fieldset>
        </div>
      </div>
    </div>
  );
}







