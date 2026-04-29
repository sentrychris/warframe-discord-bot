import path from 'path';
import pino from 'pino';

const LOG_FILE = path.join(__dirname, '../storage/logs/app.log');
const isDev = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport: {
    targets: [
      isDev
        ? { target: 'pino-pretty', level: 'info', options: {} }
        : { target: 'pino/file', level: 'info', options: { destination: 1 } },
      { target: 'pino/file', level: 'info', options: { destination: LOG_FILE, append: true } },
    ],
  },
});
