import { useState, useEffect } from 'react';
import MealCard from '../components/MealCard';
import { searchMeals, getVegetarianMeals, getMealById, listAreas, filterByArea, filterByCategory } from '../lib/mealdb';
import { supabase } from '../lib/supabase';

const CATEGORIES = [
  { label: 'All', value: '', emoji: '🍽️' },
  { label: 'Breakfast', value: 'Breakfast', emoji: '🍳' },
  { label: 'Chicken', value: 'Chicken', emoji: '🍗' },
  { label: 'Beef', value: 'Beef', emoji: '🥩' },
  { label: 'Seafood', value: 'Seafood', emoji: '🦞' },
  { label: 'Pasta', value: 'Pasta', emoji: '🍝' },
  { label: 'Dessert', value: 'Dessert', emoji: '🍰' },
  { label: 'Vegetarian', value: 'Vegetarian', emoji: '🥦' },
  { label: 'Vegan', value: 'Vegan', emoji: '🌱' },
  { label: 'Lamb', value: 'Lamb', emoji: '🐑' },
];

const SUGGESTIONS = [
  { label: 'Chicken', value: 'Chicken', emoji: '🍗' },
  { label: 'Pasta', value: 'Pasta', emoji: '🍝' },
  { label: 'Seafood', value: 'Seafood', emoji: '🦞' },
  { label: 'Vegetarian', value: 'Vegetarian', emoji: '🥦' },
  { label: 'Dessert', value: 'Dessert', emoji: '🍰' },
  { label: 'Breakfast', value: 'Breakfast', emoji: '🍳' },
];

export default function Browse({ user }) {
  const [category, setCategory] = useState('');
  const [area, setArea] = useState('');
  const [areas, setAreas] = useState([]);
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [addedIds, setAddedIds] = useState(new Set());

  useEffect(() => {
    listAreas().then(setAreas);
  }, []);

  async function fetchMeals({ cat = category, loc = area } = {}) {
    setLoading(true);
    setSearched(true);
    try {
      let results;

      if (cat && !loc) {
        const partial = await filterByCategory(cat);
        results = await Promise.all(partial.slice(0, 20).map(m => getMealById(m.idMeal)));
        results = results.filter(Boolean);
      } else if (loc && !cat) {
        const partial = await filterByArea(loc);
        results = await Promise.all(partial.slice(0, 20).map(m => getMealById(m.idMeal)));
        results = results.filter(Boolean);
      } else if (cat && loc) {
        const partial = await filterByCategory(cat);
        results = await Promise.all(partial.slice(0, 20).map(m => getMealById(m.idMeal)));
        results = results.filter(Boolean).filter(m => m.strArea === loc);
      } else {
        results = await searchMeals('');
      }

      setMeals(results);
    } finally {
      setLoading(false);
    }
  }

  function handleCategoryClick(val) {
    const newCat = val === category ? '' : val;
    setCategory(newCat);
    fetchMeals({ cat: newCat });
  }

  function handleAreaChange(val) {
    setArea(val);
    fetchMeals({ loc: val });
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
    <div className="px-6 py-6">
      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Browse Meals</h1>
          {meals.length > 0 && (
            <span className="text-sm font-medium text-orange-500 bg-orange-50 dark:bg-orange-500/10 px-2.5 py-0.5 rounded-full">
              {meals.length} recipes
            </span>
          )}
        </div>

        {/* Country filter only */}
        <select
          value={area}
          onChange={e => handleAreaChange(e.target.value)}
          className="border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          <option value="">All countries</option>
          {areas.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* Category chips — inline horizontal */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-6" style={{ scrollbarWidth: 'none' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => handleCategoryClick(cat.value)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
              category === cat.value
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-500'
            }`}
          >
            <span>{cat.emoji}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 dark:text-gray-500 text-sm">Finding delicious meals...</p>
        </div>
      )}

      {/* No results */}
      {!loading && searched && meals.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-3xl">😕</div>
          <p className="font-semibold text-gray-700 dark:text-gray-300">No meals found</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm">Try a different category or country</p>
        </div>
      )}

      {/* Empty state — not yet searched */}
      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-12 gap-6">
          <div className="text-center">
            <p className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">What are you in the mood for?</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Pick a category above or jump straight in</p>
          </div>
          {/* Quick suggestion tiles */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 w-full max-w-2xl">
            {SUGGESTIONS.map(s => (
              <button
                key={s.value}
                onClick={() => handleCategoryClick(s.value)}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-500/50 hover:shadow-md transition-all"
              >
                <span className="text-2xl">{s.emoji}</span>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      {!loading && meals.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {meals.map(meal => (
            <MealCard
              key={meal.idMeal}
              meal={meal}
              onAdd={handleAdd}
              added={addedIds.has(meal.idMeal)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
