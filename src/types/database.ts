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
