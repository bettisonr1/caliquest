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

export type Squad = {
  id:           string
  name:         string
  description:  string | null
  gym_name:     string | null
  meeting_info: string | null
  created_by:   string | null
  created_at:   string
}

export type SquadRole = 'leader' | 'member'
export type SquadMemberStatus = 'invited' | 'active'

export type SquadMember = {
  squad_id:   string
  user_id:    string
  role:       SquadRole
  status:     SquadMemberStatus
  invited_by: string | null
  created_at: string
  joined_at:  string | null
}

export type SquadMembershipWithSquad = SquadMember & {
  squads: Squad
}

export type SquadMemberWithProfile = SquadMember & {
  profile: Profile
}

export type SquadPost = {
  id:              string
  squad_id:        string
  author_id:       string
  content:         string
  is_announcement: boolean
  created_at:      string
}

export type SquadPostWithAuthor = SquadPost & {
  author: PublicProfile | null
}

export type NotificationType = 'squad_announcement' | 'squad_invite'

export type Notification = {
  id:         string
  user_id:    string
  type:       NotificationType
  squad_id:   string | null
  post_id:    string | null
  message:    string
  read_at:    string | null
  created_at: string
}
