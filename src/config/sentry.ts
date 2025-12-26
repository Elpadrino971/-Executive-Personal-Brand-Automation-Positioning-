import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

export const initializeSentry = () => {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: 1.0,
      profilesSampleRate: 1.0,
      integrations: [
        new ProfilingIntegration(),
      ],
    });

    console.log('Sentry initialized');
  }
};

export default Sentry;
