function getIngredients(meal) {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ingredient && ingredient.trim()) {
      ingredients.push(`${measure ? measure.trim() + ' ' : ''}${ingredient.trim()}`);
    }
  }
  return ingredients;
}

export default function MealCard({ meal, onAdd, added }) {
  if (!meal) return null;

  const isVegetarian = meal.strCategory === 'Vegetarian';
  const ingredients = getIngredients(meal);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
      {/* Image */}
      <div className="relative overflow-hidden">
        {meal.strMealThumb ? (
          <img
            src={meal.strMealThumb}
            alt={meal.strMeal}
            className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-44 bg-gray-100 flex items-center justify-center text-4xl">🍽️</div>
        )}

        {/* Veg badge */}
        {isVegetarian && (
          <span className="absolute top-3 left-3 bg-green-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
            Veg
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug line-clamp-2">
            {meal.strMeal}
          </h3>
          {/* Bookmark button — outside overflow-hidden so it's always clickable */}
          {onAdd && (
            <button
              onClick={() => onAdd(meal)}
              disabled={added}
              className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm border transition-colors ${
                added
                  ? 'bg-orange-500 border-orange-500 text-white'
                  : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-400 hover:text-orange-500 hover:border-orange-300'
              }`}
              title={added ? 'Added to planner' : 'Add to planner'}
            >
              {added ? (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M5 3h14a2 2 0 0 1 2 2v16l-8-4-8 4V5a2 2 0 0 1 2-2z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              )}
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {meal.strCategory && (
            <span className="text-xs text-orange-500 font-medium bg-orange-50 px-2 py-0.5 rounded-full">
              {meal.strCategory}
            </span>
          )}
          {meal.strArea && (
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
              {meal.strArea}
            </span>
          )}
        </div>

        {ingredients.length > 0 && (
          <details className="mt-3">
            <summary className="text-xs font-semibold text-gray-400 uppercase tracking-wide cursor-pointer hover:text-gray-600 transition-colors select-none">
              {ingredients.length} ingredients
            </summary>
            <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
              {ingredients.map((ing, i) => (
                <li key={i} className="flex gap-1.5">
                  <span className="text-orange-400 shrink-0">•</span>
                  {ing}
                </li>
              ))}
            </ul>
          </details>
        )}

        {meal.strInstructions && (
          <details className="mt-2">
            <summary className="text-xs font-semibold text-gray-400 uppercase tracking-wide cursor-pointer hover:text-gray-600 transition-colors select-none">
              How to cook
            </summary>
            <ol className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-2 list-none">
              {meal.strInstructions
                .split(/\r?\n/)
                .map(s => s.trim())
                .filter(Boolean)
                .map((step, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="shrink-0 font-semibold text-orange-400">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
            </ol>
            {meal.strYoutube && (
              <a
                href={meal.strYoutube}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-red-500 hover:text-red-600 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M23 7s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C16.2 2.8 12 2.8 12 2.8s-4.2 0-6.8.1c-.6.1-1.9.1-3 1.3C1.3 5 1 7 1 7S.7 9.1.7 11.3v2c0 2.1.3 4.2.3 4.2s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C7.4 21.7 12 21.7 12 21.7s4.2 0 6.8-.2c.6-.1 1.9-.1 3-1.3.9-.8 1.2-2.8 1.2-2.8s.3-2.1.3-4.2v-2C23.3 9.1 23 7 23 7zM9.7 15.5V8.4l8.1 3.6-8.1 3.5z"/>
                </svg>
                Watch on YouTube
              </a>
            )}
          </details>
        )}

        {onAdd && (
          <button
            onClick={() => onAdd(meal)}
            disabled={added}
            className={`mt-3 w-full py-2 rounded-xl text-xs font-semibold transition-colors ${
              added
                ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 cursor-default'
                : 'bg-orange-500 hover:bg-orange-600 text-white'
            }`}
          >
            {added ? '✓ Added to Planner' : '+ Add to Planner'}
          </button>
        )}
      </div>
    </div>
  );
}
