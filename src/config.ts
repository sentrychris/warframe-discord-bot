import { config } from 'dotenv';
import { Client, GatewayIntentBits } from 'discord.js';

config();

const client = new Client({
  intents: [
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const WARFRAME_API = <string>process.env.WARFRAME_API ?? 'https://api.warframestat.us/pc';
const WARFRAME_DROPS_API = <string>process.env.WARFRAME_DROPS_API ?? 'https://drops.warframestat.us/data/all.json';
const WARFRAME_MARKET_API = <string>process.env.WARFRAME_MARKET_API ?? 'https://api.warframe.market/v2';

const DISCORD_BOT_NAME = <string>process.env.DISCORD_BOT_NAME ?? 'Warframe Helper';

const DISCORD_COLOR = {
  blue: 0x3498DB,
  purple: 0x9B59B6,
  orange: 0xE67E22,
  red: 0xFF0000
};

const DISCORD_ICON = {
  clan: <string>process.env.CLAN_ICON ?? 'https://i.imgur.com/fQn9zNL.png',
  baro: 'https://wiki.warframe.com/images/thumb/TennoCon2020BaroCropped.png/300px-TennoCon2020BaroCropped.png',
  item: 'https://wiki.warframe.com/images/Resource_Orange.png',
  nightwave: 'https://wiki.warframe.com/images/thumb/NightwaveSyndicate.png/300px-NightwaveSyndicate.png',
  relic: 'https://wiki.warframe.com/images/thumb/VoidRelicPack.png/300px-VoidRelicPack.png',
  sortie: 'https://wiki.warframe.com/images/Sortie_b.png',
  teshin: 'https://wiki.warframe.com/images/Teshin.png',
  void: 'https://wiki.warframe.com/images/thumb/VoidRelicPack.png/300px-VoidRelicPack.png'
}

const DISCORD_PREFIX = <string>process.env.DISCORD_PREFIX ?? '!wf';

const FOUNDING_WARLORD_USER_ID = <string>process.env.FOUNDING_WARLORD_USER_ID;
const CLAN_ANNOUNCEMENTS_CHANNEL_ID = <string>process.env.CLAN_ANNOUNCEMENTS_CHANNEL_ID;
const WARFRAME_LIVE_INFO_CHANNEL_ID = <string>process.env.WARFRAME_LIVE_INFO_CHANNEL_ID;

const BOT_ERRORS_CHANNEL_ID = <string>process.env.BOT_ERRORS_CHANNEL_ID;

export {
  client,
  WARFRAME_API,
  WARFRAME_DROPS_API,
  WARFRAME_MARKET_API,
  DISCORD_BOT_NAME,
  DISCORD_COLOR,
  DISCORD_ICON,
  DISCORD_PREFIX,
  FOUNDING_WARLORD_USER_ID,
  CLAN_ANNOUNCEMENTS_CHANNEL_ID,
  WARFRAME_LIVE_INFO_CHANNEL_ID,
  BOT_ERRORS_CHANNEL_ID
};
 