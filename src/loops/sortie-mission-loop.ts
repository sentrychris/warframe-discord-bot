import type { TextChannel, Message } from 'discord.js';
import path from 'path';
import { buildSortieMissionEmbed } from '../commands/sortie-mission';
import { getFormattedTimestamp, loadStoredMessage, saveMessageReference } from '../util';

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
          console.log('Reusing previously posted sortie message.');
        }
      } catch {
        console.log('Stored sortie message not found; sending a new one.');
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
    console.error('Error setting up sortie updater:', err);
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
    console.error('Failed to update sortie message:', err);
  }

  scheduleNextUpdate();
};
