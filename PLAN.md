# Battle Buddy — Design Plan

A Pokemon-like CLI multiplayer battle game built around Claude Code companion buddies (e.g. Rook the cactus).

```
npm install -g battle-buddy
# or
npx battle-buddy
```

---

## Principles

- **Zero config** — install and play, no accounts, no setup
- **Tiny footprint** — minimal dependencies, fast install
- **npx-ready** — `npx battle-buddy` just works
- **Open source** — MIT license, GitHub-hosted, contributions welcome

---

## Concept

Each user's buddy is their fighter. Stats and moves are derived from the buddy's personality and type (cactus, fern, bonsai, etc.).

---

## Buddy Stats

| Stat     | Description                        | Rook example |
|----------|------------------------------------|--------------|
| HP       | Health points                      | 85           |
| Attack   | Damage output                      | 60           |
| Defense  | Damage reduction                   | 90           |
| Speed    | Determines turn order              | 30           |
| Special  | Bonus effect potency               | 75           |

---

## Moves (cactus-themed example)

| Move          | Effect                                      |
|---------------|---------------------------------------------|
| Spine Shot    | Fast, low damage                            |
| Drought Drain | Sap opponent HP over time (DOT)             |
| Sand Shield   | Raise defense for 3 turns                   |
| Bloom Burst   | High damage, long cooldown                  |
| Rooting       | Immobilize opponent for 1 turn              |

---

## Battle Modes

| Mode       | Description                                      |
|------------|--------------------------------------------------|
| 1v1        | Two players, one buddy each                      |
| Gauntlet   | Solo vs. a series of AI buddies                  |

2v2 Team and Tag Battle are stretch goals — ship 1v1 + Gauntlet first.

---

## Turn Structure (CLI UI)

```
[Turn 3] Rook vs. Fernsby

> Rook's HP: 62/85    Fernsby's HP: 44/70

Choose your move:
  1. Spine Shot     (ATK: 25, ACC: 95%)
  2. Drought Drain  (DOT: 10x3, ACC: 80%)
  3. Sand Shield    (DEF +20, 3 turns)
  4. Bloom Burst    (ATK: 55, cooldown: 3)

> _
```

Rendered with plain ANSI escape codes — no framework needed.

---

## Networking Model

### v1: Cloudflare Workers + KV (HTTP Polling)

Simplest possible multiplayer. No WebSocket complexity.

- `POST /room` → create room, returns 6-char code
- `POST /room/:code/join` → join with buddy data
- `GET  /room/:code/state` → poll current battle state (1s interval)
- `POST /room/:code/move` → submit a move

State stored in Cloudflare KV. 1s polling is imperceptible for turn-based gameplay.

### v2: Upgrade to Durable Objects + WebSocket

Only if polling proves insufficient. Same API shape, swap transport.

### Session Codes

```
$ battle-buddy host
Room created: ABC123

$ battle-buddy join ABC123
Connected! Rook is ready.
```

---

## npm Package Structure

```
battle-buddy/
├── package.json          # bin: { "battle-buddy": "./bin/cli.js" }
├── bin/
│   └── cli.js            # Entry point (#!/usr/bin/env node)
├── src/
│   ├── cli/
│   │   ├── index.ts      # Command router (host/join/gauntlet)
│   │   ├── render.ts     # ANSI terminal rendering
│   │   ├── input.ts      # Keypress/readline handling
│   │   └── client.ts     # HTTP polling client
│   ├── engine/
│   │   ├── battle.ts     # Pure battle logic (no I/O)
│   │   ├── moves.ts      # Move definitions & effects
│   │   ├── buddies.ts    # Buddy roster & stat blocks
│   │   └── types.ts      # Shared types
│   └── server/
│       ├── worker.ts     # Cloudflare Worker entrypoint
│       └── routes.ts     # Room CRUD + move submission
├── test/
│   └── engine.test.ts    # Battle engine unit tests
├── wrangler.toml         # Cloudflare Workers config
├── tsconfig.json
├── LICENSE               # MIT
└── README.md
```

---

## Dependencies (keep it tiny)

| Package        | Purpose                    | Size   |
|----------------|----------------------------|--------|
| `commander`    | CLI argument parsing       | ~50KB  |
| `chalk`        | Terminal colors            | ~20KB  |

That's it. No React, no ink, no blessed, no heavy TUI frameworks.
Node built-ins (`readline`, `process.stdin`) handle input.
ANSI escapes handle screen clearing and cursor movement.

### Dev dependencies

- `typescript` — type safety
- `vitest` — fast, zero-config testing
- `wrangler` — Cloudflare Workers CLI (server dev only)
- `tsup` — fast bundler, single-file output

---

## Tech Stack

| Layer              | Tool                              |
|--------------------|-----------------------------------|
| CLI interface      | Node.js + commander + chalk       |
| Terminal UI        | Raw ANSI escapes + readline       |
| Multiplayer sync   | Cloudflare Workers + KV (polling) |
| Session codes      | 6-char alphanumeric (e.g. ABC123) |
| Build              | tsup → single CJS bundle          |
| Test               | vitest                            |

---

## GitHub / Open Source

- **Repo**: `github.com/<owner>/battle-buddy`
- **License**: MIT
- **npm package**: `battle-buddy`
- **CI**: GitHub Actions — lint, test, publish on tag
- Semantic versioning, changelog via conventional commits
- `CONTRIBUTING.md` with setup instructions

---

## Progression Ideas (post-launch)

- XP & leveling — buddies grow stronger over time
- Unlockable moves — earn new moves by winning
- Buddy customization — rename/redesc after earning XP
- Rivalries — track win/loss records between specific buddies
- Seasonal leaderboard — via simple API
- 2v2 Team / Tag Battle modes

---

## Build Order

1. **Battle engine** — pure logic, fully testable, no I/O
2. **Gauntlet mode** — single-player CLI, playable offline
3. **npm packaging** — `npx battle-buddy gauntlet` works
4. **Server** — Cloudflare Worker + KV for room state
5. **Multiplayer CLI** — host/join commands, HTTP polling
6. **GitHub release** — CI, publish to npm, README

Start with step 1. Ship something playable (gauntlet) before touching networking.
