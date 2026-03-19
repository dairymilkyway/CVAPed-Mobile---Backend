import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SafeAreaWrapper from '../SafeAreaWrapper';
import { exerciseApi } from '../../services/api';

const ExerciseChecklistScreen = ({ navigation, route }) => {
  const { planId } = route.params;
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [markingComplete, setMarkingComplete] = useState(false);

  const loadPlanDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await exerciseApi.getTodaysPlan();
      if (response.success && response.plan) {
        setPlan(response.plan);
      }
    } catch (error) {
      console.error('Error loading plan:', error);
      Alert.alert('Error', 'Failed to load exercise plan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlanDetails();
  }, [loadPlanDetails]);

  const handleExercisePress = (exercise) => {
    if (exercise.completed) {
      Alert.alert(
        'Undo Completion?',
        `Mark "${exercise.exercise_name || exercise.name}" as incomplete?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Undo',
            style: 'destructive',
            onPress: () => handleUndoComplete(exercise)
          }
        ]
      );
      return;
    }

    Alert.alert(
      'Mark as Complete?',
      `Have you completed "${exercise.exercise_name || exercise.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Complete',
          onPress: () => handleMarkComplete(exercise)
        }
      ]
    );
  };

  const handleMarkComplete = async (exercise) => {
    try {
      setMarkingComplete(true);
      const response = await exerciseApi.markExerciseComplete(
        planId,
        exercise.exercise_id,
        3, // Default rating for testing
        'Manually completed (testing)'
      );

      if (response.success) {
        await loadPlanDetails();
        
        // Check if all exercises are done
        if (plan && plan.all_exercises_completed) {
          setTimeout(() => {
            Alert.alert(
              'All Exercises Completed! 🏆',
              'Excellent work! You can now re-test your gait to track your improvement.',
              [
                { text: 'Later', style: 'cancel' },
                {
                  text: 'Retest Now',
                  onPress: () => navigation.navigate('GaitAnalysis')
                }
              ]
            );
          }, 500);
        }
      }
    } catch (error) {
      console.error('Error marking exercise complete:', error);
      Alert.alert('Error', 'Failed to mark exercise as complete');
    } finally {
      setMarkingComplete(false);
    }
  };

  const handleUndoComplete = async (exercise) => {
    try {
      setMarkingComplete(true);
      const response = await exerciseApi.undoExerciseComplete(planId, exercise.exercise_id);
      
      if (response.success) {
        await loadPlanDetails();
        Alert.alert('Success', 'Exercise marked as incomplete');
      }
    } catch (error) {
      console.error('Error undoing exercise completion:', error);
      Alert.alert('Error', 'Failed to undo completion');
    } finally {
      setMarkingComplete(false);
    }
  };

  const handleMarkAllComplete = () => {
    Alert.alert(
      'Mark All Complete?',
      'This will mark all exercises as complete. Use this only for testing or if you completed all exercises elsewhere.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark All',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await exerciseApi.markAllExercisesComplete(planId);
              if (response.success) {
                await loadPlanDetails();
                Alert.alert(
                  'All Completed! 🏆',
                  'All exercises marked as complete. You can now retest your gait!',
                  [
                    { text: 'OK' }
                  ]
                );
              }
            } catch (error) {
              console.error('Error marking all complete:', error);
              Alert.alert('Error', 'Failed to mark exercises complete');
            }
          }
        }
      ]
    );
  };

  if (loading || !plan) {
    return (
      <SafeAreaWrapper style={styles.safeArea} disableTopInset>
        <View style={styles.loadingContainer}>
          <Text>Loading exercises...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  const completionPercentage = Math.round(plan.completion_percentage || 0);
  const completedCount = plan.exercises_completed;
  const totalCount = plan.total_exercises;

  return (
    <SafeAreaWrapper style={styles.safeArea} disableTopInset>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Exercise Checklist</Text>
          <TouchableOpacity onPress={handleMarkAllComplete} style={styles.markAllButton}>
            <Ionicons name="checkmark-done" size={24} color="#0066CC" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentScrollContainer}>
        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Today's Progress</Text>
            <Text style={styles.progressPercentage}>{completionPercentage}%</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarFill, { width: `${completionPercentage}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {completedCount} of {totalCount} exercises completed
          </Text>
          {plan.can_retest_gait && (
            <View style={styles.unlockBadge}>
              <Ionicons name="unlock" size={18} color="#10B981" />
              <Text style={styles.unlockText}>Gait retest unlocked!</Text>
            </View>
          )}
        </View>

        {/* Exercise List */}
        <View style={styles.exerciseList}>
          {plan.exercises.map((exercise, index) => (
            <TouchableOpacity
              key={exercise.exercise_id}
              style={[
                styles.exerciseItem,
                exercise.completed && styles.exerciseItemCompleted
              ]}
              onPress={() => handleExercisePress(exercise)}
              activeOpacity={0.7}
            >
              <View style={styles.checkboxContainer}>
                <View
                  style={[
                    styles.checkbox,
                    exercise.completed && styles.checkboxChecked
                  ]}
                >
                  {exercise.completed && (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  )}
                </View>
              </View>

              <View style={styles.exerciseContent}>
                <Text style={[
                  styles.exerciseName,
                  exercise.completed && styles.exerciseNameCompleted
                ]}>
                  {exercise.exercise_name || exercise.name}
                </Text>
              </View>

              <View style={styles.exerciseNumber}>
                <Text style={styles.exerciseNumberText}>{index + 1}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Complete Session Button */}
        {plan.all_exercises_completed && (
          <View style={styles.actionFooter}>
            <TouchableOpacity
              style={styles.viewPlanButton}
              onPress={() => navigation.navigate('ExercisePlan', { planId: plan._id })}
            >
              <Ionicons name="list" size={24} color="#0066CC" />
              <Text style={styles.viewPlanButtonText}>View Exercise Plan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.completeButton}
              onPress={() => navigation.navigate('GaitAnalysis')}
            >
              <Ionicons name="fitness" size={24} color="#FFFFFF" />
              <Text style={styles.completeButtonText}>Retest Gait Analysis</Text>
            </TouchableOpacity>
          </View>
        )}
        </ScrollView>
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
    backgroundColor: '#F9FAFB',
  },
  contentScroll: {
    flex: 1,
  },
  contentScrollContainer: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  markAllButton: {
    padding: 4,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0066CC',
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0066CC',
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  unlockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D1FAE5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  unlockText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
    marginLeft: 6,
  },
  exerciseList: {
    paddingHorizontal: 16,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  exerciseItemCompleted: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  exerciseNameCompleted: {
    color: '#059669',
  },
  exerciseNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  exerciseNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E40AF',
  },
  actionFooter: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  viewPlanButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0066CC',
    marginBottom: 12,
  },
  viewPlanButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0066CC',
    marginLeft: 8,
  },
  completeButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
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
    maxHeight: '80%',
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
  },
  modalBody: {
    padding: 20,
  },
  exerciseNameInModal: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 24,
    textAlign: 'center',
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  starRating: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066CC',
    textAlign: 'center',
    marginBottom: 24,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  submitButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default ExerciseChecklistScreen;
