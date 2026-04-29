declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production';
      WARFRAME_API: string;
      WARFRAME_DROPS_API: string;
      WARFRAME_MARKET_API: string;
      CLAN_ICON: string;
      DISCORD_BOT_NAME: string;
      DISCORD_PREFIX: string;
      DISCORD_AUTH_TOKEN: string;
      FOUNDING_WARLORD_USER_ID: string;
      CLAN_ANNOUNCEMENTS_CHANNEL_ID: string;
      WARFRAME_LIVE_INFO_CHANNEL_ID: string;
      BOT_ERRORS_CHANNEL_ID: string;
    }
  }
}

export {}
