import { EmbedBuilder, TextChannel } from 'discord.js';
import { client, BOT_ERRORS_CHANNEL_ID, DISCORD_COLOR } from './config';
import { logger } from './logger';

export const reportError = async (context: string, err: unknown): Promise<void> => {
  logger.error({ err }, context);

  if (!BOT_ERRORS_CHANNEL_ID || !client.isReady()) return;

  try {
    const channel = await client.channels.fetch(BOT_ERRORS_CHANNEL_ID);
    if (!channel?.isTextBased()) return;

    const message = err instanceof Error
      ? `${err.message}${err.stack ? `\n${err.stack}` : ''}`
      : String(err);

    await (channel as TextChannel).send({
      embeds: [
        new EmbedBuilder()
          .setColor(DISCORD_COLOR.red)
          .setTitle('Bot Error')
          .addFields({ name: 'Context', value: context })
          .setDescription(`\`\`\`${message.slice(0, 1900)}\`\`\``)
          .setTimestamp(),
      ],
    });
  } catch {
    // don't recurse
  }
};
