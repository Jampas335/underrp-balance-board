import type { BoardEdge, BoardNode } from "./types";

const OWNER = import.meta.env.VITE_GITHUB_OWNER || "Jampas335";
const REPOSITORY = import.meta.env.VITE_GITHUB_REPOSITORY || "underp-itens";
const BRANCH = import.meta.env.VITE_GITHUB_BRANCH || "main";
const BOARD_PATH = import.meta.env.VITE_GITHUB_BOARD_PATH || "data/balance-board.json";
const TOKEN_KEY = "underrp-balance-board-github-token";

export interface BoardSnapshot {
  nodes: BoardNode[];
  edges: BoardEdge[];
}

export interface RemoteBoard extends BoardSnapshot {
  sha: string | null;
  updatedAt: string | null;
}

export interface GitHubAccess {
  login: string;
  repository: string;
}

function headers(token?: string, json = false): Record<string, string> {
  const result: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) result.Authorization = `Bearer ${token}`;
  if (json) result["Content-Type"] = "application/json";
  return result;
}

function contentsUrl(): string {
  return `https://api.github.com/repos/${OWNER}/${REPOSITORY}/contents/${BOARD_PATH}`;
}

function encode(value: string): string {
  return btoa(unescape(encodeURIComponent(value)));
}

function decode(value: string): string {
  return decodeURIComponent(escape(atob(value.replace(/\n/g, ""))));
}

async function errorMessage(response: Response): Promise<string> {
  const data = await response.json().catch(() => ({}));
  return data.message || `GitHub respondeu com erro ${response.status}.`;
}

function isSnapshot(value: unknown): value is BoardSnapshot {
  if (!value || typeof value !== "object") return false;
  const candidate = value as BoardSnapshot;
  return Array.isArray(candidate.nodes) && Array.isArray(candidate.edges);
}

export function getGitHubTarget(): string {
  return `${OWNER}/${REPOSITORY} · ${BOARD_PATH}`;
}

export function getSessionToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function setSessionToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token.trim());
}

export function clearSessionToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // A ausência de storage apenas mantém a sessão em modo leitura.
  }
}

export async function validateToken(token: string): Promise<GitHubAccess> {
  const userResponse = await fetch("https://api.github.com/user", {
    headers: headers(token),
    cache: "no-store",
  });
  if (!userResponse.ok) throw new Error(await errorMessage(userResponse));
  const user = (await userResponse.json()) as { login?: string };

  const repositoryResponse = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPOSITORY}`,
    { headers: headers(token), cache: "no-store" }
  );
  if (!repositoryResponse.ok) throw new Error(await errorMessage(repositoryResponse));
  const repository = (await repositoryResponse.json()) as {
    full_name?: string;
    permissions?: { push?: boolean; maintain?: boolean; admin?: boolean };
  };

  const permissions = repository.permissions;
  if (permissions && !permissions.push && !permissions.maintain && !permissions.admin) {
    throw new Error("Este token não possui permissão de escrita neste repositório.");
  }

  return {
    login: user.login || "usuário",
    repository: repository.full_name || `${OWNER}/${REPOSITORY}`,
  };
}

export async function loadRemoteBoard(token?: string): Promise<RemoteBoard | null> {
  const response = await fetch(contentsUrl(), {
    headers: headers(token),
    cache: "no-store",
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(await errorMessage(response));

  const file = (await response.json()) as { content?: string; sha?: string };
  if (!file.content) throw new Error("O arquivo remoto não possui conteúdo legível.");

  const document = JSON.parse(decode(file.content)) as {
    nodes?: unknown;
    edges?: unknown;
    updatedAt?: unknown;
  };
  if (!isSnapshot(document)) throw new Error("O arquivo remoto não contém um quadro válido.");

  return {
    nodes: document.nodes,
    edges: document.edges,
    sha: file.sha || null,
    updatedAt: typeof document.updatedAt === "string" ? document.updatedAt : null,
  };
}

export async function saveRemoteBoard(
  snapshot: BoardSnapshot,
  token: string,
  sha: string | null
): Promise<{ sha: string | null; updatedAt: string }> {
  const updatedAt = new Date().toISOString();
  const document = {
    schema: "underrp.balance-board.v1",
    updatedAt,
    nodes: snapshot.nodes,
    edges: snapshot.edges,
  };
  const body: Record<string, string> = {
    message: "balance: atualiza mapa de progressão",
    content: encode(JSON.stringify(document, null, 2)),
    branch: BRANCH,
  };
  if (sha) body.sha = sha;

  const response = await fetch(contentsUrl(), {
    method: "PUT",
    headers: headers(token, true),
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await errorMessage(response));

  const result = (await response.json()) as { content?: { sha?: string } };
  return { sha: result.content?.sha || null, updatedAt };
}
