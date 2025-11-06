# 🗒️ CalPal Developer Notes

These are internal notes and insights collected during the development of **CalPal** — a calorie tracking and gamified health assistant built with **Next.js**, **Supabase**, and **TailwindCSS**.  
This document serves as a technical journal for contributors to understand design decisions, troubleshooting processes, and backend integration details.

---

## ⚙️ Project Overview

**Tech Stack**
- **Frontend:** Next.js 14 (App Router) + TypeScript  
- **Styling:** TailwindCSS + Shadcn/UI  
- **Backend:** Supabase (PostgreSQL 15 + Auth + Storage)  
- **AI Integration:** Google Gemini API for motivational coaching  
- **Data Visualization:** Recharts for weekly and daily summaries  

**Primary Goal:**  
Enable users to log meals and activities, track calorie balance, earn coins, and unlock achievements — all within a lightweight, privacy-friendly interface.

---

## 🧩 System Flow Summary

1. **User Registration** → `auth.users`
   - Auto-creates `profiles` (via trigger)
   - Auto-creates `user_stats`

2. **User Actions**
   - Add **Food Log** → `food_logs`
   - Add **Activity Log** → `activity_logs`

3. **Automatic Calculations**
   - Calories burned auto-calculated via trigger.
   - Coins rewarded after every log.
   - Achievements evaluated dynamically.

4. **Dashboard Summary**
   - Data fetched from `get_daily_summary` and `get_weekly_summary` RPCs.
   - Frontend calculates and visualizes **Net Calories (In - Out)**.

---

## 🚀 Development Milestones

| Version | Feature | Description |
|----------|----------|-------------|
| `v0.1.0` | Base Setup | Next.js + Supabase Auth integration |
| `v0.2.0` | Profile System | Auto-create profile + weight tracking |
| `v0.3.0` | Food Log | Log search via USDA API proxy + calories tracking |
| `v0.4.0` | Activity Log | MET-based calorie burn calculation (triggered) |
| `v0.5.0` | Gamification | Coins system and achievements (triggered) |
| `v0.6.0` | Dashboard | Daily/weekly summary with Recharts |
| `v0.7.0` | AI Coach | Gemini API for motivational messages |
| `v0.8.0` | Docs | Full backend setup + developer notes added |

---

## 🐞 Common Issues & Fixes

### 1️⃣ Function Overload Conflict
**Error:**  
`Could not choose the best candidate function between public.log_food...`  

**Cause:** Multiple overloaded versions of `log_food` existed (`integer` vs `numeric`).  
**Fix:**  
Dropped all previous variants and redefined one consistent function using `numeric` types only.

```sql
drop function if exists public.log_food(uuid, text, integer, numeric, text);
drop function if exists public.log_food(uuid, text, numeric, numeric, text);
```
Then recreated cleanly:
```sql
create or replace function public.log_food(
  p_user_id uuid,
  p_food_name text,
  p_calories_kcal numeric,
  p_serving_qty numeric,
  p_serving_unit text
)
returns void ...
```

### 2️⃣ Calories Burned Always 0
**Cause:** Calculation previously handled inside `log_activity` RPC, which was bypassed after a frontend refactor.  
**Fix:** Introduced `calculate_activity_calories()` trigger to automatically compute burned calories before insertion.

### 3️⃣ Daily Summary Not Updating
**Cause:** Old `get_daily_summary` returned incorrect column types and was missing `coalesce()` to handle nulls.  
**Fix:** Rewrote the function using a nested `select sum(...)` with `coalesce()` wrappers.

### 4️⃣ Profile Auto-Creation Duplication
**Cause:** Trigger fired twice on `auth.users`.  
**Fix:** Wrapped the logic with `perform ... if not found` to ensure an idempotent insert.

### 5️⃣ Data Reset Command
**Note:** Use carefully! To reset all logs without dropping tables:

```sql
set session_replication_role = replica;
truncate table
  activity_logs,
  food_logs,
  user_achievements,
  user_stats,
  profiles,
  met_activities,
  achievements
restart identity cascade;
set session_replication_role = origin;
```

---

## 📦 API Routes Overview

| Route | Description | Linked RPC |
|---|---|---|
| `/api/food-search` | Proxy to USDA API | — |
| `/api/log/food` | Adds new food log | `log_food` |
| `/api/log/activity` | Adds new activity log | Triggered via insert |
| `/api/summary/daily` | Fetches calorie summary for date | `get_daily_summary` |
| `/api/summary/weekly` | Fetches 7-day chart data | `get_weekly_summary` |

---

## 🧠 Design Decisions

- **Keep logic server-side (in SQL)**
  → Minimizes client errors and ensures consistent calculations across devices.

- **Use triggers for rewards and achievements**
  → Simplifies frontend logic (frontend only inserts raw logs).

- **Separate environment configs**
  → `.env.local` for Supabase + Gemini, no secrets in code.

- **Single source of truth for weight**
  → Stored in `profiles.current_weight_kg`.

---

## 🧰 Developer Setup Checklist

✅ Ensure these before running the app:

- Supabase project created and schema applied.
- MET activities & achievements seeded.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` configured.
- You can login and create a profile automatically.
- SQL Editor works and RPCs are visible under Database → Functions.

---

## 🧾 Recommended Next Steps

- Add Leaderboard (based on `total_coins`).
- Enable weight history tracking.
- Expand achievement logic (e.g., streak beyond 7 days).
- Add unit conversion (kg/lb, kcal/kJ).
- Deploy Supabase Edge Functions for real-time summaries.

---

## ❤️ Maintainers

**CalPal Project**
Developed with 💚 by the Minilemon Technology Intern Team  
Maintainer: @MohamadSolkhanNawawi

---

## 📄 License

Open-sourced under the MIT License.  
You are free to fork, modify, and distribute with attribution.
