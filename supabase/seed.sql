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
-- (N counts up in hex past 9 — a, b, c, ... 10, 11 — rather than
-- restarting a new prefix, so the whole tree stays sorted by group.)
-- ============================================================

insert into public.skills (id, name, description, muscle_group, difficulty, required_mg_xp, sort_order, form_cues) values

  -- PULL
  ('a0000001-0000-0000-0000-000000000000', 'Dead Hang',               'Build grip and shoulder health by hanging from a bar.',                        'pull', 'beginner',     0,     1,
    ARRAY['Shoulders pulled down and back, not shrugged up to your ears.', 'Ribs stacked over hips — resist the urge to arch or sway.', 'Grip is firm but relaxed; you should feel it in your forearms and lats, not your neck.']),
  ('a000000b-0000-0000-0000-000000000000', 'Inverted Row',            'Pull your chest to a low bar with your body straight — the horizontal half of pulling strength.', 'pull', 'beginner',     0,     2,
    ARRAY['Body forms one straight line from heels to shoulders — no sagging hips.', 'Pull your chest to the bar by driving your elbows down and back, not just bending the arms.', 'Squeeze your shoulder blades together at the top and pause for a beat.']),
  ('a0000002-0000-0000-0000-000000000000', 'Scapular Pull-up',        'Activate your scapulae — the foundation of all pull strength.',                 'pull', 'beginner',     200,   3,
    ARRAY['Arms stay straight the whole time — the movement comes from your shoulder blades, not your elbows.', 'Pull your shoulders down and together like you are putting them in your back pockets.', 'Small range of motion is normal — an inch of clean movement beats six inches of swinging.']),
  ('a0000003-0000-0000-0000-000000000000', 'Negative Pull-up',        'Control the descent to build the strength needed for your first pull-up.',      'pull', 'beginner',     500,   4,
    ARRAY['Start with chin over the bar and lower yourself as slowly as you can manage.', 'Keep your core braced so your legs do not kick or swing on the way down.', 'Aim for a smooth, even descent — a shaky drop near the bottom means you are rushing it.']),
  ('a0000004-0000-0000-0000-000000000000', 'Pull-up',                 'The cornerstone of upper body pulling strength.',                               'pull', 'intermediate', 1000,  5,
    ARRAY['Start from a dead hang — full extension at the bottom, every rep.', 'Drive your elbows down toward your hips rather than just curling your arms.', 'Chin clears the bar without craning your neck forward to reach it.']),
  ('a0000005-0000-0000-0000-000000000000', 'Chest-to-bar Pull-up',    'Drive your chest to the bar — the gateway to muscle-ups.',                     'pull', 'intermediate', 3000,  6,
    ARRAY['Pull your elbows back and down, not just up, so your chest leads to the bar.', 'Keep your body fairly upright — an aggressive arch is a shortcut, not good form.', 'Full lockout at the bottom between every rep, even when it is tempting to kip.']),
  ('a0000006-0000-0000-0000-000000000000', 'Archer Pull-up',          'One arm does the work — a stepping stone to the one-arm pull-up.',              'pull', 'advanced',     3000,  7,
    ARRAY['Working arm pulls straight up while the extended arm stays long and relaxed.', 'Keep your hips and shoulders square to the bar — do not let your torso rotate to cheat the pull.', 'Chin reaches the working hand, not the middle of the bar.']),
  ('a0000010-0000-0000-0000-000000000000', 'Tuck Back Lever',         'Invert under the bar with your knees tucked to your chest — your first taste of levers.', 'pull', 'intermediate', 3500,  8,
    ARRAY['Shoulders stay pulled down and slightly in front of the bar, not directly under it.', 'Round your lower back gently and keep your knees tucked tight to your chest.', 'Hold a full-body squeeze — a lever is a plank, not a passive hang.']),
  ('a000000c-0000-0000-0000-000000000000', 'Tuck Front Lever',        'Pull your hips up and tuck your knees to your chest, hanging horizontal below the bar.', 'pull', 'intermediate', 4000,  9,
    ARRAY['Arms straight, shoulders pulled down and back — no bend at the elbow to cheat the lever.', 'Round your lower back slightly and keep your knees pulled tight into your chest.', 'Point your hips up toward the bar rather than letting them sag toward the floor.']),
  ('a0000007-0000-0000-0000-000000000000', 'Explosive Pull-up',       'Generate the power to clear the bar.',                                         'pull', 'advanced',     6000,  10,
    ARRAY['Drive explosively from a dead hang — the power comes from your lats, not a kip or swing.', 'Keep your body rigid through the pull; flailing legs are wasted energy.', 'Control the landing back to a hang instead of dropping into it.']),
  ('a0000011-0000-0000-0000-000000000000', 'Straddle Back Lever',     'Legs spread wide and straight, hips open, holding the inverted lever position.', 'pull', 'advanced',     6500,  11,
    ARRAY['Legs straight and wide enough that your hips stay open and relaxed.', 'Shoulders stay pulled down hard — that is what keeps you from folding.', 'Point your toes and keep tension through your whole body, not just your arms.']),
  ('a000000d-0000-0000-0000-000000000000', 'Advanced Tuck Front Lever', 'Extend your hips flat while keeping a tight tuck — the bridge to a straddle front lever.', 'pull', 'advanced',     7000,  12,
    ARRAY['Hips and torso are flat and horizontal — only the knees stay tucked.', 'Keep pulling your shoulder blades down; a front lever is won in the shoulders, not the arms.', 'Brace your abs hard so your lower back does not sag toward the floor.']),
  ('a0000008-0000-0000-0000-000000000000', 'One-Arm Negative',        'Slowly lower with one arm to build unilateral pulling strength.',               'pull', 'advanced',     8000,  13,
    ARRAY['Start from chin-over-bar and use your free hand only lightly for balance.', 'Lower with total control — a fast drop in the last few inches means you lost tension, not that you finished the rep.', 'Keep your body square to the bar instead of twisting to help the working side.']),
  ('a000000e-0000-0000-0000-000000000000', 'Straddle Front Lever',    'Legs spread wide and straight, torso flat and horizontal below the bar.',       'pull', 'advanced',     9000,  14,
    ARRAY['Legs pressed straight and wide — the wider the straddle, the easier the hold.', 'Torso and hips stay flat as a board, not sagging or piking at the waist.', 'Keep driving your shoulders down and back the entire hold, not just on entry.']),
  ('a0000009-0000-0000-0000-000000000000', 'Muscle-up',               'The iconic skill — pull-up meets dip in one explosive movement.',               'pull', 'elite',        10000, 15,
    ARRAY['Pull high and let your chest drive over the bar rather than muscling through with your arms alone.', 'Transition happens fast — hesitating at the top of the pull makes the turnover harder, not easier.', 'Finish with a full lockout at the top like a strict dip, not a half-pressed shrug.']),
  ('a0000012-0000-0000-0000-000000000000', 'Full Back Lever',         'Legs together and straight, body a rigid horizontal line beneath the bar.',     'pull', 'elite',        11000, 16,
    ARRAY['Legs together and fully straight — the toughest lever position for most people to hold rigid.', 'Keep your whole body braced as one unit — a lever with a bent knee or a sagging hip is not a lever.', 'Shoulders pulled down and slightly forward of the bar to keep the line straight.']),
  ('a000000f-0000-0000-0000-000000000000', 'Full Front Lever',        'Legs together and straight, body a rigid horizontal line below the bar — one of the hardest static holds in calisthenics.', 'pull', 'elite',        13000, 17,
    ARRAY['Legs together, fully straight, and pointed — no bend anywhere in the line.', 'Body stays flat from shoulders to toes; a piked hip is the first thing to go when you are tired.', 'Keep breathing — holding your breath makes the tension harder to control, not easier.']),
  ('a000000a-0000-0000-0000-000000000000', 'One-Arm Pull-up',         'The pinnacle of relative pulling strength.',                                    'pull', 'elite',        15000, 18,
    ARRAY['Pull with your body square to the bar — do not let your hips or shoulders rotate to cheat the pull.', 'Drive your elbow down and back like a normal pull-up, just with one arm doing all the work.', 'Full extension at the bottom before every rep — partial reps are not the same skill.']),

  -- PUSH
  ('b0000001-0000-0000-0000-000000000000', 'Knee Push-up',            'Build pushing mechanics and wrist strength from the ground up.',                'push', 'beginner',     0,     1,
    ARRAY['Body forms a straight line from knees to head — no sagging or piking at the hips.', 'Hands stack under your shoulders, elbows track back at roughly 45 degrees, not flared to the sides.', 'Lower until your chest is close to the floor, then press back to a full lockout.']),
  ('b000000b-0000-0000-0000-000000000000', 'Wall Handstand Hold',     'Kick up to a handstand against a wall and hold — the foundation of all overhead pressing and balance.', 'push', 'beginner',     0,     2,
    ARRAY['Squeeze your whole body tight — a loose handstand is a falling handstand.', 'Push the floor away through your fingertips and shoulders, do not just hang on your wrists.', 'Stack wrists, shoulders, and hips in one line rather than banana-arching against the wall.']),
  ('b0000002-0000-0000-0000-000000000000', 'Push-up',                 'Master full-body tension and chest-to-floor range of motion.',                  'push', 'beginner',     300,   3,
    ARRAY['Whole body stays rigid from heels to head, like a plank that presses.', 'Elbows track back at roughly 45 degrees rather than flaring straight out to the sides.', 'Chest brushes the floor at the bottom and arms fully lock out at the top.']),
  ('b0000003-0000-0000-0000-000000000000', 'Archer Push-up',          'Shift your weight laterally — one arm carries the load.',                       'push', 'intermediate', 2000,  4,
    ARRAY['Working arm bends and presses while the extended arm stays straight and light.', 'Hips stay square to the floor — do not let them twist to unload the working side.', 'Chest lowers toward the working hand, not the middle of your chest.']),
  ('b0000004-0000-0000-0000-000000000000', 'Pike Push-up',            'Shift the load overhead — the first step toward handstand pressing.',           'push', 'intermediate', 2000,  5,
    ARRAY['Hips stay high, close to a right angle at the waist, throughout the rep.', 'Head travels toward the floor between your hands, not out in front of them.', 'Press through your whole arm evenly rather than shifting your weight forward onto your toes.']),
  ('b0000005-0000-0000-0000-000000000000', 'Dip',                     'The king of tricep and lower chest development.',                               'push', 'intermediate', 2000,  6,
    ARRAY['Lean forward slightly and let your elbows flare a little to load the chest, or stay upright for triceps — pick one and stay consistent.', 'Lower until your shoulders dip just below your elbows, no lower if your shoulders start rolling forward.', 'Press to a full, controlled lockout at the top every rep.']),
  ('b000000d-0000-0000-0000-000000000000', 'Planche Lean',            'Shift your weight forward over your hands from a push-up position — the entry point to planche training.', 'push', 'intermediate', 2500,  7,
    ARRAY['Protract your shoulder blades hard — round your upper back rather than pinching it.', 'Keep your arms straight and lean only as far forward as you can control without your hips sagging.', 'Point your fingers forward and press the floor away the whole time, not just at the start.']),
  ('b0000007-0000-0000-0000-000000000000', 'Elevated Pike Push-up',   'Hands elevated, hips high — approaching vertical pressing.',                    'push', 'advanced',     4000,  8,
    ARRAY['Feet elevated and hips stacked high over your hands to get closer to a vertical press.', 'Head lowers between your hands, not forward past them.', 'Keep your core braced so your lower back does not arch as you press back up.']),
  ('b0000006-0000-0000-0000-000000000000', 'One-Arm Push-up Negative','Control the descent on one arm to prepare for the full movement.',              'push', 'advanced',     5000,  9,
    ARRAY['Feet spread wide for a stable base, working hand roughly under the center of your chest.', 'Lower as slowly as you can while keeping your hips and shoulders square to the floor.', 'Resist the urge to rotate your torso to make the descent easier — that is a different exercise.']),
  ('b0000008-0000-0000-0000-000000000000', 'Ring Dip',                'Dips on gymnastics rings demand stability and control.',                        'push', 'advanced',     5000,  10,
    ARRAY['Turn the rings out slightly at the bottom rather than letting your wrists roll passively.', 'Keep the rings close to your body the whole rep — drifting rings mean losing shoulder stability.', 'Press to full lockout with the rings held steady, not swinging.']),
  ('b000000e-0000-0000-0000-000000000000', 'Tuck Planche',            'Knees tucked to your chest, feet off the floor, balanced entirely on your hands.', 'push', 'advanced',     5500,  11,
    ARRAY['Round your upper back and protract your shoulders hard to keep your hips up.', 'Keep your knees tucked tight and your hips high rather than hovering low to the floor.', 'Press through straight arms — a bent elbow is the first sign the hold is breaking down.']),
  ('b000000c-0000-0000-0000-000000000000', 'Freestanding Handstand',  'Balance in a handstand with no wall — full-body tension and fine motor control.', 'push', 'advanced',     6000,  12,
    ARRAY['Make small adjustments with your fingers to balance, not big kicks or steps with your feet.', 'Keep a tight hollow-body line from wrists to toes rather than banana-arching.', 'If you start to fall, cartwheel or step out early and calmly instead of crashing down.']),
  ('b000000f-0000-0000-0000-000000000000', 'Straddle Planche',        'Legs spread wide and straight, body horizontal and parallel to the floor, held on straight arms.', 'push', 'elite',        9000,  13,
    ARRAY['Legs pressed straight and wide — a wider straddle takes real load off your lower back.', 'Shoulders stay protracted and pushed past your hands, not sitting back over them.', 'Keep your body and legs parallel to the floor rather than piked up or sagging down.']),
  ('b0000009-0000-0000-0000-000000000000', 'One-Arm Push-up',         'Full unilateral pressing — strength, balance, and coordination combined.',      'push', 'elite',        10000, 14,
    ARRAY['Feet spread wide for balance, and keep your hips as square to the floor as you can.', 'Lower under control to a full chest-to-floor range, then press back to lockout.', 'Resist the twist — a straight-line press is the goal, not a rotated push that cheats the range.']),
  ('b000000a-0000-0000-0000-000000000000', 'Handstand Push-up',       'Press your bodyweight overhead from a handstand.',                              'push', 'elite',        12000, 15,
    ARRAY['Lower with control until your head lightly taps the floor, do not just drop.', 'Keep your body in a tight hollow line rather than arching to make the press easier.', 'Press back to a full, balanced handstand lockout at the top of every rep.']),
  ('b0000010-0000-0000-0000-000000000000', 'Full Planche',            'Legs together and straight, body horizontal and parallel to the floor — the top of the push progression.', 'push', 'elite',        14000, 16,
    ARRAY['Legs together and fully straight, body parallel to the floor from shoulders to toes.', 'Shoulders driven forward past your hands and protracted hard — that is what holds the line.', 'Keep breathing and keep your whole body braced; this hold is won with total-body tension, not just arms.']),

  -- CORE
  ('c0000001-0000-0000-0000-000000000000', 'Plank',                   'Build anterior core endurance and full-body tension.',                          'core', 'beginner',     0,     1,
    ARRAY['Body forms a straight line from shoulders to ankles — no sagging or piking hips.', 'Squeeze your glutes and brace your abs like you are about to be poked in the stomach.', 'Shoulders stack directly over your elbows, and your neck stays neutral, not craned up.']),
  ('c0000008-0000-0000-0000-000000000000', 'Hanging Knee Raise',      'Hang from a bar and lift your knees toward your chest — the entry point to hanging core work.', 'core', 'beginner',     0,     2,
    ARRAY['Keep the swing out of it — control the lift up and the lower back down.', 'Curl your pelvis under as you raise your knees rather than just swinging your legs forward.', 'Shoulders stay pulled down and active, not passively hanging from your joints.']),
  ('c0000002-0000-0000-0000-000000000000', 'Hollow Body Hold',        'The foundational gymnastics shape — everything flows from here.',               'core', 'beginner',     300,   3,
    ARRAY['Lower back stays pressed into the floor the whole time — that is the shape, not just a feeling.', 'Ribs pull down and in rather than flaring up toward the ceiling.', 'Arms and legs stay long and squeezed together, not spread or bent.']),
  ('c0000003-0000-0000-0000-000000000000', 'Tuck L-sit',              'Compress your body — knees to chest, off the ground.',                         'core', 'intermediate', 1000,  4,
    ARRAY['Press your hands down and lock your elbows straight to lift your hips.', 'Pull your knees in tight to your chest and round your lower back slightly.', 'Shoulders stay down away from your ears, not shrugged up to support the hold.']),
  ('c0000009-0000-0000-0000-000000000000', 'Hanging Leg Raise',       'Hang from a bar and lift straight legs to hip height or higher — real hanging compression strength.', 'core', 'intermediate', 1500,  5,
    ARRAY['Legs stay straight and together, not bent to make the lift easier.', 'Curl your pelvis under at the top rather than just swinging straight legs forward.', 'Lower with control instead of letting your legs drop and swing you off the bar.']),
  ('c0000004-0000-0000-0000-000000000000', 'Dragon Flag Negative',    'Lower your rigid body slowly — building the strength for dragon flags.',        'core', 'intermediate', 2000,  6,
    ARRAY['Keep your whole body rigid as one plank from shoulders to toes as you lower.', 'Only your shoulders stay in contact with the bench — everything else stays off.', 'Lower only as far as you can control before your hips start to sag, then reset.']),
  ('c0000005-0000-0000-0000-000000000000', 'L-sit (Floor)',           'Legs out, hips up — compression and tricep strength combined.',                 'core', 'intermediate', 2500,  7,
    ARRAY['Press your hands down and lock your elbows straight to lift your hips off the ground.', 'Legs stay straight and together, held at or above parallel to the floor.', 'Shoulders stay pulled down and back rather than hiked up around your ears.']),
  ('c000000a-0000-0000-0000-000000000000', 'Toes-to-Bar',             'Hang from a bar and bring your straight legs all the way up to touch it — full hanging compression.', 'core', 'advanced',     3500,  8,
    ARRAY['Legs stay straight the whole way up — bending them is a different, easier exercise.', 'Drive your hips up and under, not just your legs forward.', 'Keep your shoulders active and pulled down instead of letting the bar do all the work.']),
  ('c0000006-0000-0000-0000-000000000000', 'Dragon Flag',             'Full body rigid — one of the hardest core exercises in calisthenics.',          'core', 'advanced',     5000,  9,
    ARRAY['Only your upper back and shoulders touch the bench — hips and legs float in a straight line.', 'Keep your whole body as one rigid plank, from shoulders to pointed toes.', 'Lower slowly under control and stop before your hips break the line.']),
  ('c0000007-0000-0000-0000-000000000000', 'L-sit (Parallettes)',     'Hold the L-sit on parallettes for maximum depth and compression.',              'core', 'advanced',     5000,  10,
    ARRAY['Push the parallettes down hard to get your hips as high as possible.', 'Legs stay straight, together, and parallel to the floor or higher.', 'Shoulders stay depressed and slightly forward, not shrugged toward your ears.']),
  ('c000000b-0000-0000-0000-000000000000', 'V-sit',                   'Legs raised well above parallel in a tight V shape — the deepest expression of the L-sit.', 'core', 'elite',        6000,  11,
    ARRAY['Lean your torso back slightly as your legs come up to form a true V shape.', 'Legs stay straight and together, lifted above your head height if you can manage it.', 'Keep pressing down through straight arms — do not let your shoulders creep up as you fatigue.']),

  -- LEGS
  ('d0000001-0000-0000-0000-000000000000', 'Squat',                   'The foundation of all lower body strength.',                                    'legs', 'beginner',     0,     1,
    ARRAY['Knees track in the same direction as your toes, not caving inward.', 'Sit your hips back and down while keeping your chest tall and your heels on the floor.', 'Go as deep as your mobility allows with control, then drive up through your whole foot.']),
  ('d0000006-0000-0000-0000-000000000000', 'Calf Raise',              'Rise onto your toes and lower back down — builds the calf and ankle strength every jump and sprint relies on.', 'legs', 'beginner',     0,     2,
    ARRAY['Rise all the way up onto the balls of your feet, not just a small bounce.', 'Lower back down slowly until you feel a stretch in your calf, do not just drop.', 'Keep your weight evenly balanced across your big toe and pinky toe, not rolling to one side.']),
  ('d0000002-0000-0000-0000-000000000000', 'Split Squat',             'Unilateral loading — balance and single-leg strength.',                         'legs', 'beginner',     400,   3,
    ARRAY['Front knee tracks over your foot, not caving inward or shooting past your toes.', 'Torso stays upright and tall rather than leaning far forward.', 'Lower until your back knee lightly grazes the floor, then drive up through the front heel.']),
  ('d0000007-0000-0000-0000-000000000000', 'Reverse Lunge',           'Step backward into a lunge and return to standing — a knee-friendly way to build single-leg strength.', 'legs', 'beginner',     400,   4,
    ARRAY['Step back far enough that your front knee stays stacked over your ankle, not shooting forward.', 'Keep your torso upright and your core braced through the whole rep.', 'Push back to standing through your front heel rather than pushing off your back foot.']),
  ('d0000003-0000-0000-0000-000000000000', 'Bulgarian Split Squat',   'Rear foot elevated — maximise range of motion and quad loading.',               'legs', 'intermediate', 1500,  5,
    ARRAY['Rear foot stays relaxed on the bench — it is a kickstand for balance, not a leg driving the rep.', 'Front knee tracks over your foot as you lower straight down, not forward.', 'Torso stays mostly upright, with most of your weight through the front heel and midfoot.']),
  ('d0000004-0000-0000-0000-000000000000', 'Assisted Pistol Squat',   'Use a pole or band to build the strength and mobility for the pistol.',         'legs', 'intermediate', 3000,  6,
    ARRAY['Use the support for balance only — let your leg do the actual work of lowering and standing.', 'Keep your heel planted on the floor through the whole range, not rising onto your toes.', 'Extend the free leg out in front for balance without letting it drop or swing.']),
  ('d0000008-0000-0000-0000-000000000000', 'Nordic Curl',             'Anchor your ankles and lower your torso forward under control — the gold standard for hamstring strength.', 'legs', 'advanced',     5000,  7,
    ARRAY['Keep your hips fully extended — a bent hip turns this into a different, easier exercise.', 'Lower as slowly as you can, resisting with your hamstrings the whole way down.', 'Use your hands to catch and push back up only once your hamstrings cannot hold the descent any longer.']),
  ('d0000005-0000-0000-0000-000000000000', 'Pistol Squat',            'Full depth single-leg squat — strength, balance, and mobility in one.',         'legs', 'advanced',     6000,  8,
    ARRAY['Heel of the standing leg stays planted on the floor through the whole rep.', 'Knee tracks over your toes as you descend rather than caving inward.', 'Free leg stays extended in front, off the floor, for the entire rep.']),
  ('d0000009-0000-0000-0000-000000000000', 'Shrimp Squat',            'Squat on one leg while holding the other foot behind you — brutal single-leg strength and balance.', 'legs', 'elite',        8000,  9,
    ARRAY['Rear knee stays close to the floor, lightly tapping rather than slamming down.', 'Standing knee tracks over your toes, not caving in as you fatigue.', 'Torso leans forward slightly for balance, driven from the hip, not a rounded lower back.']),

  -- MOBILITY
  ('e0000001-0000-0000-0000-000000000000', 'Bridge',                  'Open the thoracic spine and shoulders — foundation of back mobility.',          'mobility', 'beginner',     0,     1,
    ARRAY['Push the floor away through your hands and feet evenly to lift your hips.', 'Let your head hang back freely instead of tucking your chin to your chest.', 'Straighten your arms as much as your shoulder mobility allows, without pain.']),
  ('e0000002-0000-0000-0000-000000000000', 'Shoulder Dislocates',     'Improve shoulder mobility with a band or dowel — essential prehab.',            'mobility', 'beginner',     0,     2,
    ARRAY['Keep your arms straight and your grip wide enough that the movement stays pain-free.', 'Move slowly and with control — this is a mobility drill, not a fast swing.', 'Narrow your grip only gradually over weeks as your shoulders open up.']),
  ('e0000005-0000-0000-0000-000000000000', 'Wrist Mobility Prep',     'Circle, extend, and load your wrists before any pushing or handstand work — cheap insurance against injury.', 'mobility', 'beginner',     0,     3,
    ARRAY['Move through the full range slowly rather than rushing the circles.', 'Spend real time in wrist extension — that is the position push-ups and handstands demand most.', 'Stop short of sharp pain; mild stretching tension is normal, pinching pain is not.']),
  ('e0000006-0000-0000-0000-000000000000', 'Couch Stretch',           'Kneel with your rear foot up on a wall or bench to open tight hip flexors and quads.', 'mobility', 'beginner',     0,     4,
    ARRAY['Squeeze the glute on the stretching side to deepen the hip extension without forcing your lower back.', 'Keep your torso tall rather than leaning forward to escape the stretch.', 'Ease into it gradually — a long, calm hold beats a painful, tense one.']),
  ('e0000003-0000-0000-0000-000000000000', 'Full Bridge',             'Hands and feet on the floor — full spinal extension and shoulder opening.',     'mobility', 'intermediate', 1500,  5,
    ARRAY['Push evenly through your hands and feet so the arch is shared along your whole spine.', 'Let your head relax back and look toward your hands, not straight down at the floor.', 'Keep your knees roughly hip-width and pointed forward instead of splaying out.']),
  ('e0000004-0000-0000-0000-000000000000', 'German Hang',             'Hang in shoulder extension — unlocks the back lever pathway.',                  'mobility', 'intermediate', 1500,  6,
    ARRAY['Let your shoulders open gradually into extension — do not force the range on day one.', 'Keep your grip relaxed and your breathing slow and steady through the hold.', 'Bend your knees or come out immediately if you feel sharp or pinching pain, not just a stretch.']),
  ('e0000007-0000-0000-0000-000000000000', 'Skin the Cat',            'From a hang, tuck through to a German hang and reverse — full shoulder mobility and control under load.', 'mobility', 'intermediate', 2500,  7,
    ARRAY['Move slowly through the middle of the rotation — that is where control matters most.', 'Keep your core engaged so your body rotates as one unit, not a floppy swing.', 'Reverse back to the start with the same control you used going down.']);

-- ============================================================
-- SKILL PREREQUISITES
-- ============================================================

insert into public.skill_prerequisites (skill_id, prerequisite_skill_id) values

  -- Pull chain
  ('a0000002-0000-0000-0000-000000000000', 'a0000001-0000-0000-0000-000000000000'), -- Scapular      ← Dead Hang
  ('a0000003-0000-0000-0000-000000000000', 'a0000002-0000-0000-0000-000000000000'), -- Negative      ← Scapular
  ('a0000004-0000-0000-0000-000000000000', 'a0000003-0000-0000-0000-000000000000'), -- Pull-up       ← Negative
  ('a0000005-0000-0000-0000-000000000000', 'a0000004-0000-0000-0000-000000000000'), -- C2B           ← Pull-up
  ('a0000006-0000-0000-0000-000000000000', 'a0000004-0000-0000-0000-000000000000'), -- Archer        ← Pull-up
  ('a0000007-0000-0000-0000-000000000000', 'a0000005-0000-0000-0000-000000000000'), -- Explosive     ← C2B
  ('a0000008-0000-0000-0000-000000000000', 'a0000006-0000-0000-0000-000000000000'), -- OA Neg        ← Archer
  ('a0000009-0000-0000-0000-000000000000', 'a0000007-0000-0000-0000-000000000000'), -- Muscle-up     ← Explosive
  ('a000000a-0000-0000-0000-000000000000', 'a0000008-0000-0000-0000-000000000000'), -- OA Pull-up    ← OA Neg
  ('a000000c-0000-0000-0000-000000000000', 'a0000004-0000-0000-0000-000000000000'), -- Tuck FL       ← Pull-up
  ('a000000d-0000-0000-0000-000000000000', 'a000000c-0000-0000-0000-000000000000'), -- Adv Tuck FL   ← Tuck FL
  ('a000000e-0000-0000-0000-000000000000', 'a000000d-0000-0000-0000-000000000000'), -- Straddle FL   ← Adv Tuck FL
  ('a000000f-0000-0000-0000-000000000000', 'a000000e-0000-0000-0000-000000000000'), -- Full FL       ← Straddle FL
  ('a0000010-0000-0000-0000-000000000000', 'e0000004-0000-0000-0000-000000000000'), -- Tuck BL       ← German Hang
  ('a0000011-0000-0000-0000-000000000000', 'a0000010-0000-0000-0000-000000000000'), -- Straddle BL   ← Tuck BL
  ('a0000012-0000-0000-0000-000000000000', 'a0000011-0000-0000-0000-000000000000'), -- Full BL       ← Straddle BL

  -- Push chain
  ('b0000002-0000-0000-0000-000000000000', 'b0000001-0000-0000-0000-000000000000'), -- Push-up       ← Knee push-up
  ('b0000003-0000-0000-0000-000000000000', 'b0000002-0000-0000-0000-000000000000'), -- Archer        ← Push-up
  ('b0000004-0000-0000-0000-000000000000', 'b0000002-0000-0000-0000-000000000000'), -- Pike          ← Push-up
  ('b0000005-0000-0000-0000-000000000000', 'b0000002-0000-0000-0000-000000000000'), -- Dip           ← Push-up
  ('b0000006-0000-0000-0000-000000000000', 'b0000003-0000-0000-0000-000000000000'), -- OA Neg        ← Archer
  ('b0000007-0000-0000-0000-000000000000', 'b0000004-0000-0000-0000-000000000000'), -- Elev Pike     ← Pike
  ('b0000008-0000-0000-0000-000000000000', 'b0000005-0000-0000-0000-000000000000'), -- Ring Dip      ← Dip
  ('b0000009-0000-0000-0000-000000000000', 'b0000006-0000-0000-0000-000000000000'), -- OA Push-up    ← OA Neg
  ('b000000a-0000-0000-0000-000000000000', 'b0000007-0000-0000-0000-000000000000'), -- HSPU          ← Elev Pike
  ('b000000c-0000-0000-0000-000000000000', 'b000000b-0000-0000-0000-000000000000'), -- Freestanding HS ← Wall HS Hold
  ('b000000d-0000-0000-0000-000000000000', 'b0000002-0000-0000-0000-000000000000'), -- Planche Lean  ← Push-up
  ('b000000e-0000-0000-0000-000000000000', 'b000000d-0000-0000-0000-000000000000'), -- Tuck Planche  ← Planche Lean
  ('b000000f-0000-0000-0000-000000000000', 'b000000e-0000-0000-0000-000000000000'), -- Straddle Planche ← Tuck Planche
  ('b0000010-0000-0000-0000-000000000000', 'b000000f-0000-0000-0000-000000000000'), -- Full Planche  ← Straddle Planche

  -- Core chain
  ('c0000002-0000-0000-0000-000000000000', 'c0000001-0000-0000-0000-000000000000'), -- Hollow        ← Plank
  ('c0000003-0000-0000-0000-000000000000', 'c0000002-0000-0000-0000-000000000000'), -- Tuck L-sit    ← Hollow
  ('c0000004-0000-0000-0000-000000000000', 'c0000002-0000-0000-0000-000000000000'), -- DF Neg        ← Hollow
  ('c0000005-0000-0000-0000-000000000000', 'c0000003-0000-0000-0000-000000000000'), -- L-sit         ← Tuck L-sit
  ('c0000006-0000-0000-0000-000000000000', 'c0000004-0000-0000-0000-000000000000'), -- Dragon Flg    ← DF Neg
  ('c0000007-0000-0000-0000-000000000000', 'c0000005-0000-0000-0000-000000000000'), -- L-sit Par     ← L-sit Floor
  ('c0000009-0000-0000-0000-000000000000', 'c0000008-0000-0000-0000-000000000000'), -- Hanging Leg Raise ← Hanging Knee Raise
  ('c000000a-0000-0000-0000-000000000000', 'c0000009-0000-0000-0000-000000000000'), -- Toes-to-Bar   ← Hanging Leg Raise
  ('c000000b-0000-0000-0000-000000000000', 'c0000007-0000-0000-0000-000000000000'), -- V-sit         ← L-sit Parallettes

  -- Legs chain
  ('d0000002-0000-0000-0000-000000000000', 'd0000001-0000-0000-0000-000000000000'), -- Split         ← Squat
  ('d0000003-0000-0000-0000-000000000000', 'd0000002-0000-0000-0000-000000000000'), -- Bulgarian     ← Split
  ('d0000004-0000-0000-0000-000000000000', 'd0000003-0000-0000-0000-000000000000'), -- Assisted      ← Bulgarian
  ('d0000005-0000-0000-0000-000000000000', 'd0000004-0000-0000-0000-000000000000'), -- Pistol        ← Assisted
  ('d0000007-0000-0000-0000-000000000000', 'd0000001-0000-0000-0000-000000000000'), -- Reverse Lunge ← Squat
  ('d0000008-0000-0000-0000-000000000000', 'd0000001-0000-0000-0000-000000000000'), -- Nordic Curl   ← Squat
  ('d0000009-0000-0000-0000-000000000000', 'd0000005-0000-0000-0000-000000000000'), -- Shrimp Squat  ← Pistol Squat

  -- Mobility chain
  ('e0000003-0000-0000-0000-000000000000', 'e0000001-0000-0000-0000-000000000000'), -- Full Bridge   ← Bridge
  ('e0000004-0000-0000-0000-000000000000', 'e0000002-0000-0000-0000-000000000000'), -- German Hang   ← Shoulder Disc
  ('e0000007-0000-0000-0000-000000000000', 'e0000004-0000-0000-0000-000000000000'); -- Skin the Cat  ← German Hang

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
  ('a100000c-0000-0000-0000-000000000000', 'Inverted Row',            'pull', 1, 'a000000b-0000-0000-0000-000000000000', 'reps'),
  ('a100000d-0000-0000-0000-000000000000', 'Ring Row',                'pull', 1, 'a000000b-0000-0000-0000-000000000000', 'reps'),
  ('a100000e-0000-0000-0000-000000000000', 'Tuck Front Lever Hold',   'pull', 2, 'a000000c-0000-0000-0000-000000000000', 'duration'),
  ('a100000f-0000-0000-0000-000000000000', 'Advanced Tuck Front Lever Hold', 'pull', 3, 'a000000d-0000-0000-0000-000000000000', 'duration'),
  ('a1000010-0000-0000-0000-000000000000', 'Straddle Front Lever Hold', 'pull', 3, 'a000000e-0000-0000-0000-000000000000', 'duration'),
  ('a1000011-0000-0000-0000-000000000000', 'Front Lever Hold',        'pull', 4, 'a000000f-0000-0000-0000-000000000000', 'duration'),
  ('a1000012-0000-0000-0000-000000000000', 'Tuck Back Lever Hold',    'pull', 2, 'a0000010-0000-0000-0000-000000000000', 'duration'),
  ('a1000013-0000-0000-0000-000000000000', 'Straddle Back Lever Hold', 'pull', 3, 'a0000011-0000-0000-0000-000000000000', 'duration'),
  ('a1000014-0000-0000-0000-000000000000', 'Back Lever Hold',         'pull', 4, 'a0000012-0000-0000-0000-000000000000', 'duration'),

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
  ('b100000e-0000-0000-0000-000000000000', 'Wall Handstand Hold',     'push', 1, 'b000000b-0000-0000-0000-000000000000', 'duration'),
  ('b100000f-0000-0000-0000-000000000000', 'Freestanding Handstand Hold', 'push', 3, 'b000000c-0000-0000-0000-000000000000', 'duration'),
  ('b1000010-0000-0000-0000-000000000000', 'Planche Lean',            'push', 2, 'b000000d-0000-0000-0000-000000000000', 'duration'),
  ('b1000011-0000-0000-0000-000000000000', 'Tuck Planche Hold',       'push', 3, 'b000000e-0000-0000-0000-000000000000', 'duration'),
  ('b1000012-0000-0000-0000-000000000000', 'Straddle Planche Hold',   'push', 4, 'b000000f-0000-0000-0000-000000000000', 'duration'),
  ('b1000013-0000-0000-0000-000000000000', 'Full Planche Hold',       'push', 4, 'b0000010-0000-0000-0000-000000000000', 'duration'),

  -- CORE exercises
  ('c1000001-0000-0000-0000-000000000000', 'Plank',                   'core', 1, 'c0000001-0000-0000-0000-000000000000', 'duration'),
  ('c1000002-0000-0000-0000-000000000000', 'Hollow Body Hold',        'core', 1, 'c0000002-0000-0000-0000-000000000000', 'duration'),
  ('c1000003-0000-0000-0000-000000000000', 'Tuck L-sit',              'core', 2, 'c0000003-0000-0000-0000-000000000000', 'duration'),
  ('c1000004-0000-0000-0000-000000000000', 'Dragon Flag Negative',    'core', 3, 'c0000004-0000-0000-0000-000000000000', 'reps'),
  ('c1000005-0000-0000-0000-000000000000', 'L-sit (Floor)',           'core', 2, 'c0000005-0000-0000-0000-000000000000', 'duration'),
  ('c1000006-0000-0000-0000-000000000000', 'Dragon Flag',             'core', 4, 'c0000006-0000-0000-0000-000000000000', 'reps'),
  ('c1000007-0000-0000-0000-000000000000', 'L-sit (Parallettes)',     'core', 3, 'c0000007-0000-0000-0000-000000000000', 'duration'),
  ('c1000008-0000-0000-0000-000000000000', 'Hanging Knee Raise',      'core', 1, 'c0000008-0000-0000-0000-000000000000', 'reps'),
  ('c1000009-0000-0000-0000-000000000000', 'Hanging Leg Raise',       'core', 2, 'c0000009-0000-0000-0000-000000000000', 'reps'),
  ('c100000a-0000-0000-0000-000000000000', 'Toes-to-Bar',             'core', 3, 'c000000a-0000-0000-0000-000000000000', 'reps'),
  ('c100000b-0000-0000-0000-000000000000', 'V-sit Hold',              'core', 4, 'c000000b-0000-0000-0000-000000000000', 'duration'),

  -- LEGS exercises
  ('d1000001-0000-0000-0000-000000000000', 'Squat',                   'legs', 1, 'd0000001-0000-0000-0000-000000000000', 'reps'),
  ('d1000002-0000-0000-0000-000000000000', 'Jump Squat',              'legs', 2, 'd0000001-0000-0000-0000-000000000000', 'reps'),
  ('d1000003-0000-0000-0000-000000000000', 'Split Squat',             'legs', 1, 'd0000002-0000-0000-0000-000000000000', 'reps'),
  ('d1000004-0000-0000-0000-000000000000', 'Bulgarian Split Squat',   'legs', 2, 'd0000003-0000-0000-0000-000000000000', 'reps'),
  ('d1000005-0000-0000-0000-000000000000', 'Assisted Pistol Squat',   'legs', 2, 'd0000004-0000-0000-0000-000000000000', 'reps'),
  ('d1000006-0000-0000-0000-000000000000', 'Pistol Squat',            'legs', 3, 'd0000005-0000-0000-0000-000000000000', 'reps'),
  ('d1000007-0000-0000-0000-000000000000', 'Calf Raise',              'legs', 1, 'd0000006-0000-0000-0000-000000000000', 'reps'),
  ('d1000008-0000-0000-0000-000000000000', 'Reverse Lunge',           'legs', 1, 'd0000007-0000-0000-0000-000000000000', 'reps'),
  ('d1000009-0000-0000-0000-000000000000', 'Nordic Curl',             'legs', 3, 'd0000008-0000-0000-0000-000000000000', 'reps'),
  ('d100000a-0000-0000-0000-000000000000', 'Shrimp Squat',            'legs', 4, 'd0000009-0000-0000-0000-000000000000', 'reps'),

  -- MOBILITY exercises
  ('e1000001-0000-0000-0000-000000000000', 'Bridge',                  'mobility', 1, 'e0000001-0000-0000-0000-000000000000', 'reps'),
  ('e1000002-0000-0000-0000-000000000000', 'Shoulder Dislocate',      'mobility', 1, 'e0000002-0000-0000-0000-000000000000', 'reps'),
  ('e1000003-0000-0000-0000-000000000000', 'Full Bridge Hold',        'mobility', 2, 'e0000003-0000-0000-0000-000000000000', 'duration'),
  ('e1000004-0000-0000-0000-000000000000', 'German Hang',             'mobility', 2, 'e0000004-0000-0000-0000-000000000000', 'duration'),
  ('e1000005-0000-0000-0000-000000000000', 'Wrist Circles & Extensions', 'mobility', 1, 'e0000005-0000-0000-0000-000000000000', 'duration'),
  ('e1000006-0000-0000-0000-000000000000', 'Couch Stretch',           'mobility', 1, 'e0000006-0000-0000-0000-000000000000', 'duration'),
  ('e1000007-0000-0000-0000-000000000000', 'Skin the Cat',            'mobility', 2, 'e0000007-0000-0000-0000-000000000000', 'reps');
