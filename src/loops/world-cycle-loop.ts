import type { TextChannel, Message } from 'discord.js';
import path from 'path';
import { buildWorldCyclesEmbed } from '../commands/world-cycles';
import { getFormattedTimestamp, loadStoredMessage, saveMessageReference } from '../util';
import { logger } from '../logger';
import { reportError } from '../error-reporter';

const TRACKING_FILE = path.join(__dirname, '../../storage/tracking/world-cycles-message.json');

const INTERVAL_MINUTES = 10;

let message: Message | null = null;

export const setupWorldCycleLoop = async (channel: TextChannel) => {
  try {
    const stored = await loadStoredMessage(TRACKING_FILE);

    if (stored && stored.channelId === channel.id) {
      try {
        const existing = await channel.messages.fetch(stored.messageId);
        if (existing) {
          message = existing;
          logger.info('Reusing previously posted world cycle message.');
        }
      } catch {
        logger.info('Stored message not found; sending a new one.');
      }
    }

    if (!message) {
      const embed = await buildWorldCyclesEmbed({
        footer: `Message updates every ${INTERVAL_MINUTES} minutes. Last updated: ${getFormattedTimestamp()} UTC`
      });
      message = await channel.send({
        embeds: Array.isArray(embed) ? embed : [embed],
      });
      await saveMessageReference(TRACKING_FILE, channel.id, message.id);
    }

    updateLoop();
  } catch (err) {
    await reportError('Error setting up world cycle updater', err);
  }
};

const updateLoop = async () => {
  if (!message) return;

  try {
    const newEmbed = await buildWorldCyclesEmbed({
      footer: `Message updates every 10 minutes. Last updated: ${getFormattedTimestamp()} UTC`
    });
    await message.edit({
      embeds: Array.isArray(newEmbed) ? newEmbed : [newEmbed],
    });
  } catch (err) {
    await reportError('Failed to update world cycle message', err);
  }

  setTimeout(updateLoop, INTERVAL_MINUTES * 60 * 1000);
};
