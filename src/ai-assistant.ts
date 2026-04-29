import type { Message } from 'discord.js';

import {
  DISCORD_BOT_NAME,
  DISCORD_PREFIX,
  OPENAI_API_KEY,
  OPENAI_BASE_URL,
  OPENAI_MAX_OUTPUT_TOKENS,
  AI_MODEL,
  OPENAI_TIMEOUT_MS
} from './config';

type ChatCompletionResponse = {
  error?: {
    message?: string;
  };
  choices?: {
    message?: {
      content?: string;
    };
  }[];
};

const AI_INSTRUCTIONS = [
  `You are ${DISCORD_BOT_NAME}, a helpful Discord bot strictly for Warframe players.`,
  'When asked which LLM you are running, you should respond with the exact name of the LLM you are running (it is also stored in the AI_MODEL environment variable).',
  'You only answer questions about Warframe. If a message is not related to Warframe, politely decline and remind the user you are a Warframe-only bot.',
  'Answer naturally and concisely in Discord-friendly plain text and address people with Waframe-esque terms such as Tenno.',
  'Keep replies under 1500 characters unless the user explicitly asks for detail.',
  `For Warframe data, suggest using the bot help command - ${DISCORD_PREFIX} help to list available commands.`,
  'Do not claim to know current live prices, timers, rotations, or alerts unless the user provides them in the message.',
].join('\n');

const DISCORD_REPLY_LIMIT = 1900;

export const getMentionPrompt = (message: Message): string => {
  const botId = message.client.user?.id;
  if (!botId) return message.content.trim();

  return message.content
    .replace(new RegExp(`<@!?${botId}>`, 'g'), '')
    .trim();
};

export const buildAiReply = async (message: Message): Promise<string> => {
  const prompt = getMentionPrompt(message);
  if (!prompt) {
    return `Ask me something after the mention, like \`@${DISCORD_BOT_NAME} what should I farm today?\``;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  try {
    const response = await fetch(`${OPENAI_BASE_URL.replace(/\/+$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY ?? 'ollama'}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: 'system', content: AI_INSTRUCTIONS },
          {
            role: 'user',
            content: [
              `Discord display name: ${message.author.displayName}`,
              `Discord username: ${message.author.username}`,
              `Message: ${prompt}`,
            ].join('\n'),
          },
        ],
        max_completion_tokens: OPENAI_MAX_OUTPUT_TOKENS,
      }),
      signal: controller.signal,
    });

    const body = await response.json().catch(() => ({})) as ChatCompletionResponse;

    if (!response.ok) {
      throw new Error(body.error?.message ?? `Request failed with status ${response.status}`);
    }

    const reply = body.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      throw new Error('Response did not include text output.');
    }

    return fitDiscordReply(reply);
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw new Error('AI request timed out.');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
};

const fitDiscordReply = (reply: string): string => {
  const normalized = reply.trim();
  if (normalized.length <= DISCORD_REPLY_LIMIT) return normalized;

  return `${normalized.slice(0, DISCORD_REPLY_LIMIT - 3).trimEnd()}...`;
};
