import { useState, useEffect, useCallback } from 'react';
import WeekPlanner from '../components/WeekPlanner';
import { supabase } from '../lib/supabase';

function getWeekStart(offsetWeeks = 0) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff + offsetWeeks * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function formatWeekLabel(monday) {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const opts = { day: 'numeric', month: 'short' };
  return `${monday.toLocaleDateString('en-GB', opts)} – ${sunday.toLocaleDateString('en-GB', opts)}`;
}

export default function Planner({ user }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [slots, setSlots] = useState({});
  const [planId, setPlanId] = useState(null);
  const [loading, setLoading] = useState(true);

  const weekStart = getWeekStart(weekOffset);
  const weekStartStr = weekStart.toISOString().split('T')[0];

  const loadPlan = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: plan } = await supabase
      .from('meal_plans')
      .select('id')
      .eq('week_start', weekStartStr)
      .eq('created_by', user.id)
      .single();

    if (!plan) {
      setSlots({});
      setPlanId(null);
      setLoading(false);
      return;
    }

    setPlanId(plan.id);

    const { data: slotRows } = await supabase
      .from('plan_slots')
      .select('*')
      .eq('plan_id', plan.id);

    const { data: voteRows } = await supabase
      .from('votes')
      .select('slot_id, vote')
      .in('slot_id', (slotRows || []).map(s => s.id));

    const slotMap = {};
    for (const slot of slotRows || []) {
      const slotVotes = (voteRows || []).filter(v => v.slot_id === slot.id);
      slotMap[slot.day_of_week] = {
        ...slot,
        upvotes: slotVotes.filter(v => v.vote === 1).length,
        downvotes: slotVotes.filter(v => v.vote === -1).length,
      };
    }
    setSlots(slotMap);
    setLoading(false);
  }, [user, weekStartStr]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  async function handlePropose(day, meal) {
    if (!user) return;

    let currentPlanId = planId;

    if (!currentPlanId) {
      const { data: newPlan } = await supabase
        .from('meal_plans')
        .insert({ week_start: weekStartStr, created_by: user.id })
        .select('id')
        .single();
      if (!newPlan) return;
      currentPlanId = newPlan.id;
      setPlanId(currentPlanId);
    }

    // Remove existing slot for the day if any
    if (slots[day]) {
      await supabase.from('plan_slots').delete().eq('id', slots[day].id);
    }

    await supabase.from('plan_slots').insert({
      plan_id: currentPlanId,
      day_of_week: day,
      meal_id: meal.idMeal,
      meal_name: meal.strMeal,
      meal_thumb: meal.strMealThumb,
      proposed_by: user.id,
    });

    await loadPlan();
  }

  async function handleVote(slot, voteValue) {
    if (!user || !slot) return;

    const { data: existing } = await supabase
      .from('votes')
      .select('id, vote')
      .eq('slot_id', slot.id)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      if (existing.vote === voteValue) {
        // Remove vote (toggle off)
        await supabase.from('votes').delete().eq('id', existing.id);
      } else {
        // Change vote
        await supabase.from('votes').update({ vote: voteValue }).eq('id', existing.id);
      }
    } else {
      await supabase.from('votes').insert({ slot_id: slot.id, user_id: user.id, vote: voteValue });
    }

    await loadPlan();
  }

  return (
    <div className="px-6 py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Weekly Planner</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Week of {formatWeekLabel(weekStart)}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setWeekOffset(w => w - 1)}
              className="flex items-center gap-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              ← Prev
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-colors"
            >
              This week
            </button>
            <button
              onClick={() => setWeekOffset(w => w + 1)}
              className="flex items-center gap-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3 animate-pulse">📅</div>
            <p className="text-gray-400 dark:text-gray-500">Loading your meal plan...</p>
          </div>
        ) : (
          <WeekPlanner slots={slots} onPropose={handlePropose} onVote={handleVote} />
        )}
      </div>
    </div>
  );
}
