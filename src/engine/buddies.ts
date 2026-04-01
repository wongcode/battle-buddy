import { BuddyDef } from "./types";

const buddies: Record<string, BuddyDef> = {
  rook: {
    name: "Rook",
    type: "cactus",
    description: "A stoic desert cactus. Tough, patient, and covered in spines.",
    stats: { hp: 85, attack: 60, defense: 90, speed: 30, special: 75 },
    moves: ["spine_shot", "drought_drain", "sand_shield", "bloom_burst"],
  },
  fernsby: {
    name: "Fernsby",
    type: "fern",
    description: "A lush woodland fern. Quick, adaptable, and surprisingly fierce.",
    stats: { hp: 70, attack: 75, defense: 55, speed: 80, special: 60 },
    moves: ["frond_whip", "spore_cloud", "photosynthesis", "vine_crush"],
  },
  bonsly: {
    name: "Bonsly",
    type: "bonsai",
    description: "A miniature bonsai tree. Ancient wisdom in a small package.",
    stats: { hp: 80, attack: 80, defense: 70, speed: 40, special: 70 },
    moves: ["branch_snap", "root_grip", "bark_armor", "timber_slam"],
  },
  sporex: {
    name: "Sporex",
    type: "mushroom",
    description: "A mysterious fungal buddy. Weakens foes with spores and toxins.",
    stats: { hp: 75, attack: 55, defense: 60, speed: 65, special: 85 },
    moves: ["cap_bash", "toxic_spore", "mycelium_net", "decompose"],
  },
};

export function getBuddy(id: string): BuddyDef {
  const buddy = buddies[id];
  if (!buddy) throw new Error(`Unknown buddy: ${id}`);
  return buddy;
}

export function getAllBuddies(): Record<string, BuddyDef> {
  return { ...buddies };
}

export function getBuddyIds(): string[] {
  return Object.keys(buddies);
}
