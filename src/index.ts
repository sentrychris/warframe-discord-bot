import type { Message, TextChannel } from 'discord.js';

import { usage } from './usage';
import { setupWorldCycleLoop } from './loops/world-cycle-loop';
import { setupSortieMissionLoop } from './loops/sortie-mission-loop';
import { setupArchonHuntLoop } from './loops/archon-hunt-loop';
import { buildBaroKiteerLocationEmbed } from './commands/baro-kiteer';
import { buildNightwaveEmbed } from './commands/nightwave-alerts';
import { buildVoidFissuresEmbed } from './commands/void-fissures';
import { buildWorldCyclesEmbed } from './commands/world-cycles';
import { buildSortieMissionEmbed } from './commands/sortie-mission';
import { buildArchonHuntEmbed } from './commands/archon-hunt';
import { buildInvasionsEmbed } from './commands/invasions';
import { buildRelicDropsEmbed } from './commands/relic-lookup';
import { buildItemDropsEmbed } from './commands/mission-drops';
import { buildTeshinRotationEmbed } from './commands/teshin-rotation';
import { buildConstructionProgressEmbed } from './commands/fleet-construction';
import { buildMarketPriceEmbed, getWarframeMarketCheapestSellOrder } from './commands/waframe-market';
import {
  client,
  DISCORD_PREFIX,
  WARFRAME_LIVE_INFO_CHANNEL_ID
} from './config';
  
client.on('ready', async () => {
  const channel = await client.channels.fetch(WARFRAME_LIVE_INFO_CHANNEL_ID);
  if (!channel || !channel.isTextBased()) {
    console.error('Warframe live info channel is invalid or not text-based.');
    return;
  }
  const textChannel = channel as TextChannel;

  console.log('Client is ready. Setting up loops...');
  await setupWorldCycleLoop(textChannel);
  await setupSortieMissionLoop(textChannel);
  await setupArchonHuntLoop(textChannel);
});
  
client.on('messageCreate', async (message: Message) => {
  if (!message.content.startsWith(DISCORD_PREFIX) || message.author.bot) {
    return;
  }

  /**
   * Command prefix e.g. `!wf`
   */
  const PREFIX_REGEX = DISCORD_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // escape for regex

  /**
   * Show bot usage
   */
  await usage(message);

  /**
   * Show Baro Ki'Teer current location and arrival/departure times
   */
  if (message.content === `${DISCORD_PREFIX} baro` || message.content === `${DISCORD_PREFIX} vt`) {
    return message.reply({ embeds: [await buildBaroKiteerLocationEmbed()] });
  }

  /**
   * Show Nightwave active daily and weekly alerts
   */
  if (message.content === `${DISCORD_PREFIX} nightwave` || message.content === `${DISCORD_PREFIX} nw`) {
    return message.reply({ embeds: [await buildNightwaveEmbed()] });
  }

  /**
   * Show active Void Fissures. Optional filter by era/tier
   */
  if (message.content.startsWith(`${DISCORD_PREFIX} fissures`) || message.content.startsWith(`${DISCORD_PREFIX} vf`)) {
    const parts = message.content.trim().split(/\s+/);
    const tierFilter = parts.length > 2 ? parts.slice(2).join(' ') : parts[1];

    const knownTiers = ['Lith', 'Meso', 'Neo', 'Axi', 'Requiem'];
    const isTier = tierFilter && knownTiers.some(t => t.toLowerCase() === tierFilter.toLowerCase());

    return message.reply({ embeds: [await buildVoidFissuresEmbed(isTier ? tierFilter : undefined)] });
  }

  /**
   * Show current cycles for Cetus, Cambion Drift and Orb Vallis
   */
  if (new RegExp(`^${PREFIX_REGEX}\\s+(world|wc)(\\s+.+)?$`, 'i').test(message.content)) {
    const match = message.content.match(new RegExp(`^${PREFIX_REGEX}\\s+(world|wc)(?:\\s+(.+))?`, 'i'));
    let filter = match?.[2]?.trim().toLowerCase();

    if (filter) {
      if (filter.includes('orb') || filter.includes('vallis')) filter = 'vallis';
      else if (filter.includes('deimos') || filter.includes('cambion')) filter = 'cambion';
      else if (filter.includes('earth') || filter.includes('cetus')) filter = 'cetus';
      else filter = undefined;
    }

    const embed = await buildWorldCyclesEmbed({ filter });
    return message.reply({ embeds: Array.isArray(embed) ? embed : [embed] });
  }

  /**
   * Show active Sortie mission
   */
  if (message.content === `${DISCORD_PREFIX} sortie`) {
    return message.reply({ embeds: [await buildSortieMissionEmbed()] });
  }

  /**
   * Show active Archon Hunt mission
   */
  if (message.content === `${DISCORD_PREFIX} archon`) {
    return message.reply({ embeds: [await buildArchonHuntEmbed()] });
  }

  /**
   * Show active Invasions
   */
  if (message.content === `${DISCORD_PREFIX} invasion` || message.content === `${DISCORD_PREFIX} invasions`) {
    return message.reply({ embeds: [await buildInvasionsEmbed()] });
  }

  /**
   * Show current SP Honors rotation and evergreen offerings from Teshin
   */
  if (message.content === `${DISCORD_PREFIX} teshin` || message.content === `${DISCORD_PREFIX} sp`) {
    return message.reply({ embeds: [await buildTeshinRotationEmbed()] });
  }

  /**
   * Show cheapest current sell-order for given item
   */
  if (new RegExp(`^${PREFIX_REGEX}\\s+(buy|wtb)\\s+`, 'i').test(message.content)) {
    const query = message.content.replace(new RegExp(`^${PREFIX_REGEX}\\s+(buy|wtb)\\s+`, 'i'), '').trim();
    const slug = query.toLowerCase().replace(/\s+/g, '_');
    const displayName = query.replace(/\s+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    const order = await getWarframeMarketCheapestSellOrder(slug);

    if (!order) {
      return message.reply(`No active sell orders found for **${displayName}**.`);
    }

    return message.reply({ embeds: [buildMarketPriceEmbed(displayName, slug, order)] });
  }

  /**
   * Show relics for given item with best refinement level and drop chance
   */
  if (new RegExp(`^${PREFIX_REGEX}\\s+(relics|relic)\\s+`, 'i').test(message.content)) {
    const query = message.content.replace(new RegExp(`^${PREFIX_REGEX}\\s+(relics|relic)\\s+`, 'i'), '').trim();
    if (!query) {
      return message.reply(`Specify the item you want to look up in relics. Example: \`${DISCORD_PREFIX} relics trinity prime systems\``);
    }

    return message.reply({ embeds: [await buildRelicDropsEmbed(query)] });
  }

  /**
   * Show mission drop rewards or item drop sources.
   */
  if (new RegExp(`^${PREFIX_REGEX}\\s+drops\\s+`, 'i').test(message.content)) {
    const args = message.content.trim().split(/\s+/).slice(2);

    return message.reply({ embeds: [await buildItemDropsEmbed(args)] });
  }

  /**
   * Show construction progress for the Formorian Fleet and Razorback Armada
   */
  if (message.content === `${DISCORD_PREFIX} construction` || message.content === `${DISCORD_PREFIX} fleets`) {
    return message.reply({ embeds: [await buildConstructionProgressEmbed()] });
  }
});
  
client.login(<string>process.env.DISCORD_AUTH_TOKEN);