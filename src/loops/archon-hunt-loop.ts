import type { TextChannel, Message } from 'discord.js';
import path from 'path';
import { buildArchonHuntEmbed } from '../commands/archon-hunt';
import { getFormattedTimestamp, loadStoredMessage, saveMessageReference } from '../util';

const TRACKING_FILE = path.join(__dirname, '../../storage/tracking/archon-hunt-message.json');

const INTERVAL_MINUTES = 10;

let message: Message | null = null;

export const setupArchonHuntLoop = async (channel: TextChannel) => {
  try {
    const stored = await loadStoredMessage(TRACKING_FILE);

    if (stored && stored.channelId === channel.id) {
      try {
        const existing = await channel.messages.fetch(stored.messageId);
        if (existing) {
          message = existing;
          console.log('Reusing previously posted Archon Hunt message.');
        }
      } catch {
        console.log('Stored Archon message not found; sending a new one.');
      }
    }

    if (!message) {
      message = await channel.send({
        embeds: [await buildArchonHuntEmbed({
          footer: `Message updates every ${INTERVAL_MINUTES} minutes. Last updated: ${getFormattedTimestamp()} UTC`
        })],
      });
      await saveMessageReference(TRACKING_FILE, channel.id, message.id);
    }

    scheduleNextUpdate();
  } catch (err) {
    console.error('Error setting up Archon Hunt updater:', err);
  }
};

const scheduleNextUpdate = () => {
  setTimeout(updateArchonMessage, INTERVAL_MINUTES * 60 * 1000);
};

const updateArchonMessage = async () => {
  if (!message) return;

  try {
    await message.edit({
      embeds: [await buildArchonHuntEmbed({
        footer: `Message updates every 5 minutes. Last updated: ${getFormattedTimestamp()} UTC`
      })]
    });
  } catch (err) {
    console.error('Failed to update Archon Hunt message:', err);
  }

  scheduleNextUpdate();
};
