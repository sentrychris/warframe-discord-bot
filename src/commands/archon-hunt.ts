import { EmbedBuilder } from 'discord.js';
import { DISCORD_COLOR, WARFRAME_API } from '../config';
import { formatDuration } from '../util';

const ARCHON_IMAGES: Record<string, string> = {
  'Archon Amar': 'https://wiki.warframe.com/images/thumb/ArchonAmar.png/300px-ArchonAmar.png',
  'Archon Nira': 'https://wiki.warframe.com/images/thumb/ArchonNira.png/300px-ArchonNira.png',
  'Archon Boreal': 'https://wiki.warframe.com/images/thumb/ArchonBoreal.png/300px-ArchonBoreal.png',
};

interface ArchonMission {
  node: string;
  type: string;
}

interface ArchonHuntData {
  boss: string;
  faction: string;
  activation: string;
  expiry: string;
  missions: ArchonMission[];
}

/**
 * Fetches the current Archon Hunt and builds a Discord embed.
 */
export const buildArchonHuntEmbed = async (
    { title, footer }: { title?: string, footer?: string } = {}
): Promise<EmbedBuilder> => {
  try {
    const res = await fetch(`${WARFRAME_API}/archonHunt?lang=en`);
    const data: ArchonHuntData = await res.json();

    const expiryMs = new Date(data.expiry).getTime();
    const activationMs = new Date(data.activation).getTime();
    const now = Date.now();
    if (now < activationMs || now >= expiryMs) {
      return new EmbedBuilder()
        .setColor(DISCORD_COLOR.red)
        .setTitle('Archon Hunt')
        .setDescription('No active Archon Hunt found.')
    }
    const eta = formatDuration(expiryMs - now);

    const image = ARCHON_IMAGES[data.boss] ?? ARCHON_IMAGES['Archon Nira'];

    const embedTitle = title ?? 'Archon Hunt';
    const defaultFooter = 'Source: warframestat.us — Resets every Monday at 00:00 UTC\n';
    const embedFooter = footer ? defaultFooter + footer : defaultFooter;

    const embed = new EmbedBuilder()
      .setColor(DISCORD_COLOR.red)
      .setTitle(embedTitle)
      .setDescription(`This week's Archon Hunt is against **${data.boss}**`)
      .setThumbnail(image)
      .addFields(
        { name: 'Boss', value: data.boss, inline: true },
        { name: 'Faction', value: data.faction, inline: true },
        { name: 'Time Remaining', value: eta, inline: true },
      )
      .setFooter({ text: embedFooter });

    data.missions.forEach((mission, index) => {
      embed.addFields({
        name: `Stage ${index + 1}: ${mission.type}`,
        value: `**Node**: ${mission.node}`,
        inline: false,
      });
    });

    return embed;
  } catch (error) {
    console.error('Failed to fetch Archon Hunt:', error);
    return new EmbedBuilder()
      .setColor(DISCORD_COLOR.red)
      .setTitle('Archon Hunt')
      .setDescription('Unable to fetch Archon Hunt information at this time.');
  }
};
