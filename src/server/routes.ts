import { BattleState, BuddyDef, BuddyStats } from "../engine/types";
import { createBattle, applyMove } from "../engine/battle";
import { getMove } from "../engine/moves";

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
  buddy: BuddyDef;
}

export interface Room {
  code: string;
  players: [PlayerSlot | null, PlayerSlot | null];
  state: BattleState | null;
  status: "waiting" | "active" | "finished";
  createdAt: number;
}

// ── Validation ───────────────────────────────────────────

function isValidStat(n: unknown): boolean {
  return typeof n === "number" && n >= 1 && n <= 200;
}

function validateBuddy(b: unknown): BuddyDef {
  if (!b || typeof b !== "object") throw new Error("buddy must be an object");
  const obj = b as Record<string, unknown>;

  if (typeof obj.name !== "string" || !obj.name.trim()) throw new Error("buddy.name required");
  if (typeof obj.type !== "string" || !obj.type.trim()) throw new Error("buddy.type required");

  const s = obj.stats as Record<string, unknown> | undefined;
  if (!s) throw new Error("buddy.stats required");
  const statKeys: (keyof BuddyStats)[] = ["hp", "attack", "defense", "speed", "special"];
  for (const k of statKeys) {
    if (!isValidStat(s[k])) throw new Error(`buddy.stats.${k} must be 1–200`);
  }

  if (!Array.isArray(obj.moves) || obj.moves.length === 0) throw new Error("buddy.moves required");
  for (const id of obj.moves as unknown[]) {
    if (typeof id !== "string") throw new Error("buddy.moves must be strings");
    getMove(id); // throws if unknown
  }

  return {
    name: (obj.name as string).trim().slice(0, 32),
    type: (obj.type as string).trim().slice(0, 32),
    description: typeof obj.description === "string" ? obj.description.slice(0, 128) : "",
    stats: {
      hp: s.hp as number,
      attack: s.attack as number,
      defense: s.defense as number,
      speed: s.speed as number,
      special: s.special as number,
    },
    moves: (obj.moves as string[]).slice(0, 6),
  };
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
  let body: { buddy?: unknown };
  try {
    body = await request.json() as { buddy?: unknown };
  } catch {
    return error("invalid JSON");
  }

  let buddy: BuddyDef;
  try {
    buddy = validateBuddy(body.buddy);
  } catch (e: unknown) {
    return error((e as Error).message);
  }

  const code = generateCode();
  const token = crypto.randomUUID();

  const room: Room = {
    code,
    players: [{ token, buddy }, null],
    state: null,
    status: "waiting",
    createdAt: Date.now(),
  };

  await env.ROOMS.put(code, JSON.stringify(room), { expirationTtl: 3600 });

  return json({ code, token, playerIndex: 0 });
}

// ── POST /room/:code/join ────────────────────────────────

export async function handleJoinRoom(request: Request, env: Env, code: string): Promise<Response> {
  let body: { buddy?: unknown };
  try {
    body = await request.json() as { buddy?: unknown };
  } catch {
    return error("invalid JSON");
  }

  let buddy1: BuddyDef;
  try {
    buddy1 = validateBuddy(body.buddy);
  } catch (e: unknown) {
    return error((e as Error).message);
  }

  const roomJson = await env.ROOMS.get(code);
  if (!roomJson) return error("room not found", 404);

  const room: Room = JSON.parse(roomJson);

  if (room.status !== "waiting") return error("room not available");
  if (room.players[1] !== null) return error("room is full");

  const token = crypto.randomUUID();
  room.players[1] = { token, buddy: buddy1 };

  const buddy0 = room.players[0]!.buddy;
  room.state = createBattle(buddy0, buddy1);
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
