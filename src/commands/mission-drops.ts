import { EmbedBuilder } from 'discord.js';
import { DISCORD_COLOR, DISCORD_ICON, WARFRAME_DROPS_API } from '../config';

const DROPS_BASE = WARFRAME_DROPS_API.replace(/\/data\/all\.json$/i, '');

interface Reward {
  itemName: string;
  rarity: string;
  chance: number;
  rotation?: string;
  stage?: string;
}

interface NodeData {
  gameMode: string;
  isEvent?: boolean;
  rewards: Record<string, Reward[]>;
}

type MissionRewards = Record<string, Record<string, NodeData>>;

interface TransientSource {
  objectiveName: string;
  rewards: Reward[];
}

interface BountySource {
  bountyLevel: string;
  rewards: Record<string, Reward[]>;
}

const RARITY_EMOJI: Record<string, string> = {
  Common: '⚪',
  Uncommon: '🟢',
  Rare: '🔵',
  Legendary: '🟡',
};

const rarityIcon = (r: string) => RARITY_EMOJI[r] ?? '◽';

const fetchJson = async <T>(path: string): Promise<T | null> => {
  try {
    const res = await fetch(`${DROPS_BASE}${path}`);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
};

const findKey = <T>(obj: Record<string, T>, query: string): string | null => {
  const q = query.toLowerCase();
  const keys = Object.keys(obj);
  return (
    keys.find(k => k.toLowerCase() === q) ??
    keys.find(k => k.toLowerCase().startsWith(q)) ??
    keys.find(k => k.toLowerCase().includes(q)) ??
    null
  );
};

const errorEmbed = (msg: string) =>
  new EmbedBuilder()
    .setTitle('Mission Drops Lookup')
    .setDescription(msg)
    .setColor(DISCORD_COLOR.red)
    .setThumbnail(DISCORD_ICON.item);

export const buildItemDropsEmbed = async (args: string[]): Promise<EmbedBuilder> => {
  if (!args.length) {
    return errorEmbed(
      'Usage:\n' +
      '`!wf drops <item name>` — search drop sources for an item\n' +
      '`!wf drops planet <planet>` — list missions on a planet\n' +
      '`!wf drops planet <planet> <node>` — show a node\'s rewards'
    );
  }

  const head = args[0].toLowerCase();
  if (head === 'planet' || head === 'mission') {
    return buildPlanetEmbed(args.slice(1));
  }

  return buildItemSearchEmbed(args.join(' '));
};

const buildPlanetEmbed = async (parts: string[]): Promise<EmbedBuilder> => {
  if (!parts.length) {
    return errorEmbed('Specify a planet. Example: `!wf drops planet Sedna Hydron`');
  }

  const wrapper = await fetchJson<{ missionRewards: MissionRewards }>('/data/missionRewards.json');
  const data = wrapper?.missionRewards;
  if (!data) return errorEmbed('Failed to load mission data.');

  const planet = findKey(data, parts[0]);
  if (!planet) {
    return errorEmbed(
      `Planet not found: **${parts[0]}**\n\n` +
      `Available: ${Object.keys(data).sort().join(', ')}`
    );
  }

  const nodes = data[planet];

  if (parts.length === 1) {
    return buildPlanetListEmbed(planet, nodes);
  }

  const nodeQuery = parts.slice(1).join(' ');
  const node = findKey(nodes, nodeQuery);

  if (!node) {
    const partials = Object.keys(nodes)
      .filter(n => n.toLowerCase().includes(nodeQuery.toLowerCase()))
      .slice(0, 5);
    const hint = partials.length
      ? `Did you mean: ${partials.map(m => `**${m}**`).join(', ')}?`
      : `Try \`!wf drops planet ${planet}\` to list nodes.`;
    return errorEmbed(`Mission not found on **${planet}**: **${nodeQuery}**\n\n${hint}`);
  }

  return buildNodeRewardsEmbed(planet, node, nodes[node]);
};

const buildPlanetListEmbed = (
  planet: string,
  nodes: Record<string, NodeData>
): EmbedBuilder => {
  const byMode = new Map<string, string[]>();
  for (const [name, d] of Object.entries(nodes)) {
    const list = byMode.get(d.gameMode) ?? [];
    list.push(name);
    byMode.set(d.gameMode, list);
  }

  const fields = Array.from(byMode.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mode, names]) => ({
      name: mode,
      value: names.sort().join(', ').slice(0, 1024),
      inline: false,
    }));

  return new EmbedBuilder()
    .setTitle(`${planet} — Missions`)
    .setDescription(
      `${Object.keys(nodes).length} missions. ` +
      `Use \`!wf drops planet ${planet} <node>\` for rewards.`
    )
    .addFields(fields)
    .setColor(DISCORD_COLOR.orange)
    .setThumbnail(DISCORD_ICON.item)
    .setFooter({ text: 'Data via drops.warframestat.us' });
};

const buildNodeRewardsEmbed = (
  planet: string,
  node: string,
  data: NodeData
): EmbedBuilder => {
  const rotations = Object.entries(data.rewards)
    .filter(([, r]) => Array.isArray(r) && r.length > 0)
    .sort(([a], [b]) => a.localeCompare(b));

  const fields = rotations.map(([rotation, rewards]) => {
    const sorted = [...rewards].sort((a, b) => b.chance - a.chance);
    const value = sorted
      .map(r => `${rarityIcon(r.rarity)} **${r.itemName}** — ${r.chance}%`)
      .join('\n')
      .slice(0, 1024);
    return {
      name: `Rotation ${rotation}`,
      value: value || '*No rewards*',
      inline: true,
    };
  });

  return new EmbedBuilder()
    .setTitle(`${node} — ${planet}`)
    .setDescription(`**${data.gameMode}**${data.isEvent ? ' *(Event)*' : ''}`)
    .addFields(fields)
    .setColor(DISCORD_COLOR.orange)
    .setThumbnail(DISCORD_ICON.item)
    .setFooter({ text: 'Data via drops.warframestat.us' });
};

interface SearchHit {
  group: 'Missions' | 'Bounties' | 'Sortie' | 'Other';
  label: string;
  context?: string;
  reward: Reward;
}

const buildItemSearchEmbed = async (query: string): Promise<EmbedBuilder> => {
  const q = query.toLowerCase();

  const [missionsWrap, transient, sortie, cetus, solaris, zariman] = await Promise.all([
    fetchJson<{ missionRewards: MissionRewards }>('/data/missionRewards.json'),
    fetchJson<{ transientRewards: TransientSource[] }>('/data/transientRewards.json'),
    fetchJson<{ sortieRewards: Reward[] }>('/data/sortieRewards.json'),
    fetchJson<{ cetusBountyRewards: BountySource[] }>('/data/cetusBountyRewards.json'),
    fetchJson<{ solarisBountyRewards: BountySource[] }>('/data/solarisBountyRewards.json'),
    fetchJson<{ zarimanRewards: BountySource[] }>('/data/zarimanRewards.json'),
  ]);

  const missions = missionsWrap?.missionRewards;
  const hits: SearchHit[] = [];
  const matches = (name: string | undefined) => !!name && name.toLowerCase().includes(q);

  if (missions) {
    for (const [planet, nodes] of Object.entries(missions)) {
      for (const [node, nodeData] of Object.entries(nodes)) {
        if (!nodeData?.rewards) continue;
        for (const [rotation, list] of Object.entries(nodeData.rewards)) {
          if (!Array.isArray(list)) continue;
          for (const reward of list) {
            if (matches(reward.itemName)) {
              hits.push({
                group: 'Missions',
                label: `${node} (${planet})`,
                context: `${nodeData.gameMode} · Rot ${rotation}`,
                reward,
              });
            }
          }
        }
      }
    }
  }

  for (const t of transient?.transientRewards ?? []) {
    for (const reward of t.rewards) {
      if (matches(reward.itemName)) {
        hits.push({
          group: 'Other',
          label: t.objectiveName,
          context: reward.rotation ? `Rot ${reward.rotation}` : undefined,
          reward,
        });
      }
    }
  }

  for (const reward of sortie?.sortieRewards ?? []) {
    if (matches(reward.itemName)) {
      hits.push({ group: 'Sortie', label: 'Sortie Reward', reward });
    }
  }

  const collectBounty = (src: BountySource[] | undefined, area: string) => {
    for (const b of src ?? []) {
      for (const [rotation, list] of Object.entries(b.rewards)) {
        if (!Array.isArray(list)) continue;
        for (const reward of list) {
          if (matches(reward.itemName)) {
            hits.push({
              group: 'Bounties',
              label: `${area} · ${b.bountyLevel.replace(/\s+/g, ' ').trim()}`,
              context: reward.stage ?? `Rot ${rotation}`,
              reward,
            });
          }
        }
      }
    }
  };
  collectBounty(cetus?.cetusBountyRewards, 'Cetus');
  collectBounty(solaris?.solarisBountyRewards, 'Fortuna');
  collectBounty(zariman?.zarimanRewards, 'Zariman');

  if (!hits.length) {
    return new EmbedBuilder()
      .setTitle('Item Drop Lookup')
      .setDescription(`No drops found for: **${query}**`)
      .setColor(DISCORD_COLOR.red)
      .setThumbnail(DISCORD_ICON.item);
  }

  const grouped = new Map<SearchHit['group'], SearchHit[]>();
  for (const h of hits) {
    const list = grouped.get(h.group) ?? [];
    list.push(h);
    grouped.set(h.group, list);
  }

  const order: SearchHit['group'][] = ['Missions', 'Bounties', 'Sortie', 'Other'];
  const fields = order
    .filter(g => grouped.has(g))
    .map(g => {
      const list = grouped.get(g)!;
      const top = [...list].sort((a, b) => b.reward.chance - a.reward.chance).slice(0, 5);
      const value = top
        .map(h => {
          const ctx = h.context ? ` · ${h.context}` : '';
          return (
            `${rarityIcon(h.reward.rarity)} **${h.reward.itemName}** — ${h.reward.chance}%\n` +
            `└ ${h.label}${ctx}`
          );
        })
        .join('\n\n')
        .slice(0, 1024);
      const suffix = list.length > top.length ? ` *(+${list.length - top.length} more)*` : '';
      return {
        name: `${g} — ${list.length} match${list.length === 1 ? '' : 'es'}${suffix}`,
        value,
        inline: false,
      };
    });

  return new EmbedBuilder()
    .setTitle('Item Drop Lookup')
    .setDescription(`Top sources for: **${query}**`)
    .addFields(fields)
    .setColor(DISCORD_COLOR.orange)
    .setThumbnail(DISCORD_ICON.item)
    .setFooter({ text: 'Data via drops.warframestat.us' });
};
