# Family Meal Planner

A React + Vite web app for planning family dinners together. Uses TheMealDB for meal discovery and Supabase for authentication, meal plans, and voting.

## Features

- **Dinner suggestion** — "Surprise Me!" button fetches a random meal (respects vegetarian preference)
- **Browse** — Search TheMealDB with optional vegetarian filter, add meals to the planner
- **Weekly Planner** — 7-column Mon–Sun grid, propose meals per day, thumbs up/down voting
- **Profile** — Set display name, toggle vegetarian preference
- **Auth** — Email/password sign-up and login via Supabase

## Setup

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the SQL editor, run the contents of `supabase/schema.sql` to create all tables and RLS policies
3. Copy your **Project URL** and **anon public** key from Project Settings > API

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Install dependencies

```bash
npm install
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Tech Stack

- **React 19** + **Vite**
- **Tailwind CSS v4** (via `@tailwindcss/vite` plugin)
- **React Router v7**
- **Supabase** (`@supabase/supabase-js`) — auth, database
- **TheMealDB** free API — meal data, images, categories

## Project Structure

```
src/
  lib/
    supabase.js      # Supabase client
    mealdb.js        # TheMealDB API wrapper
  components/
    MealCard.jsx     # Reusable meal card
    Navbar.jsx       # Top navigation
    WeekPlanner.jsx  # 7-day planner grid
  pages/
    Login.jsx        # Sign in / sign up
    Home.jsx         # Random meal suggestion
    Browse.jsx       # Search + filter meals
    Planner.jsx      # Weekly meal planner
    Profile.jsx      # User settings
  App.jsx            # Router + auth state
supabase/
  schema.sql         # Full DB schema with RLS
```

## Database Schema

- `profiles` — user display name + vegetarian preference
- `meal_plans` — one plan per user per week
- `plan_slots` — meal assigned to a day within a plan
- `votes` — thumbs up/down per slot per user
- `favourites` — saved meals per user

## Build

```bash
npm run build
```

Output is in `dist/`.
