import { EmbedBuilder } from 'discord.js';
import { DISCORD_COLOR, DISCORD_ICON, WARFRAME_API } from '../config';
import { reportError } from '../error-reporter';

interface Fissure {
  node: string;
  missionType: string;
  tier: string;
  isHard: boolean;
  isStorm: boolean;
  expiry: string;
}

/**
 * Converts fissure object to formatted markdown bullet line.
 */
function formatFissure(f: Fissure): string {
  const tags = [];
  if (f.isHard) tags.push('Steel Path');
  if (f.isStorm) tags.push('Void Storm');

  const levelRange = getTierLevelRange(f.tier, f.isHard);
  const label = `• **${f.node}** — ${f.missionType} (Lvl ${levelRange})`;
  return tags.length > 0 ? `${label} _( ${tags.join(', ')} )_` : label;
}

/**
 * Get the relic tier level range.
 */
function getTierLevelRange(tier: string, isHard: boolean): string {
  const ranges: Record<string, [number, number]> = {
    Lith: [10, 30],
    Meso: [15, 35],
    Neo: [20, 40],
    Axi: [25, 45],
    Requiem: [30, 50],
  };
  const base = ranges[tier] || [0, 0];
  if (isHard) {
    return `${base[0] + 100}–${base[1] + 100}`;
  }
  return `${base[0]}–${base[1]}`;
}

/**
 * Groups fissures by tier.
 */
function groupByTier(fissures: Fissure[]): Map<string, Fissure[]> {
  return fissures.reduce((map, f) => {
    if (!map.has(f.tier)) map.set(f.tier, []);
    map.get(f.tier)!.push(f);
    return map;
  }, new Map<string, Fissure[]>());
}

/**
 * Builds an embed showing active void fissures grouped by relic tier.
 */
export const buildVoidFissuresEmbed = async (filterTier?: string): Promise<EmbedBuilder> => {
  try {
    const res = await fetch(`${WARFRAME_API}/fissures?lang=en`);
    const fissures: Fissure[] = await res.json();

    if (!fissures.length) {
      return new EmbedBuilder()
        .setTitle('Void Fissures')
        .setDescription('No active fissures.')
        .setColor(DISCORD_COLOR.blue)
        .setThumbnail(DISCORD_ICON.void);
    }

    const grouped = groupByTier(fissures);

    const entries = Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .filter(([tier]) => !filterTier || tier.toLowerCase() === filterTier.toLowerCase());

    if (!entries.length) {
      return new EmbedBuilder()
        .setTitle('Void Fissures')
        .setDescription(`No fissures found for tier: ${filterTier}`)
        .setColor(DISCORD_COLOR.blue)
        .setThumbnail(DISCORD_ICON.void);
    }

    const fields = entries.map(([tier, list]) => ({
      name: `${tier} Relics`,
      value: list
        .sort((a, b) => a.node.localeCompare(b.node))
        .map(formatFissure)
        .join('\n'),
      inline: false,
    }));

    return new EmbedBuilder()
      .setTitle('Active Void Fissures')
      .setDescription(filterTier ? `Filtered by era: ${filterTier}` : 'Live fissures available for relic cracking')
      .setColor(DISCORD_COLOR.orange)
      .setThumbnail(DISCORD_ICON.void)
      .addFields(fields)
      .setFooter({ text: 'Steel Path and Void Storm included where applicable.' });
  } catch (err) {
    await reportError('Failed to fetch Void Fissures', err);
    return new EmbedBuilder()
      .setColor(DISCORD_COLOR.red)
      .setTitle('Void Fissures')
      .setDescription('Unable to fetch fissure data at this time.')
      .setThumbnail(DISCORD_ICON.void);
  }
};