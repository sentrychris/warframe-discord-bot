import { EmbedBuilder } from 'discord.js';
import { DISCORD_COLOR, DISCORD_ICON, WARFRAME_API } from '../config';
import { reportError } from '../error-reporter';

interface RotationItem {
  name: string;
  cost: number;
}

/**
 * Fetches and builds an embed showing Teshin's current Steel Path Honors offerings.
 */
export const buildTeshinRotationEmbed = async (): Promise<EmbedBuilder> => {
  try {
    const res = await fetch(`${WARFRAME_API}/steelPath`);
    const data = await res.json();

    const current = data.currentReward as RotationItem;
    const next = getNextRotatedItem(data.rotation, current.name);
    const resetTime = new Date(data.expiry).toUTCString();

    const evergreenList = (data.evergreens as RotationItem[])
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(item => `• ${item.name} — 🪙 ${item.cost}`)
      .join('\n');

    return new EmbedBuilder()
      .setColor(DISCORD_COLOR.orange)
      .setTitle('Teshin — Steel Path Honors')
      .setDescription(`Current weekly rotation and evergreen offerings`)
      .addFields(
        {
          name: '🟧 Weekly Rotating Item',
          value: `**${current.name}**\n🪙 ${current.cost} Steel Essence`,
          inline: true
        },
        {
          name: '🔁 Next Rotation',
          value: `**${next.name}**\n🪙 ${next.cost} Steel Essence`,
          inline: true
        },
        {
          name: '🕒 Resets On',
          value: resetTime,
          inline: false
        },
        {
          name: '📦 Evergreen Offerings',
          value: evergreenList || 'None',
          inline: false
        }
      )
      .setThumbnail(DISCORD_ICON.teshin)
      .setFooter({
        text: 'Steel Path Honors reset weekly. Rotation and prices sourced live from Warframe API.'
      });
  } catch (err) {
    await reportError('Failed to fetch Teshin rotation', err);
    return new EmbedBuilder()
      .setColor(DISCORD_COLOR.red)
      .setTitle('Teshin — Steel Path Honors')
      .setDescription('Unable to fetch Steel Path Honors at this time.')
      .setThumbnail(DISCORD_ICON.teshin);
  }
};

/**
 * Given a rotation and the current item name, returns the next item.
 */
function getNextRotatedItem(rotation: RotationItem[], currentName: string): RotationItem {
  const idx = rotation.findIndex(r => r.name === currentName);
  return rotation[(idx + 1) % rotation.length];
}
