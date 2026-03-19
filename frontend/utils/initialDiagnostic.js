export const INITIAL_DIAGNOSTIC_DEFAULTS = {
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
  completedWizard: false,
};

export const LABELS = {
  therapyFocus: {
    speech: 'Speech Therapy',
    physical: 'Physical Therapy',
    both: 'Both Therapies',
  },
  recommendedTherapy: {
    speech: 'Speech Therapy',
    physical: 'Physical Therapy',
  },
  strokeTimeframe: {
    less_than_1_month: 'Less than 1 month',
    '1_to_6_months': '1-6 months',
    '6_to_12_months': '6-12 months',
    over_1_year: 'Over 1 year',
  },
  affectedSide: {
    left: 'Left side',
    right: 'Right side',
    both: 'Both sides',
    unknown: 'Not sure',
  },
  mobilityStatus: {
    independent: 'Walks independently',
    assisted: 'Walks with assistance',
    wheelchair: 'Wheelchair user',
    bed_bound: 'Bed-bound',
  },
  balanceIssues: {
    rarely: 'Rarely',
    sometimes: 'Sometimes',
    frequently: 'Frequently',
    unable_alone: 'Cannot stand alone',
  },
  armMotorFunction: {
    normal: 'Normal',
    mild_weakness: 'Mild weakness',
    moderate_weakness: 'Moderate weakness',
    severe_weakness: 'Severe / no movement',
  },
  legMotorFunction: {
    normal: 'Normal',
    mild_weakness: 'Mild weakness',
    moderate_weakness: 'Moderate weakness',
    severe_weakness: 'Severe / no movement',
  },
  spasticity: {
    none: 'None',
    mild: 'Mild',
    moderate: 'Moderate',
    severe: 'Severe',
  },
  priorPhysicalTherapy: {
    facility: 'At a facility',
    self_guided: 'Self-guided',
    no: 'No prior physical therapy',
  },
  childAgeGroup: {
    toddler: '1-2 years',
    preschool: '3-4 years',
    school_age: '5-8 years',
    older: '9+ years',
  },
  childCommunicationMode: {
    preverbal: 'Pre-verbal / non-verbal',
    single_words: 'Single words',
    short_phrases: 'Short phrases',
    sentences: 'Full sentences',
  },
  speechIntelligibility: {
    easily: 'Easily understood',
    mostly_family: 'Mostly by family',
    difficult: 'Difficult to understand',
    not_speaking: 'Not yet speaking',
  },
  mainSpeechConcern: {
    articulation: 'Pronunciation / articulation',
    language: 'Language development',
    fluency: 'Fluency / stuttering',
    multiple: 'Multiple areas',
  },
  followsInstructions: {
    yes_consistently: 'Yes, consistently',
    sometimes: 'Sometimes',
    rarely: 'Rarely',
    no: 'No / not yet',
  },
  respondsToName: {
    always: 'Always',
    usually: 'Usually',
    inconsistently: 'Inconsistently',
    rarely_no: 'Rarely / no',
  },
  priorSpeechEval: {
    formal_eval: 'Formal evaluation',
    informal: 'Informal screening',
    no: 'None',
  },
  recommendedLevel: {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
  },
};

export function mergeDiagnosticData(data = {}) {
  return { ...INITIAL_DIAGNOSTIC_DEFAULTS, ...data };
}

export function computeInitialDiagnosticRecommendation(data) {
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
    recommendedLevelName,
  };
}

export function getRequiredFields(step, wizardData) {
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

export function getRecommendedTherapyTarget(diagnosticData, fallbackTherapyType = null) {
  if (diagnosticData?.recommendedTherapy === 'speech' || diagnosticData?.therapyFocus === 'speech') {
    return 'speech';
  }
  if (diagnosticData?.recommendedTherapy === 'physical' || diagnosticData?.therapyFocus === 'physical' || diagnosticData?.therapyFocus === 'both') {
    return 'physical';
  }
  return fallbackTherapyType;
}

export function getLabel(field, value) {
  if (value === null || value === undefined || value === '') {
    return 'Not provided';
  }
  return LABELS[field]?.[value] || value;
}

export function getInitialDiagnosticSections(diagnosticData) {
  if (!diagnosticData?.completedWizard) {
    return [];
  }

  const isSpeech = diagnosticData.therapyFocus === 'speech';
  const conditionItems = isSpeech
    ? [
        ['Age Group', getLabel('childAgeGroup', diagnosticData.childAgeGroup)],
        ['Communication', getLabel('childCommunicationMode', diagnosticData.childCommunicationMode)],
        ['Intelligibility', getLabel('speechIntelligibility', diagnosticData.speechIntelligibility)],
        ['Main Concern', getLabel('mainSpeechConcern', diagnosticData.mainSpeechConcern)],
        ['Follows Instructions', getLabel('followsInstructions', diagnosticData.followsInstructions)],
        ['Responds to Name', getLabel('respondsToName', diagnosticData.respondsToName)],
        ['Prior Speech Evaluation', getLabel('priorSpeechEval', diagnosticData.priorSpeechEval)],
        ['Primary Goal', diagnosticData.primarySpeechGoal || 'Not provided'],
      ]
    : [
        ['Stroke Timeframe', getLabel('strokeTimeframe', diagnosticData.strokeTimeframe)],
        ['Affected Side', getLabel('affectedSide', diagnosticData.affectedSide)],
        ['Mobility', getLabel('mobilityStatus', diagnosticData.mobilityStatus)],
        ['Balance Issues', getLabel('balanceIssues', diagnosticData.balanceIssues)],
        ['Arm Motor', getLabel('armMotorFunction', diagnosticData.armMotorFunction)],
        ['Leg Motor', getLabel('legMotorFunction', diagnosticData.legMotorFunction)],
        ['Spasticity', getLabel('spasticity', diagnosticData.spasticity)],
        ['Prior Physical Therapy', getLabel('priorPhysicalTherapy', diagnosticData.priorPhysicalTherapy)],
      ];

  return [
    {
      title: 'Therapy Focus',
      items: [
        ['Selected Therapy', getLabel('therapyFocus', diagnosticData.therapyFocus)],
        ['Facility Assessment', diagnosticData.hasInitialDiagnostic ? 'Completed' : 'Not yet completed'],
      ],
    },
    {
      title: isSpeech ? "Child's Profile" : 'Condition Profile',
      items: conditionItems,
    },
    {
      title: 'Recommended Starting Point',
      items: [
        ['Recommended Therapy', getLabel('recommendedTherapy', diagnosticData.recommendedTherapy)],
        ['Recommended Level', diagnosticData.recommendedLevelName || getLabel('recommendedLevel', diagnosticData.recommendedLevel)],
        ['Recommended Focus', diagnosticData.recommendedFocus || 'Not available'],
      ],
    },
  ];
}
