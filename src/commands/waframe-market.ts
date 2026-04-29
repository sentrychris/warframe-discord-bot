import { EmbedBuilder } from 'discord.js';
import { DISCORD_COLOR, WARFRAME_MARKET_API } from '../config';
import { reportError } from '../error-reporter';

type SellOrder = {
  platinum: number;
  seller: string;
  quantity: number;
  region: string;
  rank?: number; // optional field
};

const getModThumbnailUrl = (itemName: string): string => {
  const modFileName = itemName
    .toLowerCase()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
  return `https://wiki.warframe.com/images/${modFileName}Mod.png`;
};

/**
 * Fetches the single cheapest current sell order for a given Warframe Market item slug
 * @param slug - Warframe Market item slug (e.g., "vitality" or "octavia_prime_neuroptics")
 * @returns The cheapest sell order or null
 */
export const getWarframeMarketCheapestSellOrder = async (slug: string): Promise<SellOrder | null> => {
  try {
    const response = await fetch(`${WARFRAME_MARKET_API}/orders/item/${slug}/top`, {
      headers: {
        'Accept': 'application/json',
        'Platform': 'pc',
        'Language': 'en',
      },
    });

    if (!response.ok) {
      await reportError('WFM API error', new Error(`${response.status} ${response.statusText}`));
      return null;
    }

    const json = await response.json();
    const sellOrders = json.data.sell
      .filter((order: any) => order.user.status === 'ingame')
      .sort((a: any, b: any) => a.platinum - b.platinum);

    if (sellOrders.length === 0) return null;

    const best = sellOrders[0];
    return {
      platinum: best.platinum,
      seller: best.user.ingameName,
      quantity: best.quantity,
      region: best.user.platform,
      rank: typeof best.rank === 'number' ? best.rank : undefined,
    };
  } catch (err) {
    await reportError('Failed to fetch cheapest sell order', err);
    return null;
  }
};

export const buildMarketPriceEmbed = (itemName: string, itemSlug: string, order: SellOrder): EmbedBuilder => {
  const whisper = `/w ${order.seller} Hi! I want to buy: "${itemName}" for ${order.platinum} platinum. (warframe.market)`;

  const fields = [
    { name: 'Platinum', value: `${order.platinum}p`, inline: true },
    {
      name: 'Seller',
      value: `[${order.seller}](https://warframe.market/profile/${encodeURIComponent(order.seller)})`,
      inline: true
    },
    { name: 'Quantity', value: `${order.quantity}`, inline: true },
  ];

  if (typeof order.rank === 'number') {
    fields.push({ name: 'Mod Rank', value: `${order.rank}`, inline: true });
  }

  fields.push({
    name: 'Copy & Paste Whisper',
    value: `\`${whisper}\``,
    inline: false,
  });

  const thumbnailUrl =
    typeof order.rank === 'number'
      ? getModThumbnailUrl(itemName)
      : 'https://warframe.market/static/build/resources/images/logo-black.3bec6a3a0f1e6f1edbb1.png';

  return new EmbedBuilder()
    .setColor(DISCORD_COLOR.purple)
    .setTitle(`Cheapest Sell Order: ${itemName}`)
    .setURL(`https://warframe.market/items/${itemSlug}`)
    .addFields(fields)
    .setThumbnail(thumbnailUrl)
    .setFooter({
      text: `Region: ${order.region} • Only sellers currently in-game • Source: www.warframe.market`,
    });
};
