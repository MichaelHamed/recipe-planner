export default function MealCard({ meal, onAdd }) {
  if (!meal) return null;

  const isVegetarian = meal.strCategory === 'Vegetarian';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden flex flex-col transition-transform hover:scale-[1.02]">
      {meal.strMealThumb && (
        <div className="relative">
          <img
            src={meal.strMealThumb}
            alt={meal.strMeal}
            className="w-full h-48 object-cover"
          />
          {isVegetarian && (
            <span className="absolute top-2 right-2 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
              Vegetarian
            </span>
          )}
        </div>
      )}
      <div className="p-4 flex flex-col flex-1 gap-2">
        <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug line-clamp-2">
          {meal.strMeal}
        </h3>
        <div className="flex flex-wrap gap-1 mt-auto">
          {meal.strCategory && (
            <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-medium px-2 py-0.5 rounded-full">
              {meal.strCategory}
            </span>
          )}
          {meal.strArea && (
            <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium px-2 py-0.5 rounded-full">
              {meal.strArea}
            </span>
          )}
        </div>
        {onAdd && (
          <button
            onClick={() => onAdd(meal)}
            className="mt-3 w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
          >
            Add to Planner
          </button>
        )}
      </div>
    </div>
  );
}
