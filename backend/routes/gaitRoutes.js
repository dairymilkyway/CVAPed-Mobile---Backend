const express = require('express');
const axios = require('axios');
const router = express.Router();
const GaitProgress = require('../models/GaitProgress');
const ExercisePlan = require('../models/ExercisePlan');
const { protect } = require('../middleware/auth');
const { getServiceUrl } = require('../config/runtime');

const GAIT_SERVICE_URL = getServiceUrl('GAIT_ANALYSIS_URL', 5001);
const EXERCISE_SERVICE_URL = getServiceUrl('THERAPY_URL', 5002);

console.log(`✓ Gait Analysis Service configured at: ${GAIT_SERVICE_URL}`);
console.log(`✓ Exercise Service configured at: ${EXERCISE_SERVICE_URL}`);

/**
 * @route   GET /api/gait/health
 * @desc    Check gait analysis service health
 * @access  Public
 */
router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`${GAIT_SERVICE_URL}/health`);
    res.json(response.data);
  } catch (error) {
    console.error('Gait service health check failed:', error.message);
    res.status(503).json({
      success: false,
      message: 'Gait analysis service is unavailable',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/gait/analyze
 * @desc    Analyze gait data from accelerometer and gyroscope
 * @access  Private
 */
router.post('/analyze', protect, async (req, res) => {
  try {
    const { 
      accelerometer, 
      gyroscope, 
      magnetometer, 
      barometer, 
      deviceMotion, 
      pedometer, 
      session_id 
    } = req.body;
    const user_id = req.user._id; // Get user ID from authenticated user

    // Validate required data
    if (!accelerometer && !gyroscope) {
      return res.status(400).json({
        success: false,
        message: 'At least one sensor type (accelerometer or gyroscope) is required'
      });
    }

    // Check if user can perform gait analysis today
    const canAnalyze = await ExercisePlan.canPerformGaitAnalysis(user_id);
    
    if (!canAnalyze.allowed) {
      return res.status(403).json({
        success: false,
        allowed: false,
        reason: canAnalyze.reason,
        message: canAnalyze.message,
        exercises_remaining: canAnalyze.exercises_remaining,
        completion_percentage: canAnalyze.completion_percentage
      });
    }

    // Forward request to Python service with all sensor data
    const response = await axios.post(`${GAIT_SERVICE_URL}/api/gait/analyze`, {
      accelerometer,
      gyroscope,
      magnetometer: magnetometer || [],
      barometer: barometer || [],
      deviceMotion: deviceMotion || [],
      pedometer: pedometer || {},
      user_id: user_id.toString(),
      session_id
    }, {
      timeout: 30000 // 30 second timeout
    });

    // Validate gait analysis quality
    if (response.data.success) {
      const analysisData = response.data.data;
      const metrics = analysisData.metrics;
      const duration = analysisData.analysis_duration;
      const sensorStepCount = Number(metrics.step_count || 0);
      const pedometerStepCount = Number(metrics.pedometer_steps || pedometer?.steps || 0);
      const stepCount = Math.max(sensorStepCount, pedometerStepCount);

      metrics.step_count = stepCount;

      // VALIDATION RULES
      const MIN_DURATION = 30; // seconds
      const MIN_STEPS = 15;
      
      const isValid = duration >= MIN_DURATION && stepCount >= MIN_STEPS;
      
      if (!isValid) {
        return res.status(400).json({
          success: false,
          valid: false,
          message: 'Gait analysis does not meet minimum requirements',
          validation: {
            duration: {
              value: duration,
              required: MIN_DURATION,
              passed: duration >= MIN_DURATION
            },
            steps: {
              value: stepCount,
              required: MIN_STEPS,
              passed: stepCount >= MIN_STEPS
            }
          },
          recommendation: `Please walk for at least ${MIN_DURATION} seconds and take at least ${MIN_STEPS} steps. You can retry immediately.`
        });
      }
      
      // Analysis is valid - proceed with problem detection
      let problemsData = null;
      try {
        const problemsResponse = await axios.post(`${GAIT_SERVICE_URL}/api/gait/detect-problems`, {
          metrics: metrics
        }, {
          timeout: 5000
        });
        
        if (problemsResponse.data.success) {
          problemsData = problemsResponse.data;
          console.log(`  ✓ Problem detection: ${problemsData.problems_detected} issue(s) found`);
        }
      } catch (problemError) {
        console.error('  ⚠️  Problem detection failed:', problemError.message);
      }
      
      // Save to database
      let savedGaitAnalysis = null;
      try {
        const gaitProgress = new GaitProgress({
          user_id: user_id,
          session_id: session_id || `session_${Date.now()}`,
          metrics: metrics,
          gait_phases: analysisData.gait_phases,
          analysis_duration: duration,
          data_quality: analysisData.data_quality,
          sensors_used: analysisData.sensors_used,
          detected_problems: problemsData ? problemsData.problems : [],
          problem_summary: problemsData ? problemsData.summary : null
        });

        savedGaitAnalysis = await gaitProgress.save();
        
        console.log('✓ Valid gait analysis saved');
        console.log(`  Duration: ${duration}s (✓ >= ${MIN_DURATION}s)`);
        console.log(`  Steps: ${stepCount} (✓ >= ${MIN_STEPS})`);
        
        // Add to response
        response.data.data.gait_analysis_id = savedGaitAnalysis._id;
        if (problemsData) {
          response.data.data.detected_problems = problemsData.problems;
          response.data.data.problem_summary = problemsData.summary;
        }
        
      } catch (dbError) {
        console.error('❌ Error saving gait analysis:', dbError.message);
      }
      
      // Generate exercise recommendations if problems detected
      let exercisePlan = null;
      if (problemsData && problemsData.problems_detected > 0 && savedGaitAnalysis) {
        try {
          console.log('  ⚙️  Generating exercise recommendations...');
          
          // Build user profile (with defaults)
          const userProfile = {
            age: req.user.age || 65,
            fitness_level: req.user.fitness_level || 'moderate',
            equipment_available: req.user.equipment_available || ['none'],
            time_available_per_day: req.user.time_available_per_day || 30,
            stroke_side: req.user.stroke_side || 'right',
            months_post_stroke: req.user.months_post_stroke || 6
          };
          
          // Call exercise recommendation service
          const exerciseResponse = await axios.post(`${EXERCISE_SERVICE_URL}/api/exercises/recommend`, {
            user_id: user_id.toString(),
            gait_analysis_id: savedGaitAnalysis._id.toString(),
            detected_problems: problemsData.problems,
            user_profile: userProfile
          }, {
            timeout: 10000
          });
          
          if (exerciseResponse.data.success && exerciseResponse.data.recommendations) {
            const recData = exerciseResponse.data.recommendations;
            
            console.log('  📋 Python response structure:');
            console.log('     - recommendations:', recData.recommendations ? 'present' : 'missing');
            console.log('     - estimated_timeline:', JSON.stringify(recData.estimated_timeline));
            console.log('     - daily_time_commitment:', JSON.stringify(recData.daily_time_commitment));
            
            // Flatten exercises from all problem recommendations
            const allExercises = [];
            if (recData.recommendations && Array.isArray(recData.recommendations)) {
              recData.recommendations.forEach(problemRec => {
                if (problemRec.exercises && Array.isArray(problemRec.exercises)) {
                  problemRec.exercises.forEach(ex => {
                    allExercises.push({
                      exercise_id: ex.id,
                      exercise_name: ex.name,
                      description: ex.description,
                      target_metric: ex.target_metric,
                      problem_targeted: problemRec.problem,
                      duration: ex.duration,
                      frequency: ex.frequency,
                      sets: ex.sets,
                      reps: ex.reps,
                      difficulty: ex.difficulty,
                      equipment: ex.equipment,
                      instructions: ex.instructions,
                      precautions: ex.precautions,
                      benefits: ex.benefits,
                      video_url: ex.video_url,
                      expected_improvement: ex.expected_improvement,
                      completed: false
                    });
                  });
                }
              });
            }
            
            // Save exercise plan to MongoDB
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            exercisePlan = new ExercisePlan({
              user_id: user_id,
              date: today,
              gait_analysis_id: savedGaitAnalysis._id,
              detected_problems: problemsData.problems,
              exercises: allExercises,
              total_exercises: allExercises.length,
              estimated_timeline: {
                weeks: recData.estimated_timeline?.estimated_weeks || 4,
                sessions_per_week: 5,
                total_sessions: (recData.estimated_timeline?.estimated_weeks || 4) * 5,
                milestones: recData.estimated_timeline?.milestones || {},
                confidence: recData.estimated_timeline?.confidence || 'moderate',
                note: recData.estimated_timeline?.note || ''
              },
              daily_time_commitment: {
                average_minutes: recData.daily_time_commitment?.average_minutes_per_day || 30,
                range: recData.daily_time_commitment?.range || '20-40 minutes',
                note: recData.daily_time_commitment?.note || ''
              },
              status: 'active',
              completed_exercises: [],
              exercises_completed: false,
              can_retest_gait: false
            });
            
            await exercisePlan.save();
            
            response.data.data.exercise_plan_id = exercisePlan._id;
            response.data.data.exercises_recommended = exercisePlan.total_exercises;
            console.log(`  ✓ Exercise plan created: ${exercisePlan.total_exercises} exercises`);
            console.log(`  Estimated timeline: ${exercisePlan.estimated_timeline.weeks} weeks`);
          }
        } catch (exerciseError) {
          console.error('  ⚠️  Exercise recommendation failed:', exerciseError.message);
          if (exerciseError.response) {
            console.error('  Response data:', exerciseError.response.data);
          }
          // Continue without exercise plan - user can still view gait results
        }
      }
      
      // Mark if this is a retest
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todaysPlan = await ExercisePlan.findOne({
        user_id,
        date: today
      });
      
      if (todaysPlan && canAnalyze.reason === 'exercises_completed') {
        todaysPlan.gait_retested = true;
        todaysPlan.retest_gait_analysis_id = savedGaitAnalysis._id;
        await todaysPlan.save();
        console.log('  ✓ Marked as retest after exercises');
      }
    }

    res.json({
      ...response.data,
      valid: true,
      can_analyze_reason: canAnalyze.reason
    });
    
  } catch (error) {
    console.error('Gait analysis error:', error.message);
    
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to analyze gait data',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/gait/realtime
 * @desc    Real-time gait analysis for streaming data
 * @access  Private (add auth middleware if needed)
 */
router.post('/realtime', protect, async (req, res) => {
  try {
    const { accelerometer, gyroscope } = req.body;

    // Forward request to Python service
    const response = await axios.post(`${GAIT_SERVICE_URL}/api/gait/realtime`, {
      accelerometer,
      gyroscope
    }, {
      timeout: 5000 // 5 second timeout for realtime
    });

    res.json(response.data);
  } catch (error) {
    console.error('Real-time analysis error:', error.message);
    
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to process real-time data',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/gait/history
 * @desc    Get gait analysis history for authenticated user
 * @access  Private
 */
router.get('/history', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 10;

    // Fetch from MongoDB
    const gaitHistory = await GaitProgress.find({ user_id: userId })
      .sort({ created_at: -1 })
      .limit(limit);

    res.json({
      success: true,
      data: gaitHistory,
      count: gaitHistory.length
    });
  } catch (error) {
    console.error('History fetch error:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gait history',
      error: error.message
    });
  }
});

module.exports = router;
