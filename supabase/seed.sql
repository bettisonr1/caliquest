-- ============================================================
-- CaliQuest Seed Data
-- Run this after schema.sql
-- ============================================================

-- ============================================================
-- SKILLS
-- UUID scheme:
--   Pull     a000000N-0000-0000-0000-000000000000
--   Push     b000000N-0000-0000-0000-000000000000
--   Core     c000000N-0000-0000-0000-000000000000
--   Legs     d000000N-0000-0000-0000-000000000000
--   Mobility e000000N-0000-0000-0000-000000000000
-- ============================================================

insert into public.skills (id, name, description, muscle_group, difficulty, required_mg_xp, sort_order) values

  -- PULL
  ('a0000001-0000-0000-0000-000000000000', 'Dead Hang',               'Build grip and shoulder health by hanging from a bar.',                        'pull', 'beginner',     0,     1),
  ('a0000002-0000-0000-0000-000000000000', 'Scapular Pull-up',        'Activate your scapulae — the foundation of all pull strength.',                 'pull', 'beginner',     200,   2),
  ('a0000003-0000-0000-0000-000000000000', 'Negative Pull-up',        'Control the descent to build the strength needed for your first pull-up.',      'pull', 'beginner',     500,   3),
  ('a0000004-0000-0000-0000-000000000000', 'Pull-up',                 'The cornerstone of upper body pulling strength.',                               'pull', 'intermediate', 1000,  4),
  ('a0000005-0000-0000-0000-000000000000', 'Chest-to-bar Pull-up',    'Drive your chest to the bar — the gateway to muscle-ups.',                     'pull', 'intermediate', 3000,  5),
  ('a0000006-0000-0000-0000-000000000000', 'Archer Pull-up',          'One arm does the work — a stepping stone to the one-arm pull-up.',              'pull', 'advanced',     3000,  6),
  ('a0000007-0000-0000-0000-000000000000', 'Explosive Pull-up',       'Generate the power to clear the bar.',                                         'pull', 'advanced',     6000,  7),
  ('a0000008-0000-0000-0000-000000000000', 'One-Arm Negative',        'Slowly lower with one arm to build unilateral pulling strength.',               'pull', 'advanced',     8000,  8),
  ('a0000009-0000-0000-0000-000000000000', 'Muscle-up',               'The iconic skill — pull-up meets dip in one explosive movement.',               'pull', 'elite',        10000, 9),
  ('a000000a-0000-0000-0000-000000000000', 'One-Arm Pull-up',         'The pinnacle of relative pulling strength.',                                    'pull', 'elite',        15000, 10),

  -- PUSH
  ('b0000001-0000-0000-0000-000000000000', 'Knee Push-up',            'Build pushing mechanics and wrist strength from the ground up.',                'push', 'beginner',     0,     1),
  ('b0000002-0000-0000-0000-000000000000', 'Push-up',                 'Master full-body tension and chest-to-floor range of motion.',                  'push', 'beginner',     300,   2),
  ('b0000003-0000-0000-0000-000000000000', 'Archer Push-up',          'Shift your weight laterally — one arm carries the load.',                       'push', 'intermediate', 2000,  3),
  ('b0000004-0000-0000-0000-000000000000', 'Pike Push-up',            'Shift the load overhead — the first step toward handstand pressing.',           'push', 'intermediate', 2000,  4),
  ('b0000005-0000-0000-0000-000000000000', 'Dip',                     'The king of tricep and lower chest development.',                               'push', 'intermediate', 2000,  5),
  ('b0000006-0000-0000-0000-000000000000', 'One-Arm Push-up Negative','Control the descent on one arm to prepare for the full movement.',              'push', 'advanced',     5000,  6),
  ('b0000007-0000-0000-0000-000000000000', 'Elevated Pike Push-up',   'Hands elevated, hips high — approaching vertical pressing.',                    'push', 'advanced',     4000,  7),
  ('b0000008-0000-0000-0000-000000000000', 'Ring Dip',                'Dips on gymnastics rings demand stability and control.',                        'push', 'advanced',     5000,  8),
  ('b0000009-0000-0000-0000-000000000000', 'One-Arm Push-up',         'Full unilateral pressing — strength, balance, and coordination combined.',      'push', 'elite',        10000, 9),
  ('b000000a-0000-0000-0000-000000000000', 'Handstand Push-up',       'Press your bodyweight overhead from a handstand.',                              'push', 'elite',        12000, 10),

  -- CORE
  ('c0000001-0000-0000-0000-000000000000', 'Plank',                   'Build anterior core endurance and full-body tension.',                          'core', 'beginner',     0,     1),
  ('c0000002-0000-0000-0000-000000000000', 'Hollow Body Hold',        'The foundational gymnastics shape — everything flows from here.',               'core', 'beginner',     300,   2),
  ('c0000003-0000-0000-0000-000000000000', 'Tuck L-sit',              'Compress your body — knees to chest, off the ground.',                         'core', 'intermediate', 1000,  3),
  ('c0000004-0000-0000-0000-000000000000', 'Dragon Flag Negative',    'Lower your rigid body slowly — building the strength for dragon flags.',        'core', 'intermediate', 2000,  4),
  ('c0000005-0000-0000-0000-000000000000', 'L-sit (Floor)',           'Legs out, hips up — compression and tricep strength combined.',                 'core', 'intermediate', 2500,  5),
  ('c0000006-0000-0000-0000-000000000000', 'Dragon Flag',             'Full body rigid — one of the hardest core exercises in calisthenics.',          'core', 'advanced',     5000,  6),
  ('c0000007-0000-0000-0000-000000000000', 'L-sit (Parallettes)',     'Hold the L-sit on parallettes for maximum depth and compression.',              'core', 'advanced',     5000,  7),

  -- LEGS
  ('d0000001-0000-0000-0000-000000000000', 'Squat',                   'The foundation of all lower body strength.',                                    'legs', 'beginner',     0,     1),
  ('d0000002-0000-0000-0000-000000000000', 'Split Squat',             'Unilateral loading — balance and single-leg strength.',                         'legs', 'beginner',     400,   2),
  ('d0000003-0000-0000-0000-000000000000', 'Bulgarian Split Squat',   'Rear foot elevated — maximise range of motion and quad loading.',               'legs', 'intermediate', 1500,  3),
  ('d0000004-0000-0000-0000-000000000000', 'Assisted Pistol Squat',   'Use a pole or band to build the strength and mobility for the pistol.',         'legs', 'intermediate', 3000,  4),
  ('d0000005-0000-0000-0000-000000000000', 'Pistol Squat',            'Full depth single-leg squat — strength, balance, and mobility in one.',         'legs', 'advanced',     6000,  5),

  -- MOBILITY
  ('e0000001-0000-0000-0000-000000000000', 'Bridge',                  'Open the thoracic spine and shoulders — foundation of back mobility.',          'mobility', 'beginner',     0,     1),
  ('e0000002-0000-0000-0000-000000000000', 'Shoulder Dislocates',     'Improve shoulder mobility with a band or dowel — essential prehab.',            'mobility', 'beginner',     0,     2),
  ('e0000003-0000-0000-0000-000000000000', 'Full Bridge',             'Hands and feet on the floor — full spinal extension and shoulder opening.',     'mobility', 'intermediate', 1500,  3),
  ('e0000004-0000-0000-0000-000000000000', 'German Hang',             'Hang in shoulder extension — unlocks the back lever pathway.',                  'mobility', 'intermediate', 1500,  4);

-- ============================================================
-- SKILL PREREQUISITES
-- ============================================================

insert into public.skill_prerequisites (skill_id, prerequisite_skill_id) values

  -- Pull chain
  ('a0000002-0000-0000-0000-000000000000', 'a0000001-0000-0000-0000-000000000000'), -- Scapular   ← Dead Hang
  ('a0000003-0000-0000-0000-000000000000', 'a0000002-0000-0000-0000-000000000000'), -- Negative   ← Scapular
  ('a0000004-0000-0000-0000-000000000000', 'a0000003-0000-0000-0000-000000000000'), -- Pull-up    ← Negative
  ('a0000005-0000-0000-0000-000000000000', 'a0000004-0000-0000-0000-000000000000'), -- C2B        ← Pull-up
  ('a0000006-0000-0000-0000-000000000000', 'a0000004-0000-0000-0000-000000000000'), -- Archer     ← Pull-up
  ('a0000007-0000-0000-0000-000000000000', 'a0000005-0000-0000-0000-000000000000'), -- Explosive  ← C2B
  ('a0000008-0000-0000-0000-000000000000', 'a0000006-0000-0000-0000-000000000000'), -- OA Neg     ← Archer
  ('a0000009-0000-0000-0000-000000000000', 'a0000007-0000-0000-0000-000000000000'), -- Muscle-up  ← Explosive
  ('a000000a-0000-0000-0000-000000000000', 'a0000008-0000-0000-0000-000000000000'), -- OA Pull-up ← OA Neg

  -- Push chain
  ('b0000002-0000-0000-0000-000000000000', 'b0000001-0000-0000-0000-000000000000'), -- Push-up    ← Knee push-up
  ('b0000003-0000-0000-0000-000000000000', 'b0000002-0000-0000-0000-000000000000'), -- Archer     ← Push-up
  ('b0000004-0000-0000-0000-000000000000', 'b0000002-0000-0000-0000-000000000000'), -- Pike       ← Push-up
  ('b0000005-0000-0000-0000-000000000000', 'b0000002-0000-0000-0000-000000000000'), -- Dip        ← Push-up
  ('b0000006-0000-0000-0000-000000000000', 'b0000003-0000-0000-0000-000000000000'), -- OA Neg     ← Archer
  ('b0000007-0000-0000-0000-000000000000', 'b0000004-0000-0000-0000-000000000000'), -- Elev Pike  ← Pike
  ('b0000008-0000-0000-0000-000000000000', 'b0000005-0000-0000-0000-000000000000'), -- Ring Dip   ← Dip
  ('b0000009-0000-0000-0000-000000000000', 'b0000006-0000-0000-0000-000000000000'), -- OA Push-up ← OA Neg
  ('b000000a-0000-0000-0000-000000000000', 'b0000007-0000-0000-0000-000000000000'), -- HSPU       ← Elev Pike

  -- Core chain
  ('c0000002-0000-0000-0000-000000000000', 'c0000001-0000-0000-0000-000000000000'), -- Hollow     ← Plank
  ('c0000003-0000-0000-0000-000000000000', 'c0000002-0000-0000-0000-000000000000'), -- Tuck L-sit ← Hollow
  ('c0000004-0000-0000-0000-000000000000', 'c0000002-0000-0000-0000-000000000000'), -- DF Neg     ← Hollow
  ('c0000005-0000-0000-0000-000000000000', 'c0000003-0000-0000-0000-000000000000'), -- L-sit      ← Tuck L-sit
  ('c0000006-0000-0000-0000-000000000000', 'c0000004-0000-0000-0000-000000000000'), -- Dragon Flg ← DF Neg
  ('c0000007-0000-0000-0000-000000000000', 'c0000005-0000-0000-0000-000000000000'), -- L-sit Par  ← L-sit Floor

  -- Legs chain
  ('d0000002-0000-0000-0000-000000000000', 'd0000001-0000-0000-0000-000000000000'), -- Split      ← Squat
  ('d0000003-0000-0000-0000-000000000000', 'd0000002-0000-0000-0000-000000000000'), -- Bulgarian  ← Split
  ('d0000004-0000-0000-0000-000000000000', 'd0000003-0000-0000-0000-000000000000'), -- Assisted   ← Bulgarian
  ('d0000005-0000-0000-0000-000000000000', 'd0000004-0000-0000-0000-000000000000'), -- Pistol     ← Assisted

  -- Mobility chain
  ('e0000003-0000-0000-0000-000000000000', 'e0000001-0000-0000-0000-000000000000'), -- Full Bridge    ← Bridge
  ('e0000004-0000-0000-0000-000000000000', 'e0000002-0000-0000-0000-000000000000'); -- German Hang    ← Shoulder Disc

-- ============================================================
-- EXERCISES
-- UUID scheme:
--   Pull exercises     a100000N-0000-0000-0000-000000000000
--   Push exercises     b100000N-0000-0000-0000-000000000000
--   Core exercises     c100000N-0000-0000-0000-000000000000
--   Legs exercises     d100000N-0000-0000-0000-000000000000
--   Mobility exercises e100000N-0000-0000-0000-000000000000
-- ============================================================

insert into public.exercises (id, name, muscle_group, difficulty_multiplier, skill_id, type) values

  -- PULL exercises
  ('a1000001-0000-0000-0000-000000000000', 'Dead Hang',               'pull', 1, 'a0000001-0000-0000-0000-000000000000', 'duration'),
  ('a1000002-0000-0000-0000-000000000000', 'Scapular Pull-up',        'pull', 1, 'a0000002-0000-0000-0000-000000000000', 'reps'),
  ('a1000003-0000-0000-0000-000000000000', 'Negative Pull-up',        'pull', 1, 'a0000003-0000-0000-0000-000000000000', 'reps'),
  ('a1000004-0000-0000-0000-000000000000', 'Pull-up',                 'pull', 2, 'a0000004-0000-0000-0000-000000000000', 'reps'),
  ('a1000005-0000-0000-0000-000000000000', 'Chin-up',                 'pull', 2, 'a0000004-0000-0000-0000-000000000000', 'reps'),
  ('a1000006-0000-0000-0000-000000000000', 'Chest-to-bar Pull-up',    'pull', 3, 'a0000005-0000-0000-0000-000000000000', 'reps'),
  ('a1000007-0000-0000-0000-000000000000', 'Archer Pull-up',          'pull', 3, 'a0000006-0000-0000-0000-000000000000', 'reps'),
  ('a1000008-0000-0000-0000-000000000000', 'Explosive Pull-up',       'pull', 3, 'a0000007-0000-0000-0000-000000000000', 'reps'),
  ('a1000009-0000-0000-0000-000000000000', 'One-Arm Negative Pull-up','pull', 3, 'a0000008-0000-0000-0000-000000000000', 'reps'),
  ('a100000a-0000-0000-0000-000000000000', 'Muscle-up',               'pull', 4, 'a0000009-0000-0000-0000-000000000000', 'reps'),
  ('a100000b-0000-0000-0000-000000000000', 'One-Arm Pull-up',         'pull', 4, 'a000000a-0000-0000-0000-000000000000', 'reps'),

  -- PUSH exercises
  ('b1000001-0000-0000-0000-000000000000', 'Knee Push-up',            'push', 1, 'b0000001-0000-0000-0000-000000000000', 'reps'),
  ('b1000002-0000-0000-0000-000000000000', 'Push-up',                 'push', 2, 'b0000002-0000-0000-0000-000000000000', 'reps'),
  ('b1000003-0000-0000-0000-000000000000', 'Wide Push-up',            'push', 2, 'b0000002-0000-0000-0000-000000000000', 'reps'),
  ('b1000004-0000-0000-0000-000000000000', 'Diamond Push-up',         'push', 2, 'b0000002-0000-0000-0000-000000000000', 'reps'),
  ('b1000005-0000-0000-0000-000000000000', 'Archer Push-up',          'push', 3, 'b0000003-0000-0000-0000-000000000000', 'reps'),
  ('b1000006-0000-0000-0000-000000000000', 'Pike Push-up',            'push', 2, 'b0000004-0000-0000-0000-000000000000', 'reps'),
  ('b1000007-0000-0000-0000-000000000000', 'Dip',                     'push', 2, 'b0000005-0000-0000-0000-000000000000', 'reps'),
  ('b1000008-0000-0000-0000-000000000000', 'One-Arm Push-up Negative','push', 3, 'b0000006-0000-0000-0000-000000000000', 'reps'),
  ('b1000009-0000-0000-0000-000000000000', 'Elevated Pike Push-up',   'push', 3, 'b0000007-0000-0000-0000-000000000000', 'reps'),
  ('b100000a-0000-0000-0000-000000000000', 'Ring Dip',                'push', 3, 'b0000008-0000-0000-0000-000000000000', 'reps'),
  ('b100000b-0000-0000-0000-000000000000', 'One-Arm Push-up',         'push', 4, 'b0000009-0000-0000-0000-000000000000', 'reps'),
  ('b100000c-0000-0000-0000-000000000000', 'Wall Handstand Push-up',  'push', 3, 'b000000a-0000-0000-0000-000000000000', 'reps'),
  ('b100000d-0000-0000-0000-000000000000', 'Handstand Push-up',       'push', 4, 'b000000a-0000-0000-0000-000000000000', 'reps'),

  -- CORE exercises
  ('c1000001-0000-0000-0000-000000000000', 'Plank',                   'core', 1, 'c0000001-0000-0000-0000-000000000000', 'duration'),
  ('c1000002-0000-0000-0000-000000000000', 'Hollow Body Hold',        'core', 1, 'c0000002-0000-0000-0000-000000000000', 'duration'),
  ('c1000003-0000-0000-0000-000000000000', 'Tuck L-sit',              'core', 2, 'c0000003-0000-0000-0000-000000000000', 'duration'),
  ('c1000004-0000-0000-0000-000000000000', 'Dragon Flag Negative',    'core', 3, 'c0000004-0000-0000-0000-000000000000', 'reps'),
  ('c1000005-0000-0000-0000-000000000000', 'L-sit (Floor)',           'core', 2, 'c0000005-0000-0000-0000-000000000000', 'duration'),
  ('c1000006-0000-0000-0000-000000000000', 'Dragon Flag',             'core', 4, 'c0000006-0000-0000-0000-000000000000', 'reps'),
  ('c1000007-0000-0000-0000-000000000000', 'L-sit (Parallettes)',     'core', 3, 'c0000007-0000-0000-0000-000000000000', 'duration'),

  -- LEGS exercises
  ('d1000001-0000-0000-0000-000000000000', 'Squat',                   'legs', 1, 'd0000001-0000-0000-0000-000000000000', 'reps'),
  ('d1000002-0000-0000-0000-000000000000', 'Jump Squat',              'legs', 2, 'd0000001-0000-0000-0000-000000000000', 'reps'),
  ('d1000003-0000-0000-0000-000000000000', 'Split Squat',             'legs', 1, 'd0000002-0000-0000-0000-000000000000', 'reps'),
  ('d1000004-0000-0000-0000-000000000000', 'Bulgarian Split Squat',   'legs', 2, 'd0000003-0000-0000-0000-000000000000', 'reps'),
  ('d1000005-0000-0000-0000-000000000000', 'Assisted Pistol Squat',   'legs', 2, 'd0000004-0000-0000-0000-000000000000', 'reps'),
  ('d1000006-0000-0000-0000-000000000000', 'Pistol Squat',            'legs', 3, 'd0000005-0000-0000-0000-000000000000', 'reps'),

  -- MOBILITY exercises
  ('e1000001-0000-0000-0000-000000000000', 'Bridge',                  'mobility', 1, 'e0000001-0000-0000-0000-000000000000', 'reps'),
  ('e1000002-0000-0000-0000-000000000000', 'Shoulder Dislocate',      'mobility', 1, 'e0000002-0000-0000-0000-000000000000', 'reps'),
  ('e1000003-0000-0000-0000-000000000000', 'Full Bridge Hold',        'mobility', 2, 'e0000003-0000-0000-0000-000000000000', 'duration'),
  ('e1000004-0000-0000-0000-000000000000', 'German Hang',             'mobility', 2, 'e0000004-0000-0000-0000-000000000000', 'duration');
