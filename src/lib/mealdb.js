const BASE = 'https://www.themealdb.com/api/json/v1/1';

export async function searchMeals(query) {
  const res = await fetch(`${BASE}/search.php?s=${encodeURIComponent(query)}`);
  const data = await res.json();
  return data.meals || [];
}

export async function getRandomMeal() {
  const res = await fetch(`${BASE}/random.php`);
  const data = await res.json();
  return data.meals?.[0] || null;
}

export async function getMealById(id) {
  const res = await fetch(`${BASE}/lookup.php?i=${id}`);
  const data = await res.json();
  return data.meals?.[0] || null;
}

export async function getVegetarianMeals() {
  const res = await fetch(`${BASE}/filter.php?c=Vegetarian`);
  const data = await res.json();
  return data.meals || [];
}

export async function getRandomVegetarianMeal() {
  const meals = await getVegetarianMeals();
  if (!meals.length) return null;
  const random = meals[Math.floor(Math.random() * meals.length)];
  return getMealById(random.idMeal);
}

export async function filterByIngredient(ingredient) {
  const res = await fetch(`${BASE}/filter.php?i=${encodeURIComponent(ingredient)}`);
  const data = await res.json();
  return data.meals || [];
}

export async function filterByCategory(category) {
  const res = await fetch(`${BASE}/filter.php?c=${encodeURIComponent(category)}`);
  const data = await res.json();
  return data.meals || [];
}

export async function listAreas() {
  const res = await fetch(`${BASE}/list.php?a=list`);
  const data = await res.json();
  return (data.meals || []).map(m => m.strArea).sort();
}

export async function filterByArea(area) {
  const res = await fetch(`${BASE}/filter.php?a=${encodeURIComponent(area)}`);
  const data = await res.json();
  return data.meals || [];
}
