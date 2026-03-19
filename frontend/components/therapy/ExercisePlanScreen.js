import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SafeAreaWrapper from '../SafeAreaWrapper';
import { exerciseApi } from '../../services/api';

const PROBLEM_LABELS = {
  slow_cadence: 'Slow cadence',
  asymmetric_gait: 'Asymmetric gait',
  short_stride: 'Short stride',
  slow_velocity: 'Slow walking speed',
  poor_stability: 'Poor stability',
  irregular_steps: 'Irregular steps',
};

const ExercisePlanScreen = ({ navigation, route }) => {
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const planId = route?.params?.planId;

  const loadPlanById = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await exerciseApi.getPlanById(id);
      console.log('getPlanById response:', response);
      if (response.success && response.plan) {
        setPlan(response.plan);
      } else {
        Alert.alert('No Plan', 'Exercise plan not found.');
      }
    } catch (error) {
      console.error('Error loading exercise plan:', error);
      Alert.alert('Error', 'Failed to load exercise plan');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTodaysPlan = useCallback(async () => {
    try {
      setLoading(true);
      const response = await exerciseApi.getTodaysPlan();
      console.log('getTodaysPlan response:', response);
      if (response.success && response.plan) {
        setPlan(response.plan);
      } else {
        Alert.alert('No Plan', 'No exercise plan found for today.');
      }
    } catch (error) {
      console.error('Error loading exercise plan:', error);
      Alert.alert('Error', 'Failed to load exercise plan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (planId) {
      loadPlanById(planId);
    } else {
      loadTodaysPlan();
    }
  }, [loadPlanById, loadTodaysPlan, planId]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'severe': return '#DC2626';
      case 'moderate': return '#F59E0B';
      case 'mild': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getSeverityBadgeStyle = (severity) => ({
    ...styles.severityBadge,
    backgroundColor: getSeverityColor(severity),
  });

  const getRiskLevelColor = (riskLevel) => {
    switch (riskLevel) {
      case 'high': return '#DC2626';
      case 'moderate': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const handleViewExerciseDetails = (exercise) => {
    setSelectedExercise(exercise);
    setShowDetailModal(true);
  };

  const handleStartExercises = () => {
    navigation.navigate('ExerciseChecklist', { 
      planId: plan._id,
      exercises: plan.exercises 
    });
  };

  const handleHeaderBack = () => {
    navigation.goBack();
  };

  const formatProblemName = (problem) => {
    if (!problem) return 'Unknown issue';
    return PROBLEM_LABELS[problem] || problem.replace(/_/g, ' ');
  };

  if (loading) {
    return (
      <SafeAreaWrapper style={styles.safeArea} disableTopInset>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
          <Text style={styles.loadingText}>Loading exercise plan...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  if (!plan) {
    return (
      <SafeAreaWrapper style={styles.safeArea} disableTopInset>
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No Exercise Plan</Text>
          <Text style={styles.emptyText}>
            Complete a gait analysis to receive personalized exercise recommendations.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('GaitAnalysis')}
          >
            <Text style={styles.primaryButtonText}>Start Gait Analysis</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaWrapper>
    );
  }

  const completionPercentage = Math.round(plan.completion_percentage || 0);
  const riskLevel = plan.problem_summary?.risk_level || plan.detected_problems?.[0]?.risk_level || 'moderate';
  const timelineWeeks = plan.estimated_timeline?.estimated_weeks || 4;
  const dailyMinutes = plan.daily_time_commitment?.average_minutes_per_day || 0;
  const severeCount = plan.problem_summary?.severe_count || 0;
  const moderateCount = plan.problem_summary?.moderate_count || 0;

  return (
    <SafeAreaWrapper style={styles.safeArea} disableTopInset>
      <View style={styles.container}>
        <View style={styles.screenHeader}>
          <TouchableOpacity style={styles.headerBackButton} onPress={handleHeaderBack}>
            <Ionicons name="arrow-back" size={22} color="#333333" />
          </TouchableOpacity>
          <Text style={styles.screenHeaderTitle}>Therapy</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentScrollContainer}>
        <View style={styles.headerCard}>
          <View style={styles.planBadgeRow}>
            <View style={styles.planBadge}>
              <Ionicons name="medkit-outline" size={16} color="#991B1B" />
              <Text style={styles.planBadgeText}>CVAPed rehab plan</Text>
            </View>
            <View style={[styles.riskBadge, { backgroundColor: getRiskLevelColor(riskLevel) }]}>
              <Text style={styles.riskBadgeText}>{riskLevel.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.headerRow}>
            <View style={styles.heroTextWrap}>
              <Text style={styles.headerTitle}>Your exercise prescription</Text>
              <Text style={styles.headerDate}>
                {new Date(plan.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
              <Text style={styles.headerSummary}>
                {plan.problem_summary?.summary || 'This plan was built from your latest gait analysis.'}
              </Text>
            </View>
          </View>

          <View style={styles.processCardRow}>
            <View style={styles.processCard}>
              <Text style={styles.processValue}>{plan.total_exercises}</Text>
              <Text style={styles.processLabel}>Exercises</Text>
            </View>
            <View style={styles.processCard}>
              <Text style={styles.processValue}>{timelineWeeks} wk</Text>
              <Text style={styles.processLabel}>Timeline</Text>
            </View>
            <View style={styles.processCard}>
              <Text style={styles.processValue}>{dailyMinutes || '--'}</Text>
              <Text style={styles.processLabel}>Min/day</Text>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={styles.progressPercentage}>{completionPercentage}%</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBarFill, { width: `${completionPercentage}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {plan.exercises_completed} of {plan.total_exercises} exercises completed
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="analytics" size={24} color="#C9302C" />
            <Text style={styles.sectionTitle}>Process Overview</Text>
          </View>

          <View style={styles.overviewGrid}>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewCardLabel}>Step 1</Text>
              <Text style={styles.overviewCardTitle}>Assessment</Text>
              <Text style={styles.overviewCardText}>
                Your gait recording was analyzed and identified {plan.problem_summary?.total_problems || 0} findings.
              </Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewCardLabel}>Step 2</Text>
              <Text style={styles.overviewCardTitle}>Problem Detection</Text>
              <Text style={styles.overviewCardText}>
                Severity was prioritized into {severeCount} severe and {moderateCount} moderate mobility concerns.
              </Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewCardLabel}>Step 3</Text>
              <Text style={styles.overviewCardTitle}>Exercise Plan</Text>
              <Text style={styles.overviewCardText}>
                Follow {plan.total_exercises} prescribed exercises for {plan.daily_time_commitment?.range || 'daily practice'} across {timelineWeeks} weeks.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="alert-circle" size={24} color="#DC2626" />
            <Text style={styles.sectionTitle}>Detected Findings</Text>
          </View>

          {plan.detected_problems?.map((problem) => (
            <View key={problem.problem} style={styles.problemCard}>
              <View style={styles.problemHeader}>
                <Text style={styles.problemTitle}>
                  {formatProblemName(problem.problem || problem.type || 'unknown')}
                </Text>
                <View style={getSeverityBadgeStyle(problem.severity)}>
                  <Text style={styles.severityBadgeText}>{problem.severity || 'unknown'}</Text>
                </View>
              </View>
              <Text style={styles.problemDescription}>{problem.description || 'No description available'}</Text>
              {problem.impact ? (
                <Text style={styles.problemImpact}>{problem.impact}</Text>
              ) : null}
              <View style={styles.problemMetric}>
                <Text style={styles.metricLabel}>Your Value:</Text>
                <Text style={styles.metricValue}>{problem.current_value || problem.user_value || 'N/A'}</Text>
              </View>
              <View style={styles.problemMetric}>
                <Text style={styles.metricLabel}>Normal Range:</Text>
                <Text style={styles.metricValue}>{problem.normal_range || 'N/A'}</Text>
              </View>
              {problem.percentile ? (
                <Text style={styles.problemPercentile}>Percentile: {problem.percentile}th</Text>
              ) : null}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time" size={24} color="#7C3AED" />
            <Text style={styles.sectionTitle}>Recovery Timeline</Text>
          </View>

          <View style={styles.timelineCard}>
            <Text style={styles.timelineTitle}>Estimated duration</Text>
            <Text style={styles.timelineWeeks}>{timelineWeeks} weeks</Text>
            <Text style={styles.timelineConfidence}>
              Confidence: {plan.estimated_timeline?.confidence || 'moderate'}
            </Text>
            <Text style={styles.timelineNote}>
              {plan.estimated_timeline?.note || 'Keep completing the recommended sessions before retesting.'}
            </Text>

            {plan.estimated_timeline?.milestones ? (
              <View style={styles.milestones}>
                <Text style={styles.milestonesTitle}>Milestones</Text>
                {Object.entries(plan.estimated_timeline.milestones).map(([week, text]) => (
                  <Text key={week} style={styles.milestoneItem}>• {week.replace(/_/g, ' ')}: {text}</Text>
                ))}
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="fitness" size={24} color="#0066CC" />
            <Text style={styles.sectionTitle}>Recommended Exercises</Text>
          </View>
          {plan.exercises?.map((exercise, index) => (
            <View key={exercise.exercise_id} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <View style={styles.exerciseNumberBadge}>
                  <Text style={styles.exerciseNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.exerciseTitleSection}>
                  <Text style={styles.exerciseTitle}>{exercise.exercise_name || exercise.name}</Text>
                  <View style={styles.exerciseMeta}>
                    <Ionicons name="time-outline" size={14} color="#6B7280" />
                    <Text style={styles.exerciseMetaText}>{exercise.duration}</Text>
                  </View>
                </View>
                {exercise.completed && (
                  <Ionicons name="checkmark-circle" size={28} color="#10B981" />
                )}
              </View>

              <Text style={styles.exerciseDescription} numberOfLines={2}>
                {exercise.description}
              </Text>

              <View style={styles.exerciseTagsRow}>
                <View style={styles.exerciseTag}>
                  <Text style={styles.exerciseTagText}>{exercise.frequency || '3-5x weekly'}</Text>
                </View>
                <View style={styles.exerciseTag}>
                  <Text style={styles.exerciseTagText}>{exercise.difficulty || 'beginner'}</Text>
                </View>
                <View style={styles.exerciseTag}>
                  <Text style={styles.exerciseTagText}>{formatProblemName(exercise.problem_targeted || exercise.target_metric || 'general')}</Text>
                </View>
              </View>

              {exercise.instructions?.length > 0 && (
                <View style={styles.instructionsPreview}>
                  <Text style={styles.instructionItem}>
                    • {exercise.instructions[0]}
                  </Text>
                  {exercise.instructions.length > 1 && (
                    <Text style={styles.moreInstructions}>
                      +{exercise.instructions.length - 1} more steps
                    </Text>
                  )}
                </View>
              )}

              {exercise.expected_improvement ? (
                <Text style={styles.expectedImprovement}>Expected improvement: {exercise.expected_improvement}</Text>
              ) : null}

              <TouchableOpacity
                style={styles.detailsButton}
                onPress={() => handleViewExerciseDetails(exercise)}
              >
                <Text style={styles.detailsButtonText}>View Full Instructions</Text>
                <Ionicons name="chevron-forward" size={16} color="#0066CC" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Start Button */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[
              styles.startButton,
              plan.all_exercises_completed && styles.startButtonCompleted
            ]}
            onPress={handleStartExercises}
          >
            <Ionicons 
              name={plan.all_exercises_completed ? "checkmark-circle" : "play-circle"} 
              size={24} 
              color="#FFFFFF" 
            />
            <Text style={styles.startButtonText}>
              {plan.all_exercises_completed ? 'Review Exercises' : 'Start Exercises'}
            </Text>
          </TouchableOpacity>

          {plan.can_retest_gait && (
            <View style={styles.retestNotice}>
              <Ionicons name="information-circle" size={20} color="#10B981" />
              <Text style={styles.retestNoticeText}>
                You can now re-test your gait to track improvement!
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
        </ScrollView>

      {/* Exercise Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedExercise?.exercise_name || selectedExercise?.name}</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={28} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalDescription}>{selectedExercise?.description}</Text>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Instructions</Text>
                {selectedExercise?.instructions?.map((instruction, index) => (
                  <View key={`${selectedExercise?.exercise_id || selectedExercise?.name}-instruction-${instruction}`} style={styles.instructionRow}>
                    <View style={styles.instructionNumberBadge}>
                      <Text style={styles.instructionNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.instructionText}>{instruction}</Text>
                  </View>
                ))}
              </View>

              {selectedExercise?.precautions?.length > 0 && (
                <View style={styles.modalSection}>
                  <View style={styles.precautionHeader}>
                    <Ionicons name="warning" size={20} color="#F59E0B" />
                    <Text style={styles.modalSectionTitle}>Precautions</Text>
                  </View>
                  {selectedExercise.precautions.map((precaution) => (
                    <Text key={`${selectedExercise?.exercise_id || selectedExercise?.name}-precaution-${precaution}`} style={styles.precautionText}>• {precaution}</Text>
                  ))}
                </View>
              )}

              {selectedExercise?.benefits?.length > 0 && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Benefits</Text>
                  {selectedExercise.benefits.map((benefit) => (
                    <Text key={`${selectedExercise?.exercise_id || selectedExercise?.name}-benefit-${benefit}`} style={styles.benefitText}>✓ {benefit}</Text>
                  ))}
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowDetailModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </View>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  contentScroll: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  contentScrollContainer: {
    paddingTop: 12,
    paddingBottom: 12,
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  screenHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  headerBackButton: {
    width: 34,
    alignItems: 'flex-start',
  },
  headerRight: {
    width: 34,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginHorizontal: 16,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3D4D3',
  },
  planBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  planBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#991B1B',
    textTransform: 'uppercase',
  },
  headerRow: {
    marginBottom: 20,
  },
  heroTextWrap: {
    gap: 6,
  },
  headerSummary: {
    fontSize: 14,
    lineHeight: 21,
    color: '#6B7280',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  processCardRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  processCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  processValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  processLabel: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  riskBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressSection: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0066CC',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0066CC',
  },
  progressText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 6,
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 18,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 8,
  },
  overviewGrid: {
    gap: 12,
  },
  overviewCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 14,
  },
  overviewCardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C9302C',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  overviewCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  overviewCardText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4B5563',
  },
  problemCard: {
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  problemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  problemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#991B1B',
    flex: 1,
    textTransform: 'capitalize',
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  severityBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  problemDescription: {
    fontSize: 14,
    color: '#7F1D1D',
    marginBottom: 8,
    lineHeight: 20,
  },
  problemImpact: {
    fontSize: 13,
    color: '#991B1B',
    lineHeight: 19,
    marginBottom: 12,
  },
  problemMetric: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  problemPercentile: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#991B1B',
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#991B1B',
    width: 110,
  },
  metricValue: {
    fontSize: 13,
    color: '#7F1D1D',
  },
  exerciseCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0066CC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exerciseNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  exerciseTitleSection: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseMetaText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 4,
  },
  exerciseDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  exerciseTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  exerciseTag: {
    backgroundColor: '#EFF6FF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  exerciseTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D4ED8',
    textTransform: 'capitalize',
  },
  instructionsPreview: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  instructionItem: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  moreInstructions: {
    fontSize: 12,
    color: '#0066CC',
    fontWeight: '600',
    marginTop: 6,
  },
  expectedImprovement: {
    fontSize: 13,
    color: '#065F46',
    lineHeight: 18,
    marginBottom: 10,
    fontWeight: '600',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066CC',
    marginRight: 4,
  },
  timelineCard: {
    backgroundColor: '#F5F3FF',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5B21B6',
    marginBottom: 8,
  },
  timelineWeeks: {
    fontSize: 32,
    fontWeight: '700',
    color: '#6D28D9',
    marginBottom: 4,
  },
  timelineConfidence: {
    fontSize: 13,
    color: '#7C3AED',
    marginBottom: 8,
  },
  timelineNote: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6D28D9',
    marginBottom: 12,
  },
  milestones: {
    borderTopWidth: 1,
    borderTopColor: '#DDD6FE',
    paddingTop: 12,
  },
  milestonesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5B21B6',
    marginBottom: 8,
  },
  milestoneItem: {
    fontSize: 13,
    color: '#6D28D9',
    marginBottom: 4,
  },
  actionSection: {
    padding: 16,
  },
  startButton: {
    backgroundColor: '#0066CC',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  startButtonCompleted: {
    backgroundColor: '#10B981',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  retestNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  retestNoticeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
    marginLeft: 8,
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginTop: 16,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  modalBody: {
    padding: 20,
  },
  modalDescription: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  instructionRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  instructionNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  instructionNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  precautionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  precautionText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
    marginBottom: 6,
  },
  benefitText: {
    fontSize: 14,
    color: '#065F46',
    lineHeight: 20,
    marginBottom: 6,
  },
  modalCloseButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default ExercisePlanScreen;
