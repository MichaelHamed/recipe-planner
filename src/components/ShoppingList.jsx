import { useState } from 'react';

function getIngredients(meal) {
  const items = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ingredient && ingredient.trim()) {
      items.push({
        name: ingredient.trim(),
        measure: measure ? measure.trim() : '',
      });
    }
  }
  return items;
}

export default function ShoppingList({ mealDetails }) {
  const [checked, setChecked] = useState(new Set());
  const [copied, setCopied] = useState(false);

  const meals = mealDetails.filter(Boolean);
  if (meals.length === 0) return null;

  function toggleItem(key) {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function handleCopy() {
    const lines = meals.flatMap(meal => {
      const ingredients = getIngredients(meal);
      return [`\n${meal.strMeal}`, ...ingredients.map(i => `• ${i.measure ? i.measure + ' ' : ''}${i.name}`)];
    });
    navigator.clipboard.writeText(lines.join('\n').trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const total = meals.reduce((sum, m) => sum + getIngredients(m).length, 0);
  const checkedCount = checked.size;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Shopping List</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {checkedCount}/{total} items ticked off
          </p>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          {copied ? (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-green-500">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy all
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {meals.map(meal => {
          const ingredients = getIngredients(meal);
          return (
            <div key={meal.idMeal} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                {meal.strMealThumb && (
                  <img src={`${meal.strMealThumb}/preview`} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                )}
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 line-clamp-1">{meal.strMeal}</h3>
              </div>
              <ul className="space-y-1.5">
                {ingredients.map((item, i) => {
                  const key = `${meal.idMeal}-${i}`;
                  const done = checked.has(key);
                  return (
                    <li key={key}>
                      <label className="flex items-start gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={done}
                          onChange={() => toggleItem(key)}
                          className="mt-0.5 shrink-0 accent-orange-500"
                        />
                        <span className={`text-xs leading-relaxed transition-colors ${done ? 'line-through text-gray-300 dark:text-gray-600' : 'text-gray-600 dark:text-gray-400'}`}>
                          {item.measure && <span className="font-medium text-gray-700 dark:text-gray-300">{item.measure} </span>}
                          {item.name}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
