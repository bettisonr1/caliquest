import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — CaliQuest',
  description: 'What CaliQuest collects, why, and how to delete it.',
}

// Public, unauthenticated route (see src/middleware.ts) — this is the URL
// that goes in App Store Connect for Guideline 5.1.1. Deploy it at a stable
// path; if a custom domain is set up later (see APP_STORE_DEPLOYMENT.md §3),
// this page moves with it automatically since it's part of the app, not a
// separately hosted doc.
const LAST_UPDATED = '14 August 2026'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-bold text-white">{title}</h2>
      <div className="text-sm text-gray-400 space-y-2 leading-relaxed">{children}</div>
    </section>
  )
}

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-2xl mx-auto px-4 py-10 pt-[calc(env(safe-area-inset-top)+2.5rem)] pb-[calc(env(safe-area-inset-bottom)+2.5rem)] space-y-8">
        <div>
          <Link href="/" className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
            ← Cali<span className="font-semibold">Quest</span>
          </Link>
          <h1 className="text-2xl font-bold text-white mt-4">Privacy Policy</h1>
          <p className="text-xs text-gray-500 mt-1">Last updated {LAST_UPDATED}</p>
        </div>

        <Section title="What this is">
          <p>
            CaliQuest (&quot;we&quot;, &quot;us&quot;) is a gamified calisthenics training app. This
            policy covers the CaliQuest app and website and describes what account and training
            data we collect, why, and how you can get it deleted.
          </p>
        </Section>

        <Section title="Data we collect">
          <p><strong className="text-gray-300">Account data:</strong> your email address (used only for sign-in), and a username and avatar you choose.</p>
          <p><strong className="text-gray-300">Training data:</strong> workouts you log — exercises, reps/duration, and the XP they earn — plus which skills you&apos;ve unlocked and which quests you&apos;ve accepted or completed.</p>
          <p><strong className="text-gray-300">Social data:</strong> friend connections, squad memberships, squad wall posts, and fist-bumps you give or receive. These are visible to the friends/squadmates the feature is built around, never to the public.</p>
          <p><strong className="text-gray-300">Location:</strong> only if you use the gym finder or tag a workout to a gym, and only after your device prompts you for location permission. We use it to show nearby gyms; we don&apos;t store a location history.</p>
          <p><strong className="text-gray-300">Voice input:</strong> if you use voice logging to record a workout, the audio is sent to a transcription service (see below) to turn it into text, then discarded — we don&apos;t keep the audio.</p>
        </Section>

        <Section title="AI features">
          <p>
            Some features send limited data to third-party AI providers to work: the AI training
            partner (&quot;Guru&quot;) chat and personalized quest generation send your recent training
            summary and chat messages to Anthropic (Claude); voice workout logging sends the audio
            clip to OpenAI (Whisper) for transcription, then the transcript to Anthropic to extract
            structured sets. We don&apos;t send your email address or other account identifiers to
            these providers, and they don&apos;t use your data to train their models under our
            agreements with them.
          </p>
        </Section>

        <Section title="Who processes your data">
          <p>
            Your data is stored with Supabase (database and authentication) and the app is hosted
            on AWS Amplify. AI features use Anthropic and OpenAI as described above. We don&apos;t
            use third-party advertising or analytics/tracking SDKs, and we don&apos;t sell your data.
          </p>
        </Section>

        <Section title="Deleting your data">
          <p>
            You can permanently delete your account and everything tied to it — training history,
            skills, quests, friendships, and squad memberships — at any time from{' '}
            <Link href="/profile" className="text-emerald-400 hover:underline">
              Profile → Danger zone
            </Link>
            . This is immediate and can&apos;t be undone. A gym or squad you created stays available
            for other members, but is no longer attributed to you.
          </p>
        </Section>

        <Section title="Children">
          <p>CaliQuest isn&apos;t directed at children and isn&apos;t intended for use by anyone under 13.</p>
        </Section>

        <Section title="Changes to this policy">
          <p>If this policy changes materially, we&apos;ll update the date above.</p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about this policy or your data:{' '}
            <a href="mailto:support@caliquest.app" className="text-emerald-400 hover:underline">
              support@caliquest.app
            </a>
          </p>
        </Section>
      </div>
    </main>
  )
}
