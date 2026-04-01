import {
  Env,
  handleCreateRoom,
  handleJoinRoom,
  handleGetState,
  handleSubmitMove,
} from "./routes";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function withCors(response: Response): Response {
  const r = new Response(response.body, response);
  for (const [k, v] of Object.entries(CORS_HEADERS)) r.headers.set(k, v);
  return r;
}

function notFound(): Response {
  return new Response(JSON.stringify({ error: "not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    let response: Response;

    try {
      const roomMatch = path.match(/^\/room\/([A-Z0-9]{6})(?:\/(join|state|move))?$/);

      if (method === "POST" && path === "/room") {
        response = await handleCreateRoom(request, env);
      } else if (roomMatch) {
        const code = roomMatch[1];
        const action = roomMatch[2];

        if (method === "POST" && action === "join") {
          response = await handleJoinRoom(request, env, code);
        } else if (method === "GET" && action === "state") {
          response = await handleGetState(env, code);
        } else if (method === "POST" && action === "move") {
          response = await handleSubmitMove(request, env, code);
        } else {
          response = notFound();
        }
      } else {
        response = notFound();
      }
    } catch {
      response = new Response(JSON.stringify({ error: "internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return withCors(response);
  },
};
