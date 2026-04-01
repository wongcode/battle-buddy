import { BattleState } from "../engine/types";
import { getBuddy } from "../engine/buddies";
import { createBattle, applyMove } from "../engine/battle";

// ── Types ────────────────────────────────────────────────

interface KV {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

export interface Env {
  ROOMS: KV;
}

interface PlayerSlot {
  token: string;
  buddyId: string;
}

export interface Room {
  code: string;
  players: [PlayerSlot | null, PlayerSlot | null];
  state: BattleState | null;
  status: "waiting" | "active" | "finished";
  createdAt: number;
}

// ── Helpers ──────────────────────────────────────────────

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  for (const b of bytes) {
    code += chars[b % chars.length];
  }
  return code;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function error(msg: string, status = 400): Response {
  return json({ error: msg }, status);
}

// ── POST /room ───────────────────────────────────────────

export async function handleCreateRoom(request: Request, env: Env): Promise<Response> {
  let body: { buddyId?: string };
  try {
    body = await request.json() as { buddyId?: string };
  } catch {
    return error("invalid JSON");
  }

  if (!body.buddyId) return error("buddyId required");

  try {
    getBuddy(body.buddyId);
  } catch {
    return error("unknown buddy");
  }

  const code = generateCode();
  const token = crypto.randomUUID();

  const room: Room = {
    code,
    players: [{ token, buddyId: body.buddyId }, null],
    state: null,
    status: "waiting",
    createdAt: Date.now(),
  };

  await env.ROOMS.put(code, JSON.stringify(room), { expirationTtl: 3600 });

  return json({ code, token, playerIndex: 0 });
}

// ── POST /room/:code/join ────────────────────────────────

export async function handleJoinRoom(request: Request, env: Env, code: string): Promise<Response> {
  let body: { buddyId?: string };
  try {
    body = await request.json() as { buddyId?: string };
  } catch {
    return error("invalid JSON");
  }

  if (!body.buddyId) return error("buddyId required");

  const roomJson = await env.ROOMS.get(code);
  if (!roomJson) return error("room not found", 404);

  const room: Room = JSON.parse(roomJson);

  if (room.status !== "waiting") return error("room not available");
  if (room.players[1] !== null) return error("room is full");

  let buddy1Def;
  try {
    buddy1Def = getBuddy(body.buddyId);
  } catch {
    return error("unknown buddy");
  }

  const token = crypto.randomUUID();
  room.players[1] = { token, buddyId: body.buddyId };

  const buddy0Def = getBuddy(room.players[0]!.buddyId);
  room.state = createBattle(buddy0Def, buddy1Def);
  room.status = "active";

  await env.ROOMS.put(code, JSON.stringify(room), { expirationTtl: 3600 });

  return json({ token, playerIndex: 1 });
}

// ── GET /room/:code/state ────────────────────────────────

export async function handleGetState(env: Env, code: string): Promise<Response> {
  const roomJson = await env.ROOMS.get(code);
  if (!roomJson) return error("room not found", 404);

  const room: Room = JSON.parse(roomJson);

  return json({ status: room.status, state: room.state });
}

// ── POST /room/:code/move ────────────────────────────────

export async function handleSubmitMove(request: Request, env: Env, code: string): Promise<Response> {
  let body: { token?: string; moveId?: string };
  try {
    body = await request.json() as { token?: string; moveId?: string };
  } catch {
    return error("invalid JSON");
  }

  if (!body.token || !body.moveId) return error("token and moveId required");

  const roomJson = await env.ROOMS.get(code);
  if (!roomJson) return error("room not found", 404);

  const room: Room = JSON.parse(roomJson);

  if (room.status !== "active" || !room.state) return error("battle not active");

  const playerIndex = room.players.findIndex((p) => p?.token === body.token);
  if (playerIndex === -1) return error("invalid token", 403);

  if (room.state.activeIndex !== playerIndex) return error("not your turn");

  let result;
  try {
    result = applyMove(room.state, body.moveId);
  } catch (e: unknown) {
    return error((e as Error).message);
  }

  if (room.state.winner !== null) {
    room.status = "finished";
  }

  await env.ROOMS.put(code, JSON.stringify(room), { expirationTtl: 3600 });

  return json({ result, state: room.state });
}
