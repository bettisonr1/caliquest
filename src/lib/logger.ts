import pino from 'pino'

// JSON to stdout in production (Amplify Hosting ships stdout straight to
// CloudWatch, no extra plumbing needed); pretty-printed for local dev.
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  transport:
    process.env.NODE_ENV === 'production'
      ? undefined
      : {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
        },
  serializers: { err: pino.stdSerializers.err },
})
