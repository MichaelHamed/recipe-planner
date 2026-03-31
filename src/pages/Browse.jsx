import { useState } from 'react';
import MealCard from '../components/MealCard';
import { searchMeals, getVegetarianMeals } from '../lib/mealdb';
import { supabase } from '../lib/supabase';

export default function Browse({ user }) {
  const [query, setQuery] = useState('');
  const [vegetarianOnly, setVegetarianOnly] = useState(false);
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [addedIds, setAddedIds] = useState(new Set());

  async function handleSearch(e) {
    e.preventDefault();
    setLoading(true);
    setSearched(true);
    try {
      let results;
      if (vegetarianOnly && !query.trim()) {
        results = await getVegetarianMeals();
        // Vegetarian filter returns partial objects — enrich a few
        results = results.slice(0, 20);
      } else if (vegetarianOnly && query.trim()) {
        const all = await searchMeals(query);
        results = all.filter(m => m.strCategory === 'Vegetarian');
      } else {
        results = await searchMeals(query);
      }
      setMeals(results);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(meal) {
    if (!user) return;

    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    const weekStart = monday.toISOString().split('T')[0];

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
        meal_id: meal.idMeal,
        meal_name: meal.strMeal,
        meal_thumb: meal.strMealThumb,
        proposed_by: user.id,
      });

      setAddedIds(prev => new Set([...prev, meal.idMeal]));
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Browse Meals</h1>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search for a meal (e.g. pasta, chicken...)"
            className="flex-1 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
          />
          <div className="flex gap-3">
            {/* Vegetarian toggle */}
            <button
              type="button"
              onClick={() => setVegetarianOnly(v => !v)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border transition-colors ${
                vegetarianOnly
                  ? 'bg-green-500 text-white border-green-500'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-green-400'
              }`}
            >
              🥦 Vegetarian only
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors disabled:opacity-60"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {/* Results */}
        {loading && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3 animate-pulse">🍳</div>
            <p className="text-gray-400 dark:text-gray-500">Finding delicious meals...</p>
          </div>
        )}

        {!loading && searched && meals.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">😕</div>
            <p className="text-gray-500 dark:text-gray-400">No meals found. Try a different search.</p>
          </div>
        )}

        {!loading && !searched && (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🔍</div>
            <p className="text-gray-400 dark:text-gray-500">Search for meals above to get started</p>
          </div>
        )}

        {!loading && meals.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {meals.map(meal => (
              <div key={meal.idMeal} className="relative">
                <MealCard
                  meal={meal}
                  onAdd={addedIds.has(meal.idMeal) ? undefined : handleAdd}
                />
                {addedIds.has(meal.idMeal) && (
                  <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                    Added ✓
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
