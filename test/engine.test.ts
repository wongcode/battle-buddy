import { describe, it, expect, vi, beforeEach } from "vitest";
import { createBattle, applyMove, getAvailableMoves, isBattleOver } from "../src/engine/battle";
import { getBuddy } from "../src/engine/buddies";
import { getMove } from "../src/engine/moves";

describe("battle engine", () => {
  const rook = getBuddy("rook");
  const fernsby = getBuddy("fernsby");

  describe("createBattle", () => {
    it("initializes a battle with full HP", () => {
      const state = createBattle(rook, fernsby);
      expect(state.fighters[0].currentHp).toBe(rook.stats.hp);
      expect(state.fighters[1].currentHp).toBe(fernsby.stats.hp);
      expect(state.turn).toBe(1);
      expect(state.winner).toBeNull();
    });

    it("faster buddy goes first", () => {
      // Fernsby has speed 80, Rook has speed 30
      const state = createBattle(rook, fernsby);
      expect(state.activeIndex).toBe(1); // Fernsby is faster
    });
  });

  describe("applyMove", () => {
    beforeEach(() => {
      // Seed Math.random for deterministic tests
      vi.spyOn(Math, "random").mockReturnValue(0.5);
    });

    it("deals damage on a damage move", () => {
      const state = createBattle(rook, fernsby);
      // Force Rook to go first for this test
      state.activeIndex = 0;

      const result = applyMove(state, "spine_shot");
      expect(result.hit).toBe(true);
      expect(result.damage).toBeGreaterThan(0);
      expect(state.fighters[1].currentHp).toBeLessThan(fernsby.stats.hp);
    });

    it("misses when accuracy check fails", () => {
      // random() = 0.99 means roll = 99, which > 95 accuracy
      vi.spyOn(Math, "random").mockReturnValue(0.99);

      const state = createBattle(rook, fernsby);
      state.activeIndex = 0;

      const result = applyMove(state, "spine_shot");
      expect(result.hit).toBe(false);
      expect(result.damage).toBe(0);
    });

    it("applies DOT status effect", () => {
      const state = createBattle(rook, fernsby);
      state.activeIndex = 0;

      applyMove(state, "drought_drain");
      // DOT should be on the defender (fernsby, index 1)
      const dotEffects = state.fighters[1].statusEffects.filter(
        (e) => e.kind === "dot"
      );
      expect(dotEffects.length).toBe(1);
      expect(dotEffects[0].turnsLeft).toBeGreaterThan(0);
    });

    it("applies buff to self", () => {
      const state = createBattle(rook, fernsby);
      state.activeIndex = 0;

      applyMove(state, "sand_shield");
      const buffs = state.fighters[0].statusEffects.filter(
        (e) => e.kind === "buff"
      );
      expect(buffs.length).toBe(1);
      expect(buffs[0].stat).toBe("defense");
    });

    it("sets cooldown after use", () => {
      const state = createBattle(rook, fernsby);
      state.activeIndex = 0;

      applyMove(state, "bloom_burst");
      expect(state.fighters[0].cooldowns["bloom_burst"]).toBeDefined();
    });

    it("switches active player after move", () => {
      const state = createBattle(rook, fernsby);
      state.activeIndex = 0;

      applyMove(state, "spine_shot");
      expect(state.activeIndex).toBe(1);
    });

    it("throws if move is on cooldown", () => {
      const state = createBattle(rook, fernsby);
      state.activeIndex = 0;
      state.fighters[0].cooldowns["bloom_burst"] = 2;

      expect(() => applyMove(state, "bloom_burst")).toThrow("cooldown");
    });

    it("throws if buddy doesn't know the move", () => {
      const state = createBattle(rook, fernsby);
      state.activeIndex = 0;

      expect(() => applyMove(state, "frond_whip")).toThrow("doesn't know");
    });
  });

  describe("getAvailableMoves", () => {
    it("returns all moves when none on cooldown", () => {
      const state = createBattle(rook, fernsby);
      state.activeIndex = 0;

      const moves = getAvailableMoves(state);
      expect(moves).toEqual(rook.moves);
    });

    it("excludes moves on cooldown", () => {
      const state = createBattle(rook, fernsby);
      state.activeIndex = 0;
      state.fighters[0].cooldowns["bloom_burst"] = 2;

      const moves = getAvailableMoves(state);
      expect(moves).not.toContain("bloom_burst");
      expect(moves.length).toBe(rook.moves.length - 1);
    });
  });

  describe("isBattleOver", () => {
    it("returns false when both alive", () => {
      const state = createBattle(rook, fernsby);
      expect(isBattleOver(state)).toBe(false);
    });

    it("returns true when winner is set", () => {
      const state = createBattle(rook, fernsby);
      state.winner = 0;
      expect(isBattleOver(state)).toBe(true);
    });
  });

  describe("moves data", () => {
    it("all buddy moves exist", () => {
      for (const buddyId of ["rook", "fernsby", "bonsly", "sporex"]) {
        const buddy = getBuddy(buddyId);
        for (const moveId of buddy.moves) {
          expect(() => getMove(moveId)).not.toThrow();
        }
      }
    });
  });
});
