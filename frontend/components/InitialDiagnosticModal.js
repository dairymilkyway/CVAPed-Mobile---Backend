import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  computeInitialDiagnosticRecommendation,
  getLabel,
  getRequiredFields,
  INITIAL_DIAGNOSTIC_DEFAULTS,
  mergeDiagnosticData,
} from '../utils/initialDiagnostic';

const { width, height } = Dimensions.get('window');
const TOTAL_STEPS = 5;
const STEP_TITLES = ['Facility', 'Therapy', 'Condition', 'Baseline', 'Summary'];

const PHYSICAL_STEP_3_OPTIONS = {
  strokeTimeframe: [
    ['less_than_1_month', '< 1 Month'],
    ['1_to_6_months', '1-6 Months'],
    ['6_to_12_months', '6-12 Months'],
    ['over_1_year', 'Over 1 Year'],
  ],
  affectedSide: [
    ['left', 'Left Side'],
    ['right', 'Right Side'],
    ['both', 'Both Sides'],
    ['unknown', 'Not Sure'],
  ],
  mobilityStatus: [
    ['independent', 'Walks Independently'],
    ['assisted', 'Walks With Assistance'],
    ['wheelchair', 'Wheelchair User'],
    ['bed_bound', 'Bed-bound'],
  ],
  balanceIssues: [
    ['rarely', 'Rarely'],
    ['sometimes', 'Sometimes'],
    ['frequently', 'Frequently'],
    ['unable_alone', 'Cannot Stand Alone'],
  ],
};

const PHYSICAL_STEP_4_OPTIONS = {
  armMotorFunction: [
    ['normal', 'Normal'],
    ['mild_weakness', 'Mild Weakness'],
    ['moderate_weakness', 'Moderate Weakness'],
    ['severe_weakness', 'Severe / No Movement'],
  ],
  legMotorFunction: [
    ['normal', 'Normal'],
    ['mild_weakness', 'Mild Weakness'],
    ['moderate_weakness', 'Moderate Weakness'],
    ['severe_weakness', 'Severe / No Movement'],
  ],
  spasticity: [
    ['none', 'None'],
    ['mild', 'Mild'],
    ['moderate', 'Moderate'],
    ['severe', 'Severe'],
  ],
  priorPhysicalTherapy: [
    ['facility', 'At a Facility'],
    ['self_guided', 'Self-guided'],
    ['no', 'No Prior PT'],
  ],
};

const SPEECH_STEP_3_OPTIONS = {
  childAgeGroup: [
    ['toddler', '1-2 Years'],
    ['preschool', '3-4 Years'],
    ['school_age', '5-8 Years'],
    ['older', '9+ Years'],
  ],
  childCommunicationMode: [
    ['preverbal', 'Pre-verbal / Non-verbal'],
    ['single_words', 'Single Words'],
    ['short_phrases', 'Short Phrases'],
    ['sentences', 'Full Sentences'],
  ],
  speechIntelligibility: [
    ['easily', 'Easily Understood'],
    ['mostly_family', 'Mostly by Family'],
    ['difficult', 'Difficult to Understand'],
    ['not_speaking', 'Not Yet Speaking'],
  ],
  mainSpeechConcern: [
    ['articulation', 'Pronunciation'],
    ['language', 'Language'],
    ['fluency', 'Fluency'],
    ['multiple', 'Multiple Areas'],
  ],
};

const SPEECH_STEP_4_OPTIONS = {
  followsInstructions: [
    ['yes_consistently', 'Yes, Consistently'],
    ['sometimes', 'Sometimes'],
    ['rarely', 'Rarely'],
    ['no', 'No / Not Yet'],
  ],
  respondsToName: [
    ['always', 'Always'],
    ['usually', 'Usually'],
    ['inconsistently', 'Inconsistently'],
    ['rarely_no', 'Rarely / No'],
  ],
  priorSpeechEval: [
    ['formal_eval', 'Formal Evaluation'],
    ['informal', 'Informal Screening'],
    ['no', 'None'],
  ],
};

function ChoiceButton({ label, selected, onPress, description }) {
  return (
    <TouchableOpacity
      style={[styles.choiceButton, selected && styles.choiceButtonSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.choiceLabel, selected && styles.choiceLabelSelected]}>{label}</Text>
      {description ? (
        <Text style={[styles.choiceDescription, selected && styles.choiceDescriptionSelected]}>{description}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

function StepIndicator({ currentStep }) {
  return (
    <View style={styles.stepBar}>
      {STEP_TITLES.map((title, index) => {
        const step = index + 1;
        const isActive = step === currentStep;
        const isDone = step < currentStep;

        return (
          <View key={title} style={styles.stepNodeWrap}>
            <View style={[styles.stepNode, isActive && styles.stepNodeActive, isDone && styles.stepNodeDone]}>
              <Text style={[styles.stepNodeText, (isActive || isDone) && styles.stepNodeTextActive]}>
                {isDone ? '✓' : step}
              </Text>
            </View>
            <Text style={[styles.stepTitle, isActive && styles.stepTitleActive]}>{title}</Text>
          </View>
        );
      })}
    </View>
  );
}

const InitialDiagnosticModal = ({ isOpen, onClose, onConfirm, loading, initialData }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState(INITIAL_DIAGNOSTIC_DEFAULTS);
  const [showValidation, setShowValidation] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setShowValidation(false);
      setWizardData(mergeDiagnosticData(initialData || {}));
    }
  }, [initialData, isOpen]);

  const recommendation = useMemo(
    () => computeInitialDiagnosticRecommendation(wizardData),
    [wizardData]
  );

  const requiredFields = getRequiredFields(currentStep, wizardData);
  const allRequiredFilled = requiredFields.every((field) => wizardData[field] !== null);
  const isSpeech = wizardData.therapyFocus === 'speech';
  const isPhysical = wizardData.therapyFocus === 'physical' || wizardData.therapyFocus === 'both';

  const updateField = (key, value) => {
    setWizardData((prev) => ({ ...prev, [key]: value }));
    setShowValidation(false);
  };

  const goNext = () => {
    if (!allRequiredFilled) {
      setShowValidation(true);
      return;
    }

    setCurrentStep((prev) => prev + 1);
  };

  const handleFinish = () => {
    onConfirm({
      ...wizardData,
      ...recommendation,
      completedWizard: true,
    });
  };

  const renderFieldError = (field) => {
    if (!showValidation || !requiredFields.includes(field) || wizardData[field] !== null) {
      return null;
    }

    return <Text style={styles.fieldError}>Please select an option to continue.</Text>;
  };

  const renderStep1 = () => (
    <View>
      <Text style={styles.stepHeading}>Have you visited our facility?</Text>
      <Text style={styles.stepDescription}>
        We use this to align your therapy starting point with your current assessment history.
      </Text>
      <ChoiceButton
        label="Yes, I Have"
        description="I've already had an initial assessment or facility visit."
        selected={wizardData.hasInitialDiagnostic === true}
        onPress={() => updateField('hasInitialDiagnostic', true)}
      />
      <ChoiceButton
        label="No, Not Yet"
        description="I have not had an initial assessment yet."
        selected={wizardData.hasInitialDiagnostic === false}
        onPress={() => updateField('hasInitialDiagnostic', false)}
      />
      {renderFieldError('hasInitialDiagnostic')}
    </View>
  );

  const renderStep2 = () => (
    <View>
      <Text style={styles.stepHeading}>Which therapy do you need?</Text>
      <Text style={styles.stepDescription}>Select the primary therapy area that best matches your needs.</Text>
      <ChoiceButton
        label="Speech Therapy"
        description="Pediatric speech and communication development."
        selected={wizardData.therapyFocus === 'speech'}
        onPress={() => updateField('therapyFocus', 'speech')}
      />
      <ChoiceButton
        label="Physical Therapy"
        description="Stroke recovery focused on gait, balance, and movement."
        selected={wizardData.therapyFocus === 'physical'}
        onPress={() => updateField('therapyFocus', 'physical')}
      />
      <ChoiceButton
        label="Both Therapies"
        description="Physical rehabilitation with added speech support."
        selected={wizardData.therapyFocus === 'both'}
        onPress={() => updateField('therapyFocus', 'both')}
      />
      {renderFieldError('therapyFocus')}
    </View>
  );

  const renderOptionGroup = (title, field, options, optional = false) => (
    <View style={styles.group} key={field}>
      <Text style={styles.groupTitle}>{title}{optional ? ' (Optional)' : ''}</Text>
      {options.map(([value, label]) => (
        <ChoiceButton
          key={value}
          label={label}
          selected={wizardData[field] === value}
          onPress={() => updateField(field, value)}
        />
      ))}
      {renderFieldError(field)}
    </View>
  );

  const renderStep3 = () => {
    if (isSpeech) {
      return (
        <View>
          <Text style={styles.stepHeading}>Child's speech profile</Text>
          <Text style={styles.stepDescription}>Tell us about the child's communication level and current concerns.</Text>
          {renderOptionGroup('Age Group', 'childAgeGroup', SPEECH_STEP_3_OPTIONS.childAgeGroup)}
          {renderOptionGroup('Communication Mode', 'childCommunicationMode', SPEECH_STEP_3_OPTIONS.childCommunicationMode)}
          {renderOptionGroup('Speech Intelligibility', 'speechIntelligibility', SPEECH_STEP_3_OPTIONS.speechIntelligibility)}
          {renderOptionGroup('Primary Speech Concern', 'mainSpeechConcern', SPEECH_STEP_3_OPTIONS.mainSpeechConcern, true)}
        </View>
      );
    }

    if (isPhysical) {
      return (
        <View>
          <Text style={styles.stepHeading}>Physical condition summary</Text>
          <Text style={styles.stepDescription}>Tell us about the stroke history, affected side, and current mobility level.</Text>
          {renderOptionGroup('Stroke Timeframe', 'strokeTimeframe', PHYSICAL_STEP_3_OPTIONS.strokeTimeframe)}
          {renderOptionGroup('Affected Side', 'affectedSide', PHYSICAL_STEP_3_OPTIONS.affectedSide)}
          {renderOptionGroup('Mobility Status', 'mobilityStatus', PHYSICAL_STEP_3_OPTIONS.mobilityStatus)}
          {renderOptionGroup('Balance Issues', 'balanceIssues', PHYSICAL_STEP_3_OPTIONS.balanceIssues, true)}
        </View>
      );
    }

    return null;
  };

  const renderStep4 = () => {
    if (isSpeech) {
      return (
        <View>
          <Text style={styles.stepHeading}>Baseline communication skills</Text>
          <Text style={styles.stepDescription}>These details shape the initial speech therapy level and focus.</Text>
          {renderOptionGroup('Follows Instructions', 'followsInstructions', SPEECH_STEP_4_OPTIONS.followsInstructions)}
          {renderOptionGroup('Responds to Name', 'respondsToName', SPEECH_STEP_4_OPTIONS.respondsToName)}
          {renderOptionGroup('Prior Speech Evaluation', 'priorSpeechEval', SPEECH_STEP_4_OPTIONS.priorSpeechEval, true)}
          <View style={styles.group}>
            <Text style={styles.groupTitle}>Primary Speech Goal (Optional)</Text>
            {[
              'Clearer speech',
              'More words and phrases',
              'Better fluency',
              'Improved comprehension',
            ].map((label) => (
              <ChoiceButton
                key={label}
                label={label}
                selected={wizardData.primarySpeechGoal === label}
                onPress={() => updateField('primarySpeechGoal', label)}
              />
            ))}
          </View>
        </View>
      );
    }

    if (isPhysical) {
      return (
        <View>
          <Text style={styles.stepHeading}>Motor function baseline</Text>
          <Text style={styles.stepDescription}>These answers determine the initial physical therapy intensity and focus.</Text>
          {renderOptionGroup('Arm Motor Function', 'armMotorFunction', PHYSICAL_STEP_4_OPTIONS.armMotorFunction)}
          {renderOptionGroup('Leg Motor Function', 'legMotorFunction', PHYSICAL_STEP_4_OPTIONS.legMotorFunction)}
          {renderOptionGroup('Spasticity', 'spasticity', PHYSICAL_STEP_4_OPTIONS.spasticity, true)}
          {renderOptionGroup('Prior Physical Therapy', 'priorPhysicalTherapy', PHYSICAL_STEP_4_OPTIONS.priorPhysicalTherapy, true)}
        </View>
      );
    }

    return null;
  };

  const renderSummaryRow = (label, value) => (
    <View style={styles.summaryRow} key={label}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );

  const renderStep5 = () => (
    <View>
      <Text style={styles.stepHeading}>Initial diagnostic summary</Text>
      <Text style={styles.stepDescription}>This mirrors the CVAPed Web decision flow and gives your starting therapy path.</Text>
      <View style={styles.summaryCard}>
        {renderSummaryRow('Facility Assessment', wizardData.hasInitialDiagnostic ? 'Completed' : 'Not yet completed')}
        {renderSummaryRow('Therapy Focus', getLabel('therapyFocus', wizardData.therapyFocus))}
        {renderSummaryRow('Recommended Therapy', getLabel('recommendedTherapy', recommendation.recommendedTherapy))}
        {renderSummaryRow('Recommended Level', recommendation.recommendedLevelName || getLabel('recommendedLevel', recommendation.recommendedLevel))}
        {renderSummaryRow('Recommended Focus', recommendation.recommendedFocus || 'Not available')}
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return renderStep5();
    }
  };

  return (
    <Modal visible={isOpen} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Initial Diagnostic</Text>
              <Text style={styles.subtitle}>Step {currentStep} of {TOTAL_STEPS}</Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={loading} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>

          <StepIndicator currentStep={currentStep} />

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
            {renderCurrentStep()}
          </ScrollView>

          <View style={styles.footer}>
            {currentStep > 1 ? (
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setCurrentStep((prev) => prev - 1)}>
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.footerSpacer} />
            )}

            {currentStep < TOTAL_STEPS ? (
              <TouchableOpacity style={styles.primaryButton} onPress={goNext} disabled={loading}>
                <Text style={styles.primaryButtonText}>Next</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.primaryButton} onPress={handleFinish} disabled={loading}>
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Save Diagnostic</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: width - 24,
    maxHeight: height * 0.9,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#6B7280',
  },
  closeButton: {
    padding: 6,
  },
  stepBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#F9FAFB',
  },
  stepNodeWrap: {
    alignItems: 'center',
    flex: 1,
  },
  stepNode: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepNodeActive: {
    backgroundColor: '#C9302C',
  },
  stepNodeDone: {
    backgroundColor: '#0F766E',
  },
  stepNodeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
  },
  stepNodeTextActive: {
    color: '#FFFFFF',
  },
  stepTitle: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  stepTitleActive: {
    color: '#111827',
    fontWeight: '700',
  },
  body: {
    maxHeight: height * 0.62,
  },
  bodyContent: {
    padding: 20,
    paddingBottom: 28,
  },
  stepHeading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: '#6B7280',
    marginBottom: 18,
  },
  group: {
    marginBottom: 18,
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
  },
  choiceButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  choiceButtonSelected: {
    borderColor: '#C9302C',
    backgroundColor: '#FEF2F2',
  },
  choiceLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  choiceLabelSelected: {
    color: '#991B1B',
  },
  choiceDescription: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: '#6B7280',
  },
  choiceDescriptionSelected: {
    color: '#7F1D1D',
  },
  fieldError: {
    marginTop: -2,
    marginBottom: 10,
    fontSize: 12,
    color: '#DC2626',
  },
  summaryCard: {
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  summaryRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 15,
    color: '#111827',
    lineHeight: 21,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  footerSpacer: {
    width: 100,
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  primaryButton: {
    minWidth: 140,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#C9302C',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default InitialDiagnosticModal;
