// Pure constants shared between the server (gyms.service.ts) and client
// (GymSuggestions.tsx) — no server-only imports here, unlike gyms.service.ts,
// so a client component can safely pull these in directly.
//
// Mirrors public.cast_gym_suggestion_vote in supabase/schema.sql. Kept in
// sync manually; display-only here — resolution (counting votes, applying
// the change, awarding points) always happens inside that security-definer
// function, never in application code.
export const CONTRIBUTOR_POINTS_PER_ACCEPTED_SUGGESTION = 5
export const SUGGESTION_APPROVE_THRESHOLD = 10
export const SUGGESTION_REJECT_THRESHOLD = 10
