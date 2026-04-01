import { BattleState, MoveResult } from "../engine/types";

const API_BASE =
  process.env.BATTLE_BUDDY_API ?? "https://battle-buddy.workers.dev";

export interface RoomState {
  status: "waiting" | "active" | "finished";
  state: BattleState | null;
}

async function fetchApi(path: string, options?: RequestInit): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
}

export async function createRoom(
  buddyId: string
): Promise<{ code: string; token: string }> {
  const res = await fetchApi("/room", {
    method: "POST",
    body: JSON.stringify({ buddyId }),
  });
  const data = (await res.json()) as { code: string; token: string; error?: string };
  if (!res.ok) throw new Error(data.error ?? "Failed to create room");
  return { code: data.code, token: data.token };
}

export async function joinRoom(
  code: string,
  buddyId: string
): Promise<{ token: string; playerIndex: number }> {
  const res = await fetchApi(`/room/${code}/join`, {
    method: "POST",
    body: JSON.stringify({ buddyId }),
  });
  const data = (await res.json()) as {
    token: string;
    playerIndex: number;
    error?: string;
  };
  if (!res.ok) throw new Error(data.error ?? "Failed to join room");
  return { token: data.token, playerIndex: data.playerIndex };
}

export async function pollState(code: string): Promise<RoomState> {
  const res = await fetchApi(`/room/${code}/state`);
  const data = (await res.json()) as RoomState & { error?: string };
  if (!res.ok) throw new Error(data.error ?? "Failed to get state");
  return data;
}

export async function submitMove(
  code: string,
  token: string,
  moveId: string
): Promise<{ result: MoveResult; state: BattleState }> {
  const res = await fetchApi(`/room/${code}/move`, {
    method: "POST",
    body: JSON.stringify({ token, moveId }),
  });
  const data = (await res.json()) as {
    result: MoveResult;
    state: BattleState;
    error?: string;
  };
  if (!res.ok) throw new Error(data.error ?? "Failed to submit move");
  return { result: data.result, state: data.state };
}
