function parseMinutes(duration) {
  if (!duration || typeof duration !== 'string') {
    return 10;
  }

  const matches = duration.match(/\d+/g);
  if (!matches || matches.length === 0) {
    return 10;
  }

  const values = matches.map(Number).filter((value) => !Number.isNaN(value));
  if (values.length === 0) {
    return 10;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function normalizeExercise(problem, exercise) {
  const exerciseId = exercise.id || `${problem.problem}_${exercise.name}`;

  return {
    exercise_id: exerciseId,
    name: exercise.name,
    exercise_name: exercise.name,
    description: exercise.description || 'Follow the guided rehabilitation exercise as instructed.',
    target_metric: problem.problem,
    problem_targeted: problem.problem,
    severity: problem.severity,
    duration: exercise.duration || '10-15 minutes',
    frequency: exercise.frequency || '3-5 times per week',
    sets: exercise.sets || null,
    reps: exercise.reps || null,
    difficulty: exercise.difficulty || 'beginner',
    equipment: exercise.equipment || 'None',
    instructions: exercise.instructions || [],
    precautions: exercise.precautions || [],
    benefits: exercise.benefits || [],
    video_url: exercise.video_url || null,
    expected_improvement: exercise.expected_improvement || 'Varies by adherence and severity',
    detectable: Boolean(exercise.detectable),
    hardware_compatible: exercise.hardware_compatible !== false,
    requires_manual_validation: Boolean(exercise.requires_manual_validation),
    completed: false
  };
}

function buildTimeline(problemSummary, exercises) {
  const severeCount = problemSummary?.severe_count || 0;
  const moderateCount = problemSummary?.moderate_count || 0;
  let estimatedWeeks = 4;

  if (severeCount >= 2) {
    estimatedWeeks = 10;
  } else if (severeCount === 1) {
    estimatedWeeks = 8;
  } else if (moderateCount >= 3) {
    estimatedWeeks = 6;
  }

  return {
    estimated_weeks: estimatedWeeks,
    milestones: {
      [`week_${Math.max(1, Math.floor(estimatedWeeks / 2))}`]: 'Expect early gains in consistency and confidence',
      [`week_${estimatedWeeks}`]: 'Reassess gait metrics against initial baseline'
    },
    confidence: exercises.length > 0 ? 'moderate' : 'low',
    note: 'Timeline mirrors the extracted CVAPed Web starting recommendations and depends on exercise completion.'
  };
}

function buildDailyTimeCommitment(exercises) {
  const totalMinutes = exercises.reduce((sum, exercise) => sum + parseMinutes(exercise.duration), 0);
  const averageMinutes = Math.max(10, Math.round(totalMinutes / Math.max(exercises.length, 1)));

  return {
    average_minutes_per_day: averageMinutes,
    range: `${Math.max(10, averageMinutes - 10)}-${averageMinutes + 10} minutes`,
    note: 'Commitment reflects the extracted gait exercise recommendations.'
  };
}

function buildExercisePlanFromDetectedProblems(detectedProblems = [], problemSummary = null) {
  const dedupedExercises = new Map();

  detectedProblems.forEach((problem) => {
    (problem.exercises || []).forEach((exercise) => {
      const normalized = normalizeExercise(problem, exercise);
      if (!dedupedExercises.has(normalized.exercise_id)) {
        dedupedExercises.set(normalized.exercise_id, normalized);
      }
    });
  });

  const exercises = Array.from(dedupedExercises.values());

  return {
    exercises,
    total_exercises: exercises.length,
    estimated_timeline: buildTimeline(problemSummary, exercises),
    daily_time_commitment: buildDailyTimeCommitment(exercises)
  };
}

module.exports = {
  buildExercisePlanFromDetectedProblems
};
