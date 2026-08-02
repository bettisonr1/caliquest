export type MuscleGroup = 'push' | 'pull' | 'core' | 'legs' | 'mobility'
export type Difficulty  = 'beginner' | 'intermediate' | 'advanced' | 'elite'
export type ExerciseType = 'reps' | 'duration'
export type SkillStatus = 'unlocked' | 'in_progress' | 'locked'

export type Profile = {
  user_id:        string
  username:       string
  avatar_url:     string | null
  total_xp:       number
  level:          number
  prestige_tier:  string
  streak_days:    number
  last_workout_at: string | null
  onboarded_at:   string | null
  onboarding_xp:  number
}

export type MuscleGroupXP = {
  user_id:      string
  muscle_group: MuscleGroup
  xp:           number
}

export type Skill = {
  id:             string
  name:           string
  description:    string | null
  muscle_group:   MuscleGroup
  difficulty:     Difficulty
  required_mg_xp: number
  sort_order:     number
}

export type SkillPrerequisite = {
  skill_id:              string
  prerequisite_skill_id: string
}

export type SkillWithStatus = Skill & {
  status:           SkillStatus
  prerequisite_ids: string[]
  user_mg_xp:       number
  is_recorded:      boolean
}

export type Exercise = {
  id:                    string
  name:                  string
  description:           string | null
  muscle_group:          MuscleGroup
  difficulty_multiplier: number
  skill_id:              string | null
  type:                  ExerciseType
}

export type Workout = {
  id:           string
  user_id:      string
  started_at:   string
  completed_at: string | null
  total_xp:     number
  notes:        string | null
  gym_id:       string | null
}

export type WorkoutSet = {
  id:               string
  workout_id:       string
  exercise_id:      string
  reps:             number | null
  duration_seconds: number | null
  xp_earned:        number
}

export type WorkoutSetWithExercise = WorkoutSet & {
  exercises: Exercise | null
}

export type WorkoutWithSets = Workout & {
  workout_sets: WorkoutSetWithExercise[]
}

export type WorkoutFistbump = {
  workout_id: string
  user_id:    string
  created_at: string
}

export type WorkoutWithBumps = WorkoutWithSets & {
  workout_fistbumps: Pick<WorkoutFistbump, 'user_id'>[]
}

// target_count is base XP to earn in target_muscle_group within duration_days;
// xp_reward is the completion bonus (0.5 × target → 1.5× total on completion).
export type Quest = {
  id:                  string
  title:               string
  description:         string | null
  target_exercise_id:  string | null
  target_muscle_group: MuscleGroup | null
  target_count:        number
  xp_reward:           number
  duration_days:       number
  is_active:           boolean
  user_id:             string | null
  guru_name:           string | null
  guru_persona:        string | null
  guru_greeting:       string | null
}

export type UserQuestStatus = 'active' | 'completed' | 'expired'

export type UserQuest = {
  id:           string
  user_id:      string
  quest_id:     string
  progress:     number
  started_at:   string
  completed_at: string | null
  expires_at:   string | null
  bonus_xp:     number
  status:       UserQuestStatus
}

export type UserQuestWithQuest = UserQuest & {
  quests: Quest
}

export type FriendshipStatus = 'pending' | 'accepted'

export type Friendship = {
  id:           string
  requester_id: string
  addressee_id: string
  status:       FriendshipStatus
  created_at:   string
  responded_at: string | null
}

export type PublicProfile = Pick<Profile, 'user_id' | 'username' | 'avatar_url'>

// ------------------------------------------------------------
// Gym Finder
// ------------------------------------------------------------
export type GymSource = 'osm' | 'user'
export type GymStatus = 'unverified' | 'verified'

export type GymEquipment = {
  horizontal_bar?:  boolean
  parallel_bars?:   boolean
  rings?:           boolean
  wall_bars?:       boolean
  push_up_bars?:    boolean
  [key: string]: boolean | undefined
}

export type Gym = {
  id:         string
  name:       string | null
  source:     GymSource
  osm_id:     number | null
  equipment:  GymEquipment
  status:     GymStatus
  created_by: string | null
  created_at: string
}

// Shape returned by the gyms_near RPC — coordinates pulled out of
// PostGIS server-side so the client never parses geography types.
export type NearbyGym = {
  id:         string
  name:       string | null
  lat:        number
  lng:        number
  distance_m: number
  status:     GymStatus
  equipment:  GymEquipment
}

// Returned by name search — same shape minus distance (no reference point).
export type GymSearchResult = Omit<NearbyGym, 'distance_m'>

export type GymReview = {
  gym_id:     string
  user_id:    string
  rating:     number
  comment:    string | null
  created_at: string
}

export type GymReviewWithProfile = GymReview & {
  profile: PublicProfile | null
}

export type GymTier = 'Rumored Spot' | 'Spot' | 'Yard' | 'Forge' | 'Dojo' | 'Temple'
export type GymRank = 'Visitor' | 'Local' | 'Regular' | 'Legend'

export type GymLeaderboardEntry = {
  user_id:       string
  workout_count: number
  rank:          GymRank | null
  profile:       PublicProfile | null
}

export type PassportEntry = {
  gym_id:        string
  gym_name:      string | null
  workout_count: number
  rank:          GymRank
}
