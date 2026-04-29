import { EmbedBuilder } from 'discord.js';
import { DISCORD_COLOR, WARFRAME_API } from '../config';
import { reportError } from '../error-reporter';

const getProgressBar = (percent: number, size = 20): string => {
  const clamped = Math.min(Math.max(percent, 0), 100); // clamp 0–100
  const filledBlocks = Math.round((clamped / 100) * size);
  const emptyBlocks = size - filledBlocks;
  return '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
};

export const buildConstructionProgressEmbed = async (): Promise<EmbedBuilder> => {
  try {
    const res = await fetch(`${WARFRAME_API}/constructionProgress?lang=en`);
    const data = await res.json();

    const fomorian = parseFloat(data.fomorianProgress);
    const razorback = parseFloat(data.razorbackProgress);

    const fomorianBar = getProgressBar(fomorian);
    const razorbackBar = getProgressBar(razorback);

    const embed = new EmbedBuilder()
      .setColor(DISCORD_COLOR.orange)
      .setTitle('Grineer vs Corpus — Construction Progress')
      .setDescription('⚙️ Ongoing efforts to rebuild the Fomorian Fleet and Razorback Armada.')
      .addFields(
        {
          name: 'Balor Fomorian (Grineer)',
          value: `${fomorian.toFixed(2)}%\n\`${fomorianBar}\``,
          inline: false,
        },
        {
          name: 'Razorback Armada (Corpus)',
          value: `${razorback.toFixed(2)}%\n\`${razorbackBar}\``,
          inline: false,
        }
      )
      .setFooter({
        text: 'Source: warframestat.us — Invasion constructions complete at 100%',
      });

    return embed;
  } catch (err) {
    await reportError('Failed to fetch construction progress', err);
    return new EmbedBuilder()
      .setColor(DISCORD_COLOR.red)
      .setTitle('Construction Progress')
      .setDescription('Unable to fetch construction progress at this time.');
  }
};
