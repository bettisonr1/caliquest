# CaliQuest — 3 Month Roadmap

## Stack
- **Frontend + API:** Next.js (App Router, TypeScript)
- **Database + Auth:** Supabase (Postgres, built-in auth)
- **Styling:** Tailwind CSS
- **Deploy:** AWS Amplify Hosting

---

## Month 1 — Foundation
> Goal: users can log workouts and earn XP

### Week 1–2: Setup & Auth
- [ ] Next.js + Supabase wired up, deployed to Vercel
- [ ] Login / signup (email, Supabase Auth)
- [ ] Protected routes via middleware
- [ ] Basic user profile page (avatar, username, level, total XP)

### Week 3–4: Workout Logging & XP
- [ ] Exercise library (seed list: pull-ups, dips, push-ups, rows, dips, L-sit, etc.)
- [ ] Log a workout: pick exercises, log sets × reps
- [ ] XP formula (reps × difficulty multiplier per exercise)
- [ ] XP total and level update on profile after each session
- [ ] Workout history view

---

## Month 2 — Gamification Core
> Goal: the game loop feels real — skills, quests, progression

### Week 5–6: Skills Tree
- [ ] Define calisthenics progressions (e.g. knee push-up → push-up → archer push-up → one-arm push-up)
- [ ] Skills unlock when XP thresholds or prerequisites are met
- [ ] Visual skills tree — locked / in progress / unlocked states

### Week 7–8: Sidequests & Leaderboard
- [ ] Sidequest system: time-limited challenges (e.g. "100 pull-ups this week")
- [ ] XP bonus awarded on quest completion
- [ ] Friends leaderboard ranked by XP / level
- [ ] Streak tracking (consecutive days trained)

---

## Month 3 — Legends & Polish
> Goal: something worth sharing

### Week 9–10: Gym Legends System
- [ ] Prestige tiers (e.g. Novice → Warrior → Legend → Mythic)
- [ ] Badges and titles earned through milestones
- [ ] Profile showcases unlocked skills and earned titles

### Week 11–12: Polish & Ship
- [ ] Shareable workout summary card
- [ ] Mobile-friendly UI pass (used in the gym on a phone browser)
- [ ] Invite friends flow
- [ ] Final deploy, share URL with friends

---

## Deferred (Post 3 Months)
- Native mobile app
- Push notifications / reminders
- Custom workout programming
- Community features beyond leaderboard
- Public launch

---

## Game Design Decisions (To Discuss)
- XP formula — how much per rep? difficulty multipliers? consistency bonuses?
- Skills tree structure — what progressions to include at launch?
- Sidequest design — how are they generated? static or dynamic?
- Prestige tiers — thresholds and what they unlock
- Social features — how much visibility do friends have into each other's workouts?
