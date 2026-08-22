import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bettisonr1.caliquest',
  appName: 'CaliQuest',
  server: {
    // Points at the `prod` Amplify branch deployment, not `main` — so the
    // native/TestFlight shell only picks up changes once they're deliberately
    // promoted from `main` to `prod`, instead of on every merge to `main`.
    // Verify this matches the URL Amplify actually assigns once the `prod`
    // branch is connected in the Amplify console (Hosting > branch settings).
    url: 'https://prod.d320math2cife8.amplifyapp.com',
    cleartext: false,
  },
};

export default config;
