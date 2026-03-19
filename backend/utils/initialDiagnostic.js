const INITIAL_DIAGNOSTIC_DEFAULTS = {
  hasInitialDiagnostic: null,
  therapyFocus: null,
  strokeTimeframe: null,
  affectedSide: null,
  mobilityStatus: null,
  balanceIssues: null,
  armMotorFunction: null,
  legMotorFunction: null,
  spasticity: null,
  priorPhysicalTherapy: null,
  childAgeGroup: null,
  childCommunicationMode: null,
  speechIntelligibility: null,
  mainSpeechConcern: null,
  followsInstructions: null,
  respondsToName: null,
  priorSpeechEval: null,
  primarySpeechGoal: null,
  recommendedTherapy: null,
  recommendedLevel: null,
  recommendedFocus: null,
  recommendedTherapyCategory: null,
  recommendedStartingLevel: null,
  recommendedLevelName: null,
  completedWizard: false
};

const ALLOWED_FIELDS = new Set(Object.keys(INITIAL_DIAGNOSTIC_DEFAULTS));

function normalizeInitialDiagnosticData(payload = {}) {
  const normalized = { ...INITIAL_DIAGNOSTIC_DEFAULTS };

  Object.entries(payload).forEach(([key, value]) => {
    if (ALLOWED_FIELDS.has(key)) {
      normalized[key] = value ?? null;
    }
  });

  return normalized;
}

function computeInitialDiagnosticRecommendation(data) {
  const focus = data.therapyFocus;
  let recommendedLevel = 'beginner';
  let recommendedFocus = '';
  let recommendedTherapyCategory = 'articulation';
  let recommendedStartingLevel = 1;
  let recommendedLevelName = 'Level 1 - Sound Level';
  const recommendedTherapy = focus === 'both' ? 'physical' : focus;

  if (focus === 'speech') {
    const comm = data.childCommunicationMode;
    const intelligibility = data.speechIntelligibility;
    const concern = data.mainSpeechConcern;

    if (concern === 'fluency') {
      recommendedLevel = 'intermediate';
      recommendedFocus = 'Fluency / Stuttering Therapy';
      recommendedTherapyCategory = 'fluency';

      if (intelligibility === 'easily') {
        recommendedStartingLevel = 3;
        recommendedLevelName = 'Level 3 - Sentence Level';
      } else if (intelligibility === 'mostly_family') {
        recommendedStartingLevel = 2;
        recommendedLevelName = 'Level 2 - Phrase Level';
      } else {
        recommendedStartingLevel = 1;
        recommendedLevelName = 'Level 1 - Word Level';
      }
    } else if (comm === 'preverbal' || intelligibility === 'not_speaking') {
      recommendedLevel = 'beginner';
      recommendedFocus = 'Early Communication Development';
      recommendedTherapyCategory = 'articulation';
      recommendedStartingLevel = 1;
      recommendedLevelName = 'Level 1 - Sound Level';
    } else if (comm === 'single_words' || intelligibility === 'difficult') {
      recommendedLevel = 'beginner';
      recommendedFocus = 'Articulation + Early Language';
      recommendedTherapyCategory = 'articulation';
      recommendedStartingLevel = 2;
      recommendedLevelName = 'Level 2 - Syllable Level';
    } else if (comm === 'short_phrases' || intelligibility === 'mostly_family') {
      recommendedLevel = 'beginner';
      recommendedFocus = 'Articulation Therapy';
      recommendedTherapyCategory = 'articulation';
      recommendedStartingLevel = 3;
      recommendedLevelName = 'Level 3 - Word Level';
    } else if (comm === 'sentences' && intelligibility === 'easily') {
      recommendedLevel = 'intermediate';
      recommendedFocus = 'Expressive Language + Fluency';
      recommendedTherapyCategory = 'language';
      recommendedStartingLevel = 3;
      recommendedLevelName = 'Level 3 - Story Retell';
    } else {
      recommendedLevel = 'beginner';
      recommendedFocus = 'Speech Therapy';
      recommendedTherapyCategory = 'articulation';
      recommendedStartingLevel = 1;
      recommendedLevelName = 'Level 1 - Sound Level';
    }
  } else {
    recommendedTherapyCategory = 'physical';
    const mobility = data.mobilityStatus;
    const armMotor = data.armMotorFunction;
    const legMotor = data.legMotorFunction;

    if (mobility === 'bed_bound' || armMotor === 'severe_weakness' || legMotor === 'severe_weakness') {
      recommendedLevel = 'beginner';
      recommendedFocus = 'Basic Motor Activation';
      recommendedStartingLevel = 1;
      recommendedLevelName = 'Beginner Level';
    } else if (mobility === 'wheelchair') {
      recommendedLevel = 'beginner';
      recommendedFocus = 'Mobility + Strength Training';
      recommendedStartingLevel = 1;
      recommendedLevelName = 'Beginner Level';
    } else if (mobility === 'assisted' || armMotor === 'moderate_weakness' || legMotor === 'moderate_weakness') {
      recommendedLevel = 'intermediate';
      recommendedFocus = 'Gait Training + Upper Limb Rehabilitation';
      recommendedStartingLevel = 2;
      recommendedLevelName = 'Intermediate Level';
    } else if (mobility === 'independent') {
      recommendedLevel = 'intermediate';
      recommendedFocus = 'Functional Rehabilitation';
      recommendedStartingLevel = 2;
      recommendedLevelName = 'Intermediate Level';
    } else {
      recommendedLevel = 'beginner';
      recommendedFocus = 'Physical Therapy';
      recommendedStartingLevel = 1;
      recommendedLevelName = 'Beginner Level';
    }

    if (focus === 'both') {
      recommendedFocus = `${recommendedFocus} + Speech Support`;
    }
  }

  return {
    recommendedTherapy,
    recommendedLevel,
    recommendedFocus,
    recommendedTherapyCategory,
    recommendedStartingLevel,
    recommendedLevelName
  };
}

function getRequiredFields(step, wizardData) {
  const focus = wizardData.therapyFocus;
  const isSpeech = focus === 'speech';
  const isPhysical = focus === 'physical' || focus === 'both';

  if (step === 1) return ['hasInitialDiagnostic'];
  if (step === 2) return ['therapyFocus'];
  if (step === 3) {
    if (isSpeech) return ['childAgeGroup', 'childCommunicationMode', 'speechIntelligibility'];
    if (isPhysical) return ['strokeTimeframe', 'affectedSide', 'mobilityStatus'];
  }
  if (step === 4) {
    if (isSpeech) return ['followsInstructions', 'respondsToName'];
    if (isPhysical) return ['armMotorFunction', 'legMotorFunction'];
  }

  return [];
}

function validateInitialDiagnosticData(payload = {}) {
  const data = normalizeInitialDiagnosticData(payload);
  const errors = [];

  [1, 2, 3, 4].forEach((step) => {
    getRequiredFields(step, data).forEach((field) => {
      if (data[field] === null || data[field] === undefined) {
        errors.push(`${field} is required`);
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors,
    data
  };
}

function buildDiagnosticData(payload = {}) {
  const normalized = normalizeInitialDiagnosticData(payload);
  const recommendation = computeInitialDiagnosticRecommendation(normalized);

  return {
    ...normalized,
    ...recommendation,
    completedWizard: true
  };
}

module.exports = {
  INITIAL_DIAGNOSTIC_DEFAULTS,
  buildDiagnosticData,
  computeInitialDiagnosticRecommendation,
  getRequiredFields,
  normalizeInitialDiagnosticData,
  validateInitialDiagnosticData
};
