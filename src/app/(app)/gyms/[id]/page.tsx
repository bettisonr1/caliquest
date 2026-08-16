import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, MapPin, Navigation, Plus, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getGymDetail } from '@/lib/services/gyms.service'
import { getUpcomingCompetitionsForGym } from '@/lib/services/competitions.service'
import { getProfile } from '@/lib/repositories/profiles.repository'
import { TierBadge } from '@/components/gyms/TierBadge'
import { RankBadge } from '@/components/gyms/RankBadge'
import { OsmAttribution } from '@/components/gyms/OsmAttribution'
import { GymSuggestions } from '@/components/gyms/GymSuggestions'
import { ReviewForm } from '@/components/gyms/ReviewForm'
import { CompetitionCard } from '@/components/competitions/CompetitionCard'

function humanizeEquipmentKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m away`
  return `${(meters / 1000).toFixed(1)} km away`
}

export default async function GymDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ distance_m?: string }>
}) {
  const { id } = await params
  const { distance_m } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [detail, profile, upcomingCompetitions] = await Promise.all([
    getGymDetail(id, user.id),
    getProfile(supabase, user.id),
    getUpcomingCompetitionsForGym(id),
  ])

  if (!detail) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="rounded-2xl border border-dashed border-gray-700 p-12 text-center">
          <p className="text-gray-400 font-medium">This gym isn&apos;t available</p>
          <Link
            href="/gyms"
            className="inline-flex items-center gap-1.5 mt-4 text-sm text-emerald-400 font-medium hover:text-emerald-300"
          >
            <ArrowLeft className="h-4 w-4" /> Back to gyms
          </Link>
        </div>
      </div>
    )
  }

  const { gym, lat, lng, tier, reviewCount, avgRating, reviews, viewerReview, leaderboard, suggestions } = detail
  const displayName = gym.name ?? `Spot near ${lat.toFixed(3)}, ${lng.toFixed(3)}`
  const equipmentEntries = Object.entries(gym.equipment).filter(([, v]) => v)
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
  const distanceMeters = distance_m ? Number(distance_m) : null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/gyms"
        className="inline-flex items-center gap-1.5 py-2 -my-2 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Gyms
      </Link>

      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-white truncate">{displayName}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <TierBadge tier={tier} />
              {gym.status === 'unverified' && (
                <span className="text-xs text-gray-500">Community-submitted, not yet verified</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 text-sm text-gray-400">
          {distanceMeters !== null && !Number.isNaN(distanceMeters) && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {formatDistance(distanceMeters)}
            </span>
          )}
          {reviewCount > 0 && (
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              {avgRating.toFixed(1)} ({reviewCount} review{reviewCount === 1 ? '' : 's'})
            </span>
          )}
        </div>

        {equipmentEntries.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {equipmentEntries.map(([key]) => (
              <span
                key={key}
                className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-300"
              >
                {humanizeEquipmentKey(key)}
              </span>
            ))}
          </div>
        )}

        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-emerald-500 text-gray-950 text-sm font-semibold hover:bg-emerald-400 transition-colors"
        >
          <Navigation className="h-4 w-4" /> Directions
        </a>

        {gym.source === 'osm' && (
          <div className="mt-4">
            <OsmAttribution />
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">Upcoming Competitions</h2>
          <Link
            href={`/competitions/add?gymId=${gym.id}`}
            className="flex items-center gap-1 py-2 -my-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </Link>
        </div>
        {upcomingCompetitions.length === 0 ? (
          <p className="text-sm text-gray-500">No upcoming competitions at this gym yet.</p>
        ) : (
          <div className="space-y-2">
            {upcomingCompetitions.map(c => (
              <CompetitionCard key={c.id} id={c.id} name={c.name} imageUrl={c.image_url} startAt={c.start_at} />
            ))}
          </div>
        )}
      </div>

      {leaderboard.length > 0 && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-3">Leaderboard</h2>
          <ul className="space-y-2">
            {leaderboard.map((entry, i) => (
              <li key={entry.user_id} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2.5 min-w-0">
                  <span className="w-5 text-xs text-gray-500 font-medium shrink-0">{i + 1}</span>
                  <span className="text-sm text-white truncate">
                    {entry.profile?.username ?? 'Anonymous'}
                  </span>
                  {entry.rank && <RankBadge rank={entry.rank} />}
                </span>
                <span className="text-xs text-gray-400 shrink-0">
                  {entry.workout_count} workout{entry.workout_count === 1 ? '' : 's'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <GymSuggestions
        gymId={gym.id}
        gym={gym}
        suggestions={suggestions}
        viewerId={user.id}
        isAdmin={profile.is_admin}
      />

      <ReviewForm
        gymId={gym.id}
        existingReview={viewerReview ? { rating: viewerReview.rating, comment: viewerReview.comment } : null}
      />

      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
        <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-3">
          Reviews {reviewCount > 0 && `(${reviewCount})`}
        </h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-gray-500">No reviews yet — be the first.</p>
        ) : (
          <ul className="space-y-4">
            {reviews.map(review => (
              <li key={review.user_id} className="pb-4 border-b border-gray-800 last:border-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-white">
                    {review.profile?.username ?? 'Anonymous'}
                  </span>
                  <span className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(n => (
                      <Star
                        key={n}
                        className={`h-3.5 w-3.5 ${n <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-700'}`}
                      />
                    ))}
                  </span>
                </div>
                {review.comment && <p className="text-sm text-gray-400 mt-1">{review.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
