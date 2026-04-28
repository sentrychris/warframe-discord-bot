import { EmbedBuilder } from 'discord.js';
import { DISCORD_COLOR, DISCORD_ICON, WARFRAME_API } from '../config';

interface InvasionReward {
  countedItems?: { count: number; type: string }[];
  items?: string[];
  credits?: number;
  thumbnail?: string;
}

interface Invasion {
  node: string;
  desc: string;
  attacker: {
    faction: string;
    reward?: InvasionReward;
  };
  defender: {
    faction: string;
    reward?: InvasionReward;
  };
  completed: boolean;
  completion: number;
  vsInfestation: boolean;
}

const formatReward = (reward?: InvasionReward): string => {
  if (!reward) return 'No reward';
  const parts: string[] = [];
  for (const item of reward.countedItems ?? []) {
    parts.push(`${item.count}× ${item.type}`);
  }
  for (const item of reward.items ?? []) {
    parts.push(item);
  }
  if (reward.credits) parts.push(`${reward.credits.toLocaleString()} credits`);
  return parts.length ? parts.join(', ') : 'No reward';
};

const FACTION_ICONS: Record<string, string> = {
  Corpus: 'https://wiki.warframe.com/images/thumb/IconCorpusOn.png/300px-IconCorpusOn.png',
  Grineer: 'https://wiki.warframe.com/images/thumb/IconGrineerOn.png/300px-IconGrineerOn.png',
  Infested: 'https://wiki.warframe.com/images/thumb/FactionsInfested.png/300px-FactionsInfested.png'
};

export const buildInvasionsEmbed = async (
  { title, footer }: { title?: string; footer?: string } = {}
): Promise<EmbedBuilder> => {
  try {
    const res = await fetch(`${WARFRAME_API}/invasions?lang=en`);
    const data: Invasion[] = await res.json();

    const active = data.filter(inv => !inv.completed).sort((a, b) => b.completion - a.completion);

    if (!active.length) {
      return new EmbedBuilder()
        .setColor(DISCORD_COLOR.purple)
        .setTitle(title ?? 'Invasions')
        .setDescription('There are currently no active invasions.');
    }

    const attackingFactionIcon = FACTION_ICONS[active[0].attacker.faction] ?? DISCORD_ICON.clan;

    const embed = new EmbedBuilder()
      .setColor(DISCORD_COLOR.purple)
      .setTitle(title ?? 'Invasions')
      .setDescription('Ongoing conflicts across the Origin System')
      .setThumbnail(attackingFactionIcon)
      .setFooter({
        text:
          'Source: warframestat.us — Invasions resolve once a side reaches 100%.\n' +
          (footer ?? ''),
      });

    for (const invasion of active) {
      const attackerFaction = invasion.attacker.faction;
      const defenderFaction = invasion.defender.faction;

      const attackerReward =
        attackerFaction !== 'Infested' ? `🎁 **${attackerFaction}**: ${formatReward(invasion.attacker.reward)}\n` : '';
      const defenderReward =
        defenderFaction !== 'Infested' ? `🎁 **${defenderFaction}**: ${formatReward(invasion.defender.reward)}\n` : '';

      const clampedCompletion = Math.max(0, Math.min(100, invasion.completion)).toFixed(1);
      const progressLabel = invasion.vsInfestation ? 'Defender Holding' : 'Completion';

      embed.addFields({
        name: `${invasion.node} — ${invasion.desc}`,
        value:
          `🆚 **${attackerFaction} vs ${defenderFaction}**\n` +
          attackerReward +
          defenderReward +
          `📊 **${progressLabel}**: ${clampedCompletion}%`,
        inline: false,
      });
    }

    return embed;
  } catch (err) {
    console.error('Failed to fetch invasions:', err);
    return new EmbedBuilder()
      .setColor(DISCORD_COLOR.red)
      .setTitle('Invasions')
      .setDescription('Unable to fetch invasion data at this time.');
  }
};
