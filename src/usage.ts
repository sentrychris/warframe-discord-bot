import { EmbedBuilder, type Message } from "discord.js";
import { DISCORD_BOT_NAME, DISCORD_COLOR, DISCORD_ICON, DISCORD_PREFIX } from "./config";

export const usage = async (message: Message) => {
  if (
    message.content === `${DISCORD_PREFIX}`
    || message.content === `${DISCORD_PREFIX} help`
    || message.content === `${DISCORD_PREFIX} usage`
    || message.content === `${DISCORD_PREFIX} info`
    || message.content === `${DISCORD_PREFIX} ?`
  ) {
    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(DISCORD_COLOR.blue)
          .setTitle(`${DISCORD_BOT_NAME} Bot Usage`)
          .setDescription('Built with ❤️ by shikaricm. Source code [here](https://github.com/sentrychris/warframe-discord-bot).\n⠀\n')
          .addFields(
            {
              name: '`!wf baro`',
              value: 'Displays Baro Ki\'Teer\'s current location and arrival/departure times.\n⠀\n',
              inline: false
            },
            {
              name: '`!wf archon`',
              value: 'Displays this week\'s Archon Hunt mission.\n⠀\n',
              inline: false
            },
            {
              name: '`!wf sortie`',
              value: 'Displays today\'s Sortie missions, boss, faction, and modifiers.\n⠀\n',
              inline: false
            },
            {
              name: '`!wf invasions`',
              value: 'Displays active invasions, factions, prizes, and completion progress.\n⠀\n',
              inline: false
            },
            {
              name: '`!wf fissures`',
              value: 'Lists currently active Void Fissures grouped by relic era.\nOptional filter: `!wf fissures meso`\n⠀\n',
              inline: false
            },
            {
              name: '`!wf relics <item name>`',
              value: 'Finds all Void Relics that drop a specific item.\nExample: `!wf relics lex prime receiver`\n⠀\n',
              inline: false
            },
            {
              name: '`!wf drops <item name>`',
              value:
                'Finds top drop sources for an item across missions, bounties, sorties and other tables.\n' +
                'Example: `!wf drops critical delay`\n' +
                '`!wf drops planet <planet>` — list missions on a planet.\n' +
                '`!wf drops planet <planet> <node>` — show a node\'s reward rotations.\n⠀\n',
              inline: false
            },
            {
              name: '`!wf world`',
              value: 'Shows world cycles for Cetus, Cambion Drift and Orb Vallis.\nOptional filter: `!wf world cetus`\n⠀\n',
              inline: false
            },
            {
              name: '`!wf nightwave`',
              value: 'Shows the currently active Nightwave daily and weekly acts.\n⠀\n',
              inline: false
            },
            {
              name: '`!wf teshin`',
              value: 'Displays the active Steel Path Honors rotation from Teshin.\n⠀\n',
              inline: false
            },
            {
              name: '`!wf buy <item name>` or `!wf wtb <item name>`',
              value: 'Finds the cheapest sell order for a Warframe Market item.\nExample: `!wf buy frost prime set`',
              inline: false
            },
          )
          .setFooter({ text: 'Only online in-game sellers are shown in market lookups.' })
          .setThumbnail(DISCORD_ICON.clan)
      ]
    });
  }
};
