import { EmbedBuilder } from 'discord.js';
import { DISCORD_COLOR, DISCORD_ICON, WARFRAME_DROPS_API } from '../config';

const DROPS_BASE = WARFRAME_DROPS_API.replace(/\/data\/all\.json$/i, '');

interface RelicReward {
  itemName: string;
  rarity: string;
  chance: number;
}

interface RelicEntry {
  tier: string;
  relicName: string;
  state: string;
  rewards: RelicReward[];
}

interface NodeReward {
  itemName?: string;
  chance?: number;
}

interface NodeData {
  gameMode: string;
  rewards: Record<string, NodeReward[]>;
}

type MissionRewards = Record<string, Record<string, NodeData>>;

const TIER_EMOJI: Record<string, string> = {
  Lith: '🟫',
  Meso: '🟦',
  Neo: '🟧',
  Axi: '🟨',
  Requiem: '⬛',
  Eterna: '🟪',
  Vanguard: '🟩',
};

const tierIcon = (t: string) => TIER_EMOJI[t] ?? '◽';

const REFINEMENTS = ['Intact', 'Exceptional', 'Flawless', 'Radiant'] as const;

const fetchJson = async <T>(path: string): Promise<T | null> => {
  try {
    const res = await fetch(`${DROPS_BASE}${path}`);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
};

interface DropSource {
  planet: string;
  node: string;
  gameMode: string;
  rotation: string;
  chance: number;
}

interface RelicGroup {
  tier: string;
  name: string;
  itemName: string;
  rarity: string;
  states: Map<string, RelicReward>;
  isVaulted: boolean;
}

export const buildRelicDropsEmbed = async (query: string): Promise<EmbedBuilder> => {
  const q = query.toLowerCase();

  const [relicsWrap, missionsWrap] = await Promise.all([
    fetchJson<{ relics: RelicEntry[] }>('/data/relics.json'),
    fetchJson<{ missionRewards: MissionRewards }>('/data/missionRewards.json'),
  ]);

  const relics = relicsWrap?.relics;
  const missions = missionsWrap?.missionRewards;

  if (!relics) {
    return new EmbedBuilder()
      .setTitle('Relic Drop Lookup')
      .setDescription('Failed to load relic data.')
      .setColor(DISCORD_COLOR.red)
      .setThumbnail(DISCORD_ICON.relic);
  }

  const relicSources = new Map<string, DropSource[]>();
  for (const [planet, nodes] of Object.entries(missions ?? {})) {
    for (const [node, nodeData] of Object.entries(nodes)) {
      if (!nodeData?.rewards) continue;
      for (const [rotation, list] of Object.entries(nodeData.rewards)) {
        if (!Array.isArray(list)) continue;
        for (const reward of list) {
          const name = reward.itemName?.toLowerCase();
          if (!name?.endsWith(' relic')) continue;
          const key = name.replace(/ relic$/i, '').trim();
          const arr = relicSources.get(key) ?? [];
          arr.push({
            planet,
            node,
            gameMode: nodeData.gameMode,
            rotation,
            chance: reward.chance ?? 0,
          });
          relicSources.set(key, arr);
        }
      }
    }
  }

  const groups = new Map<string, RelicGroup>();
  for (const relic of relics) {
    for (const reward of relic.rewards) {
      if (!reward.itemName.toLowerCase().includes(q)) continue;
      const key = `${relic.tier} ${relic.relicName}`;
      let g = groups.get(key);
      if (!g) {
        g = {
          tier: relic.tier,
          name: relic.relicName,
          itemName: reward.itemName,
          rarity: reward.rarity,
          states: new Map(),
          isVaulted: !relicSources.has(key.toLowerCase()),
        };
        groups.set(key, g);
      }
      const existing = g.states.get(relic.state);
      if (!existing || reward.chance > existing.chance) {
        g.states.set(relic.state, reward);
        if (reward.chance >= (existing?.chance ?? 0)) {
          g.itemName = reward.itemName;
          g.rarity = reward.rarity;
        }
      }
    }
  }

  const matches = Array.from(groups.values());
  if (!matches.length) {
    return new EmbedBuilder()
      .setTitle('Relic Drop Lookup')
      .setDescription(`No relics found containing: **${query}**`)
      .setColor(DISCORD_COLOR.red)
      .setThumbnail(DISCORD_ICON.relic);
  }

  const bestChance = (g: RelicGroup) => {
    for (const r of [...REFINEMENTS].reverse()) {
      const s = g.states.get(r);
      if (s) return s.chance;
    }
    return 0;
  };

  const unvaulted = matches.filter(m => !m.isVaulted).sort((a, b) => bestChance(b) - bestChance(a));
  const vaulted = matches.filter(m => m.isVaulted).sort((a, b) => bestChance(b) - bestChance(a));

  const formatRefinements = (g: RelicGroup) =>
    REFINEMENTS
      .map(r => {
        const s = g.states.get(r);
        return s ? `${r[0]} ${s.chance}%` : null;
      })
      .filter((x): x is string => x !== null)
      .join(' · ');

  const formatTopSource = (g: RelicGroup) => {
    const sources = relicSources.get(`${g.tier} ${g.name}`.toLowerCase());
    if (!sources?.length) return null;
    const top = [...sources].sort((a, b) => b.chance - a.chance)[0];
    return `${top.node} (${top.planet}) — ${top.gameMode} Rot ${top.rotation} · ${top.chance}%`;
  };

  const MAX_UNVAULTED = 18;
  const fields: { name: string; value: string; inline: boolean }[] = [];

  for (const g of unvaulted.slice(0, MAX_UNVAULTED)) {
    const lines = [
      `**${g.itemName}** — *${g.rarity.toLowerCase()}*`,
      formatRefinements(g),
    ];
    const src = formatTopSource(g);
    if (src) lines.push(`Drops: ${src}`);
    fields.push({
      name: `${tierIcon(g.tier)} ${g.tier} ${g.name}`,
      value: lines.join('\n'),
      inline: false,
    });
  }

  if (unvaulted.length > MAX_UNVAULTED) {
    fields.push({
      name: '​',
      value: `*+${unvaulted.length - MAX_UNVAULTED} more unvaulted relics not shown*`,
      inline: false,
    });
  }

  if (vaulted.length) {
    const list = vaulted
      .slice(0, 15)
      .map(g => `${tierIcon(g.tier)} ${g.tier} ${g.name}`)
      .join(', ');
    const more = vaulted.length > 15 ? ` *+${vaulted.length - 15} more*` : '';
    fields.push({
      name: `🔒 Vaulted (${vaulted.length})`,
      value: list + more,
      inline: false,
    });
  }

  const desc = unvaulted.length
    ? `Relics that contain: **${query}**\nRefinement: **I**ntact · **E**xceptional · **F**lawless · **R**adiant`
    : `**${query}** only drops from vaulted relics — not currently farmable.`;

  return new EmbedBuilder()
    .setTitle('Relic Drop Lookup')
    .setDescription(desc)
    .setColor(unvaulted.length ? DISCORD_COLOR.orange : DISCORD_COLOR.red)
    .setThumbnail(DISCORD_ICON.relic)
    .addFields(fields)
    .setFooter({ text: 'Data via drops.warframestat.us' });
};
