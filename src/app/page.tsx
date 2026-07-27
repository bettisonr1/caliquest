import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-white">
          Cali<span className="text-emerald-400">Quest</span>
        </h1>
        <p className="text-gray-400 mt-3">
          Level up your calisthenics. Log workouts, earn XP, and unlock new skills.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/signup"
            className="px-5 py-2.5 rounded-lg bg-emerald-500 text-gray-950 text-sm font-semibold hover:bg-emerald-400 transition-colors"
          >
            Start your quest
          </Link>
          <Link
            href="/login"
            className="px-5 py-2.5 rounded-lg bg-gray-800 text-gray-200 text-sm font-semibold hover:bg-gray-700 transition-colors"
          >
            Log in
          </Link>
        </div>
      </div>
    </main>
  )
}
