# battle-buddy

Pokemon-like CLI battle game. Pick a buddy, fight friends or run the gauntlet.

```
npx battle-buddy
```

[![CI](https://github.com/wongcode/battle-buddy/actions/workflows/ci.yml/badge.svg)](https://github.com/wongcode/battle-buddy/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/battle-buddy)](https://www.npmjs.com/package/battle-buddy)

---

## Play

```bash
# No install needed
npx battle-buddy gauntlet        # solo — fight all opponents in a row
npx battle-buddy host            # multiplayer — create a room, share the code
npx battle-buddy join <code>     # multiplayer — join a friend's room

# Or install globally
npm install -g battle-buddy
battle-buddy gauntlet
```

---

## Buddies

| Name    | Type     | HP  | ATK | DEF | SPD | SPC |
|---------|----------|-----|-----|-----|-----|-----|
| Rook    | cactus   | 85  | 60  | 90  | 30  | 75  |
| Fernsby | fern     | 70  | 75  | 55  | 80  | 60  |
| Bonsly  | bonsai   | 80  | 80  | 70  | 40  | 70  |
| Sporex  | mushroom | 75  | 55  | 60  | 65  | 85  |

---

## Battle UI

```
[Turn 3] Rook vs. Fernsby

▸ Rook    [cactus]   ████████████░░░░░░░░ 62/85  ↑
  Fernsby [fern]     ████████░░░░░░░░░░░░ 44/70  ☠

Choose your move:
  1. Spine Shot     (ATK: 25, ACC: 95%)
  2. Drought Drain  (DOT: 10x3, ACC: 80%)
  3. Sand Shield    (DEF +20, 3t)
  4. Bloom Burst    (ATK: 55, ACC: 85%)

> _
```

---

## Multiplayer

Multiplayer runs through a Cloudflare Worker (free tier). Both players poll for state — no WebSocket needed for turn-based play.

```bash
# Player 1
$ battle-buddy host
  Room code: ABC123
  Share this code with your opponent.
  Waiting for opponent to join...

# Player 2
$ battle-buddy join ABC123
```

To run your own server: see [Deploying the server](#deploying-the-server).

---

## Dev setup

```bash
git clone https://github.com/wongcode/battle-buddy
cd battle-buddy
npm install

npm test          # run tests
npm run build     # compile to dist/
npm run dev       # run CLI from source (tsx)
```

---

## Deploying the server

```bash
# Install wrangler
npm install -g wrangler
wrangler login

# Create KV namespace
wrangler kv:namespace create ROOMS
# Copy the id and preview_id into wrangler.toml

# Deploy
wrangler deploy
```

Then set `BATTLE_BUDDY_API` in `src/cli/client.ts` to your worker URL, rebuild, and publish.

---

## Publishing to npm

Releases are automated via GitHub Actions. Push a version tag:

```bash
npm version patch   # or minor / major
git push --follow-tags
```

The [publish workflow](.github/workflows/publish.yml) runs tests, then publishes to npm. Requires a `NPM_TOKEN` secret in the repo settings.

---

## License

MIT
