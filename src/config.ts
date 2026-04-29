import { config } from 'dotenv';
import { Client, GatewayIntentBits, Partials } from 'discord.js';

config();

const client = new Client({
  intents: [
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel],
});

const numberFromEnv = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const WARFRAME_API = <string>process.env.WARFRAME_API ?? 'https://api.warframestat.us/pc';
const WARFRAME_DROPS_API = <string>process.env.WARFRAME_DROPS_API ?? 'https://drops.warframestat.us/data/all.json';
const WARFRAME_MARKET_API = <string>process.env.WARFRAME_MARKET_API ?? 'https://api.warframe.market/v2';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL ?? 'http://localhost:11434/v1';
const AI_MODEL = process.env.AI_MODEL ?? 'llama3.2:3b';
const OPENAI_MAX_OUTPUT_TOKENS = numberFromEnv(process.env.OPENAI_MAX_OUTPUT_TOKENS, 600);
const OPENAI_TIMEOUT_MS = numberFromEnv(process.env.OPENAI_TIMEOUT_MS, 30000);

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
  OPENAI_API_KEY,
  OPENAI_BASE_URL,
  AI_MODEL,
  OPENAI_MAX_OUTPUT_TOKENS,
  OPENAI_TIMEOUT_MS,
  DISCORD_BOT_NAME,
  DISCORD_COLOR,
  DISCORD_ICON,
  DISCORD_PREFIX,
  FOUNDING_WARLORD_USER_ID,
  CLAN_ANNOUNCEMENTS_CHANNEL_ID,
  WARFRAME_LIVE_INFO_CHANNEL_ID,
  BOT_ERRORS_CHANNEL_ID
};
 
