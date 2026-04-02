import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MealCard from '../components/MealCard';
import { getRandomMeal, getRandomVegetarianMeal } from '../lib/mealdb';
import { supabase } from '../lib/supabase';

export default function Home({ user, profile }) {
  const [meal, setMeal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const navigate = useNavigate();

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'there';
  const isVegetarian = profile?.is_vegetarian ?? false;

  async function handleSurpriseMe() {
    setLoading(true);
    setAdded(false);
    try {
      const fetched = isVegetarian ? await getRandomVegetarianMeal() : await getRandomMeal();
      setMeal(fetched);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToPlanner(mealToAdd) {
    if (!mealToAdd || !user) return;

    // Get the current week's Monday
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon...
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    const weekStart = monday.toISOString().split('T')[0];

    // Upsert meal_plan for this week
    let { data: plan } = await supabase
      .from('meal_plans')
      .select('id')
      .eq('week_start', weekStart)
      .eq('created_by', user.id)
      .single();

    if (!plan) {
      const { data: newPlan } = await supabase
        .from('meal_plans')
        .insert({ week_start: weekStart, created_by: user.id })
        .select('id')
        .single();
      plan = newPlan;
    }

    if (plan) {
      // Find first empty day
      const { data: existingSlots } = await supabase
        .from('plan_slots')
        .select('day_of_week')
        .eq('plan_id', plan.id);

      const usedDays = new Set((existingSlots || []).map(s => s.day_of_week));
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const targetDay = days.find(d => !usedDays.has(d)) || 'Mon';

      await supabase.from('plan_slots').insert({
        plan_id: plan.id,
        day_of_week: targetDay,
        meal_id: mealToAdd.idMeal,
        meal_name: mealToAdd.strMeal,
        meal_thumb: mealToAdd.strMealThumb,
        proposed_by: user.id,
      });

      setAdded(true);
    }
  }

  return (
    <div className="px-6 py-10">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 dark:text-white">
            Welcome back, {displayName}! 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {isVegetarian
              ? "What's for dinner tonight? Let's find you a veggie option."
              : "What's for dinner tonight? Let's find something delicious."}
          </p>
        </div>

        {/* Surprise Me button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={handleSurpriseMe}
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-8 rounded-xl text-lg shadow-md shadow-amber-200 dark:shadow-amber-900/30 transition-all disabled:opacity-60 active:scale-95"
          >
            {loading ? 'Finding a meal...' : '🎲 Surprise Me!'}
          </button>
        </div>

        {/* Meal card */}
        {meal && (
          <div className="max-w-sm mx-auto">
            <MealCard
              meal={meal}
              onAdd={handleAddToPlanner}
            />
            {added && (
              <div className="mt-3 text-center text-green-600 dark:text-green-400 text-sm font-medium">
                ✅ Added to this week&apos;s planner!{' '}
                <button
                  onClick={() => navigate('/planner')}
                  className="underline hover:no-underline"
                >
                  View planner
                </button>
              </div>
            )}
          </div>
        )}

        {!meal && !loading && (
          <div className="text-center">
            <div className="text-6xl mb-4">🥘</div>
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              Hit the button above to get a random meal suggestion
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
