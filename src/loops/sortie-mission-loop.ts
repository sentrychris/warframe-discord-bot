import type { TextChannel, Message } from 'discord.js';
import path from 'path';
import { buildSortieMissionEmbed } from '../commands/sortie-mission';
import { getFormattedTimestamp, loadStoredMessage, saveMessageReference } from '../util';
import { logger } from '../logger';
import { reportError } from '../error-reporter';

const TRACKING_FILE = path.join(__dirname, '../../storage/tracking/sortie-mission-message.json');

const INTERVAL_MINUTES = 10;

let message: Message | null = null;

export const setupSortieMissionLoop = async (channel: TextChannel) => {
  try {
    const stored = await loadStoredMessage(TRACKING_FILE);

    if (stored && stored.channelId === channel.id) {
      try {
        const existing = await channel.messages.fetch(stored.messageId);
        if (existing) {
          message = existing;
          logger.info('Reusing previously posted sortie message.');
        }
      } catch {
        logger.info('Stored sortie message not found; sending a new one.');
      }
    }

    if (!message) {
      message = await channel.send({
        embeds: [await buildSortieMissionEmbed({
          footer: `Message updates every ${INTERVAL_MINUTES} minutes. Last updated: ${getFormattedTimestamp()} UTC`
        })],
      });
      await saveMessageReference(TRACKING_FILE, channel.id, message.id);
    }

    scheduleNextUpdate();
  } catch (err) {
    await reportError('Error setting up sortie updater', err);
  }
};

const scheduleNextUpdate = () => {
  setTimeout(updateSortieMessage, INTERVAL_MINUTES * 60 * 1000);
};

const updateSortieMessage = async () => {
  if (!message) return;

  try {
    await message.edit({
      embeds: [await buildSortieMissionEmbed({
        footer: `Message updates every 5 minutes. Last updated: ${getFormattedTimestamp()} UTC`
      })]
    });
  } catch (err) {
    await reportError('Failed to update sortie message', err);
  }

  scheduleNextUpdate();
};
