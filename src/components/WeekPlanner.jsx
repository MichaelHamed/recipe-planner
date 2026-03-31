import { useState } from 'react';
import { searchMeals } from '../lib/mealdb';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function DaySlot({ day, slot, onPropose, onVote }) {
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const meals = await searchMeals(query);
      setResults(meals.slice(0, 5));
    } finally {
      setSearching(false);
    }
  }

  function handlePick(meal) {
    onPropose(day, meal);
    setShowSearch(false);
    setQuery('');
    setResults([]);
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col min-h-[200px]">
      {/* Day header */}
      <div className="bg-amber-500 text-white text-center py-2 px-1 rounded-t-xl font-semibold text-sm">
        {day}
      </div>

      <div className="flex flex-col flex-1 p-2 gap-2">
        {slot ? (
          <>
            {slot.meal_thumb && (
              <img
                src={slot.meal_thumb}
                alt={slot.meal_name}
                className="w-full h-24 object-cover rounded-lg"
              />
            )}
            <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 text-center leading-snug line-clamp-2">
              {slot.meal_name}
            </p>
            {/* Vote buttons */}
            <div className="flex justify-center gap-2 mt-auto">
              <button
                onClick={() => onVote(slot, 1)}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/60 transition-colors"
              >
                👍 {slot.upvotes || 0}
              </button>
              <button
                onClick={() => onVote(slot, -1)}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors"
              >
                👎 {slot.downvotes || 0}
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center">No meal planned</p>
          </div>
        )}

        <button
          onClick={() => setShowSearch(true)}
          className="mt-auto text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 px-2 py-1.5 rounded-lg transition-colors font-medium"
        >
          {slot ? 'Change meal' : '+ Propose meal'}
        </button>
      </div>

      {/* Search modal */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowSearch(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm p-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 dark:text-white mb-3">
              Propose meal for {day}
            </h3>
            <form onSubmit={handleSearch} className="flex gap-2 mb-3">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search meals..."
                className="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                disabled={searching}
                className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {searching ? '...' : 'Search'}
              </button>
            </form>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {results.map(meal => (
                <button
                  key={meal.idMeal}
                  onClick={() => handlePick(meal)}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-left transition-colors"
                >
                  {meal.strMealThumb && (
                    <img src={`${meal.strMealThumb}/preview`} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  )}
                  <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">{meal.strMeal}</span>
                </button>
              ))}
              {results.length === 0 && query && !searching && (
                <p className="text-sm text-gray-400 text-center py-2">No meals found</p>
              )}
            </div>
            <button
              onClick={() => setShowSearch(false)}
              className="mt-3 w-full text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WeekPlanner({ slots, onPropose, onVote }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      {DAYS.map(day => (
        <DaySlot
          key={day}
          day={day}
          slot={slots?.[day] || null}
          onPropose={onPropose}
          onVote={onVote}
        />
      ))}
    </div>
  );
}
