import { EmbedBuilder } from 'discord.js';
import { DISCORD_COLOR, WARFRAME_API } from '../config';

const WORLD_ICON = {
  cetus: 'https://wiki.warframe.com/images/thumb/Cetus.png/300px-Cetus.png',
  vallis: 'https://wiki.warframe.com/images/thumb/Orb_Vallis.png/300px-Orb_Vallis.png',
  cambion: 'https://wiki.warframe.com/images/thumb/CambionDrift.jpg/300px-CambionDrift.jpg',
};

/**
 * Format time difference as hh mm ss
 */
const getEndsIn = (expiry: string): string => {
  const ms = new Date(expiry).getTime() - Date.now();
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
};

// Game-constant cycle durations (seconds). Used to advance past stale upstream data.
const CYCLE_DURATIONS_S = {
  cetus: { day: 6000, night: 3000 },
  cambion: { fass: 6000, vome: 3000 },
  vallis: { warm: 400, cold: 1200 },
};

/**
 * If the API's expiry has already passed, advance through alternating phases until
 * we land in the future. The warframestat per-cycle endpoints can lag behind real
 * time, especially Vallis (~26 min total cycle).
 */
const rollForward = (
  expiryISO: string,
  state: string,
  durations: Record<string, number>
): { expiry: string; state: string } => {
  const phases = Object.keys(durations);
  let exp = new Date(expiryISO).getTime();
  let s = state.toLowerCase();
  while (exp <= Date.now()) {
    s = phases.find(p => p !== s) ?? s;
    exp += durations[s] * 1000;
  }
  return { expiry: new Date(exp).toISOString(), state: s };
};

/**
 * Shared embed builder
 */
const buildEmbed = (
  title: string,
  currCycle: string,
  endsIn: string,
  icon: string,
  color: number,
  footer: string
): EmbedBuilder => {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription('Current world cycle')
    .addFields(
      { name: 'Time', value: currCycle, inline: true },
      { name: 'Ends In', value: endsIn, inline: true }
    )
    .setThumbnail(icon)
    .setFooter({ text: footer });
}

/**
 * Combined embed with optional filtering
 */
export const buildWorldCyclesEmbed = async (
  { filter, title, footer }: {filter?: string, title?: string, footer?: string} = {}
): Promise<EmbedBuilder | EmbedBuilder[]> => {
  const [cetusRes, cambionRes, vallisRes] = await Promise.all([
    fetch(`${WARFRAME_API}/cetusCycle?lang=en`).then(res => res.json()),
    fetch(`${WARFRAME_API}/cambionCycle?lang=en`).then(res => res.json()),
    fetch(`${WARFRAME_API}/vallisCycle?lang=en`).then(res => res.json())
  ]);

  const cetus = rollForward(cetusRes.expiry, cetusRes.state, CYCLE_DURATIONS_S.cetus);
  const cambion = rollForward(cambionRes.expiry, cambionRes.state, CYCLE_DURATIONS_S.cambion);
  const vallis = rollForward(vallisRes.expiry, vallisRes.state, CYCLE_DURATIONS_S.vallis);

  const cetusTime = cetus.state === 'day' ? '☀️ ⠀Day' : '🌙 ⠀Night';
  const cambionTime = cambion.state === 'fass' ? '🔶 ⠀Fass' : '🔷 ⠀Vome';
  const vallisTime = vallis.state === 'cold' ? '❄️ ⠀Cold' : '🔥 ⠀Warm';

  const cetusEnds = getEndsIn(cetus.expiry);
  const cambionEnds = getEndsIn(cambion.expiry);
  const vallisEnds = getEndsIn(vallis.expiry);

  const embedTitle = title ?? 'World Cycles';
  const defaultFooter = 'Source: warframestat.us — World cycle times are UTC-based.\n';
  const embedFooter = footer ? defaultFooter + footer : defaultFooter;

  const lcFilter = filter?.toLowerCase();
  if (lcFilter === 'cetus') {
    return buildEmbed('Cetus/Earth', cetusTime, cetusEnds, WORLD_ICON.cetus, DISCORD_COLOR.orange, embedFooter);
  }

  if (lcFilter === 'cambion') {
    return buildEmbed('Cambion Drift', cambionTime, cambionEnds, WORLD_ICON.cambion, DISCORD_COLOR.red, embedFooter);
  }

  if (lcFilter === 'vallis' || lcFilter === 'orb vallis') {
    return buildEmbed('Orb Vallis', vallisTime, vallisEnds, WORLD_ICON.vallis, DISCORD_COLOR.blue, embedFooter);
  }

  return new EmbedBuilder()
    .setColor(DISCORD_COLOR.purple)
    .setTitle(embedTitle)
    .setDescription('Current day/night and weather cycles across open worlds')
    .addFields(
      { name: 'Cetus (Earth)', value: `${cetusTime}\nEnds in ${cetusEnds}`, inline: true },
      { name: 'Cambion Drift (Deimos)', value: `${cambionTime}\nEnds in ${cambionEnds}`, inline: true },
      { name: 'Orb Vallis (Venus)', value: `${vallisTime}\nEnds in ${vallisEnds}`, inline: true }
    )
    .setThumbnail(WORLD_ICON.cetus)
    .setFooter({ text: embedFooter });
};
