import { EmbedBuilder } from 'discord.js';
import { DISCORD_COLOR, DISCORD_ICON, WARFRAME_API } from '../config';

const formatDuration = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return days > 0 ? `${days}d ${hours}h ${minutes}m` : `${hours}h ${minutes}m`;
};

/**
 * Fetches Baro Ki'Teer's location and returns an embed.
 */
export const buildBaroKiteerLocationEmbed = async (): Promise<EmbedBuilder> => {
  try {
    const res = await fetch(`${WARFRAME_API}/voidTrader?lang=en`);
    const data = await res.json();

    const embed = new EmbedBuilder()
      .setColor(DISCORD_COLOR.orange)
      .setTitle("Baro Ki'Teer - Void Trader")
      .setThumbnail(DISCORD_ICON.baro);

    const now = Date.now();
    const activationMs = new Date(data.activation).getTime();
    const expiryMs = new Date(data.expiry).getTime();
    const isActive = now >= activationMs && now < expiryMs;

    if (isActive) {
      embed.setDescription(`**Baro Ki'Teer** is currently at **${data.location}** and will depart in **${formatDuration(expiryMs - now)}**.`);
    } else {
      embed.setDescription(`**Baro Ki'Teer** will arrive at **${data.location}** in **${formatDuration(activationMs - now)}**.`);
    }

    return embed;
  } catch (err) {
    console.error(err);
    return new EmbedBuilder()
      .setColor(DISCORD_COLOR.red)
      .setTitle("Baro Ki'Teer - Void Trader")
      .setDescription("Unable to fetch Baro Ki'Teer info right now.")
      .setThumbnail(DISCORD_ICON.baro);
  }
};