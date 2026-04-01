import { useState, useEffect } from 'react';
import MealCard from '../components/MealCard';
import { searchMeals, getVegetarianMeals, getMealById, listAreas, filterByArea, filterByCategory } from '../lib/mealdb';
import { supabase } from '../lib/supabase';

const CATEGORIES = [
  { label: 'All Recipes', value: '', emoji: '🍽️' },
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

export default function Browse({ user }) {
  const [query, setQuery] = useState('');
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

  async function fetchMeals({ q = query, cat = category, loc = area } = {}) {
    setLoading(true);
    setSearched(true);
    try {
      let results;

      if (cat && !q.trim()) {
        // Category filter only — fetch full details
        const partial = await filterByCategory(cat);
        results = await Promise.all(partial.slice(0, 20).map(m => getMealById(m.idMeal)));
        results = results.filter(Boolean);
        if (loc) results = results.filter(m => m.strArea === loc);
      } else if (loc && !q.trim() && !cat) {
        // Area only
        const partial = await filterByArea(loc);
        results = await Promise.all(partial.slice(0, 20).map(m => getMealById(m.idMeal)));
        results = results.filter(Boolean);
      } else if (q.trim()) {
        results = await searchMeals(q);
        if (cat) results = results.filter(m => m.strCategory === cat);
        if (loc) results = results.filter(m => m.strArea === loc);
      } else if (cat === 'Vegetarian') {
        const partial = await getVegetarianMeals();
        results = await Promise.all(partial.slice(0, 20).map(m => getMealById(m.idMeal)));
        results = results.filter(Boolean);
      } else {
        results = await searchMeals('');
        if (loc) results = results.filter(m => m.strArea === loc);
      }

      setMeals(results);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e) {
    e.preventDefault();
    fetchMeals();
  }

  function handleCategoryClick(val) {
    const newCat = val === category ? '' : val;
    setCategory(newCat);
    fetchMeals({ cat: newCat });
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
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900">Browse Meals</h1>
          {meals.length > 0 && (
            <span className="text-sm font-medium text-orange-500 bg-orange-50 px-2.5 py-0.5 rounded-full">
              {meals.length} recipes
            </span>
          )}
        </div>

        {/* Search + country filter */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <select
            value={area}
            onChange={e => setArea(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <option value="">All countries</option>
            {areas.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search meals..."
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 w-48"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-60"
          >
            {loading ? '...' : 'Search'}
          </button>
        </form>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => handleCategoryClick(cat.value)}
            className={`flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-medium whitespace-nowrap transition-colors border shrink-0 ${
              category === cat.value
                ? 'bg-orange-500 text-white border-orange-500'
                : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-500'
            }`}
          >
            <span className="text-lg leading-none">{cat.emoji}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* States */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="text-5xl mb-3 animate-pulse">🍳</div>
          <p className="text-gray-400 text-sm">Finding delicious meals...</p>
        </div>
      )}

      {!loading && searched && meals.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="text-5xl mb-3">😕</div>
          <p className="text-gray-500 text-sm">No meals found. Try a different search.</p>
        </div>
      )}

      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="text-5xl mb-3">🔍</div>
          <p className="text-gray-400 text-sm">Select a category or search above to get started</p>
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
