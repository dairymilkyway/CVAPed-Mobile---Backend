"""
Gait Problem Detector
Uses PhysioNet baselines and extracted CVAPed Web exercise logic.
"""

import json
from pathlib import Path
from scipy import stats


class GaitProblemDetector:
    def __init__(self, baselines_file='datasets/physionet_gait/gait_baselines.json',
                 exercises_file='datasets/physionet_gait/gait_exercises.json'):
        baselines_path = Path(__file__).parent / baselines_file
        exercises_path = Path(__file__).parent / exercises_file

        if not baselines_path.exists():
            raise FileNotFoundError(
                f"Baselines file not found: {baselines_path}\n"
                "Please run 'python process_physionet_data.py' first to generate baselines."
            )

        with open(baselines_path, 'r', encoding='utf-8') as baseline_file:
            self.baselines = json.load(baseline_file)

        if exercises_path.exists():
            with open(exercises_path, 'r', encoding='utf-8') as exercise_file:
                self.exercises_db = json.load(exercise_file)
            print("Loaded gait baselines and extracted exercise database")
        else:
            self.exercises_db = {}
            print("Loaded gait baselines (exercise database unavailable)")

        print(f"  Metrics available: {list(self.baselines.keys())}")

    def detect_problems(self, user_metrics):
        problems = []

        if 'cadence' in user_metrics and 'cadence' in self.baselines:
            problems.extend(self._check_cadence(user_metrics['cadence']))

        if 'gait_symmetry' in user_metrics and 'gait_symmetry' in self.baselines:
            problems.extend(self._check_symmetry(user_metrics['gait_symmetry']))

        if 'stride_length' in user_metrics and 'stride_length' in self.baselines:
            problems.extend(self._check_stride_length(user_metrics['stride_length']))

        if 'velocity' in user_metrics and 'velocity' in self.baselines:
            problems.extend(self._check_velocity(user_metrics['velocity']))

        if 'stability_score' in user_metrics:
            problems.extend(self._check_stability(user_metrics['stability_score']))

        if 'step_regularity' in user_metrics:
            problems.extend(self._check_step_regularity(user_metrics['step_regularity']))

        return problems

    def _get_exercise_recommendations(self, problem_key, severity):
        if not self.exercises_db or problem_key not in self.exercises_db:
            return self._get_fallback_recommendations(problem_key, severity)

        exercise_list = self.exercises_db.get(problem_key, {}).get(severity, [])
        recommendations = []

        for exercise in exercise_list[:3]:
            recommendations.append({
                'id': exercise.get('id'),
                'name': exercise.get('name'),
                'description': exercise.get('description'),
                'detectable': exercise.get('sensor_validation', {}).get('detectable', False),
                'difficulty': exercise.get('difficulty', 'unknown'),
                'expected_improvement': exercise.get('expected_improvement', 'N/A'),
                'duration': exercise.get('duration_per_session', 'N/A'),
                'frequency': exercise.get('frequency', 'N/A'),
                'hardware_compatible': True,
                'detection_confidence': exercise.get('sensor_validation', {}).get('confidence', 'unknown'),
                'instructions': exercise.get('instructions', []),
                'precautions': exercise.get('precautions', []),
                'benefits': exercise.get('benefits', []),
                'equipment': exercise.get('equipment_needed', 'None'),
                'video_url': exercise.get('video_url')
            })

        return recommendations

    def _get_fallback_recommendations(self, problem_key, severity):
        fallback = {
            'slow_cadence': {
                'severe': ['Metronome-paced walking', 'High knee marching', 'Fast stepping drills'],
                'moderate': ['Interval walking', 'Progressive speed training']
            },
            'asymmetric_gait': {
                'severe': ['Single-leg stance', 'Weight-shifting drills', 'Mirror walking'],
                'moderate': ['Step-up exercises', 'Balance training']
            },
            'short_stride': {
                'severe': ['Lunge walking', 'Visual target stepping'],
                'moderate': ['Heel-to-toe walking', 'Stride lengthening drills']
            },
            'slow_velocity': {
                'severe': ['Progressive treadmill training', 'Speed intervals'],
                'moderate': ['Overground speed walking']
            },
            'poor_stability': {
                'severe': ['Tandem walking', 'Multisurface training'],
                'moderate': ['Core strengthening', 'Balance exercises']
            },
            'reduced_step_regularity': {
                'severe': ['Rhythmic auditory cueing', 'Metronome walking'],
                'moderate': ['Paced walking practice']
            }
        }

        names = fallback.get(problem_key, {}).get(severity, ['Consult physical therapist'])
        return [
            {
                'id': f'{problem_key}_{index + 1}',
                'name': name,
                'description': name,
                'detectable': False,
                'difficulty': 'beginner',
                'expected_improvement': 'Varies',
                'duration': '10-15 minutes',
                'frequency': '3-5 times per week',
                'hardware_compatible': True,
                'detection_confidence': 'fallback',
                'instructions': [],
                'precautions': [],
                'benefits': [],
                'equipment': 'None',
                'video_url': None
            }
            for index, name in enumerate(names)
        ]

    def _build_problem(self, problem_key, severity, category, current_value, normal_range,
                       percentile=None, description='', impact='', exercises=None):
        exercise_list = exercises or []
        return {
            'problem': problem_key,
            'severity': severity,
            'category': category,
            'current_value': current_value,
            'normal_range': normal_range,
            'percentile': percentile,
            'description': description,
            'impact': impact,
            'recommendations': [exercise['name'] for exercise in exercise_list],
            'exercises': exercise_list
        }

    def _check_cadence(self, cadence):
        baseline = self.baselines['cadence']
        problems = []

        if cadence < baseline['p5']:
            percentile = self._calculate_percentile(cadence, baseline)
            exercises = self._get_exercise_recommendations('slow_cadence', 'severe')
            problems.append(self._build_problem(
                'slow_cadence',
                'severe',
                'Speed & Rhythm',
                round(cadence, 1),
                f"{baseline['p25']:.1f} - {baseline['p75']:.1f}",
                percentile,
                f"Your walking pace ({cadence:.1f} steps/min) is significantly slower than normal (below {percentile}th percentile).",
                'Severely reduced walking speed affects daily activities, community mobility, and crossing streets safely.',
                exercises
            ))
        elif cadence < baseline['p25']:
            percentile = self._calculate_percentile(cadence, baseline)
            exercises = self._get_exercise_recommendations('slow_cadence', 'moderate')
            problems.append(self._build_problem(
                'slow_cadence',
                'moderate',
                'Speed & Rhythm',
                round(cadence, 1),
                f"{baseline['p25']:.1f} - {baseline['p75']:.1f}",
                percentile,
                f"Your walking pace ({cadence:.1f} steps/min) is below average ({percentile}th percentile).",
                'Reduced walking pace may cause fatigue and limit daily mobility.',
                exercises
            ))

        return problems

    def _check_symmetry(self, symmetry):
        baseline = self.baselines['gait_symmetry']
        problems = []

        if symmetry < baseline['p5']:
            percentile = self._calculate_percentile(symmetry, baseline)
            exercises = self._get_exercise_recommendations('asymmetric_gait', 'severe')
            problems.append(self._build_problem(
                'asymmetric_gait',
                'severe',
                'Balance & Symmetry',
                round(symmetry, 2),
                f"{baseline['p25']:.2f} - {baseline['p75']:.2f}",
                percentile,
                f"Your gait shows significant asymmetry (symmetry score: {symmetry:.2f}, below {percentile}th percentile).",
                'Severe asymmetry increases fall risk, causes uneven joint loading, and reduces walking efficiency.',
                exercises
            ))
        elif symmetry < baseline['p25']:
            percentile = self._calculate_percentile(symmetry, baseline)
            exercises = self._get_exercise_recommendations('asymmetric_gait', 'moderate')
            problems.append(self._build_problem(
                'asymmetric_gait',
                'moderate',
                'Balance & Symmetry',
                round(symmetry, 2),
                f"{baseline['p25']:.2f} - {baseline['p75']:.2f}",
                percentile,
                f"Your gait shows mild asymmetry ({symmetry:.2f}, {percentile}th percentile).",
                'Asymmetry may lead to compensatory patterns and joint stress over time.',
                exercises
            ))

        return problems

    def _check_stride_length(self, stride_length):
        baseline = self.baselines['stride_length']
        problems = []

        if stride_length < baseline['p5']:
            percentile = self._calculate_percentile(stride_length, baseline)
            exercises = self._get_exercise_recommendations('short_stride', 'severe')
            problems.append(self._build_problem(
                'short_stride',
                'severe',
                'Gait Pattern',
                round(stride_length, 2),
                f"{baseline['p25']:.2f} - {baseline['p75']:.2f}",
                percentile,
                f"Your stride length ({stride_length:.2f}m) is significantly shorter than normal (below {percentile}th percentile).",
                'Very short strides severely reduce walking efficiency and speed.',
                exercises
            ))
        elif stride_length < baseline['p25']:
            percentile = self._calculate_percentile(stride_length, baseline)
            exercises = self._get_exercise_recommendations('short_stride', 'moderate')
            problems.append(self._build_problem(
                'short_stride',
                'moderate',
                'Gait Pattern',
                round(stride_length, 2),
                f"{baseline['p25']:.2f} - {baseline['p75']:.2f}",
                percentile,
                f"Your stride length ({stride_length:.2f}m) is below average ({percentile}th percentile).",
                'Shorter strides reduce walking efficiency.',
                exercises
            ))

        return problems

    def _check_velocity(self, velocity):
        baseline = self.baselines['velocity']
        problems = []

        if velocity < baseline['p5']:
            percentile = self._calculate_percentile(velocity, baseline)
            exercises = self._get_exercise_recommendations('slow_velocity', 'severe')
            problems.append(self._build_problem(
                'slow_velocity',
                'severe',
                'Speed & Rhythm',
                round(velocity, 2),
                f"{baseline['p25']:.2f} - {baseline['p75']:.2f}",
                percentile,
                f"Your walking speed ({velocity:.2f} m/s) is significantly slower than normal (below {percentile}th percentile).",
                'Very slow walking speed severely limits community mobility, crossing streets, and daily activities.',
                exercises
            ))
        elif velocity < baseline['p25']:
            percentile = self._calculate_percentile(velocity, baseline)
            exercises = self._get_exercise_recommendations('slow_velocity', 'moderate')
            problems.append(self._build_problem(
                'slow_velocity',
                'moderate',
                'Speed & Rhythm',
                round(velocity, 2),
                f"{baseline['p25']:.2f} - {baseline['p75']:.2f}",
                percentile,
                f"Your walking speed ({velocity:.2f} m/s) is below average ({percentile}th percentile).",
                'Reduced speed may affect community mobility.',
                exercises
            ))

        return problems

    def _check_stability(self, stability_score):
        problems = []

        if stability_score < 0.5:
            exercises = self._get_exercise_recommendations('poor_stability', 'severe')
            problems.append(self._build_problem(
                'poor_stability',
                'severe',
                'Balance & Symmetry',
                round(stability_score, 2),
                '>0.75',
                None,
                f"Your walking stability is significantly compromised (score: {stability_score:.2f}).",
                'Poor stability greatly increases fall risk and limits confidence in walking.',
                exercises
            ))
        elif stability_score < 0.65:
            exercises = self._get_exercise_recommendations('poor_stability', 'moderate')
            problems.append(self._build_problem(
                'poor_stability',
                'moderate',
                'Balance & Symmetry',
                round(stability_score, 2),
                '>0.75',
                None,
                f"Your walking stability shows room for improvement (score: {stability_score:.2f}).",
                'Reduced stability may affect confidence and increase caution during walking.',
                exercises
            ))

        return problems

    def _check_step_regularity(self, step_regularity):
        problems = []

        if step_regularity < 0.5:
            exercises = self._get_exercise_recommendations('reduced_step_regularity', 'severe')
            problems.append(self._build_problem(
                'irregular_steps',
                'severe',
                'Gait Pattern',
                round(step_regularity, 2),
                '>0.75',
                None,
                f"Your steps show significant irregularity (regularity score: {step_regularity:.2f}).",
                'Highly irregular steps indicate poor motor control and increase fall risk.',
                exercises
            ))
        elif step_regularity < 0.7:
            exercises = self._get_exercise_recommendations('reduced_step_regularity', 'moderate')
            problems.append(self._build_problem(
                'irregular_steps',
                'moderate',
                'Gait Pattern',
                round(step_regularity, 2),
                '>0.75',
                None,
                f"Your steps show some irregularity (regularity score: {step_regularity:.2f}).",
                'Irregular steps may affect walking efficiency and smoothness.',
                exercises
            ))

        return problems

    def _calculate_percentile(self, value, baseline):
        mean = baseline['mean']
        std = baseline['std']
        z_score = (value - mean) / std if std > 0 else 0
        percentile = stats.norm.cdf(z_score) * 100
        return max(1, min(99, int(percentile)))

    def prioritize_problems(self, problems):
        severity_order = {'severe': 0, 'moderate': 1, 'mild': 2}
        category_order = {'Speed & Rhythm': 0, 'Balance & Symmetry': 1, 'Gait Pattern': 2}

        return sorted(
            problems,
            key=lambda item: (
                severity_order.get(item['severity'], 99),
                category_order.get(item['category'], 99)
            )
        )

    def generate_summary(self, problems):
        if not problems:
            return {
                'overall_status': 'normal',
                'risk_level': 'low',
                'summary': 'Your gait parameters are within normal ranges. Continue regular physical activity to maintain mobility.',
                'total_problems': 0,
                'severe_count': 0,
                'moderate_count': 0
            }

        severe_count = sum(1 for problem in problems if problem['severity'] == 'severe')
        moderate_count = sum(1 for problem in problems if problem['severity'] == 'moderate')

        if severe_count >= 2:
            risk_level = 'high'
            status = 'needs_immediate_attention'
        elif severe_count >= 1 or moderate_count >= 3:
            risk_level = 'moderate'
            status = 'needs_attention'
        else:
            risk_level = 'low_moderate'
            status = 'needs_improvement'

        summary_text = (
            f"Detected {len(problems)} gait abnormality(ies): "
            f"{severe_count} severe, {moderate_count} moderate. "
            f"Physical therapy focusing on {problems[0]['category'].lower()} is recommended."
        )

        return {
            'overall_status': status,
            'risk_level': risk_level,
            'total_problems': len(problems),
            'severe_count': severe_count,
            'moderate_count': moderate_count,
            'summary': summary_text
        }

    def calculate_gait_score(self, user_metrics, detected_problems):
        metric_scores = []
        metric_weights = []

        if 'cadence' in user_metrics and 'cadence' in self.baselines:
            percentile = self._calculate_percentile(user_metrics['cadence'], self.baselines['cadence'])
            metric_scores.append(self._percentile_to_score(percentile))
            metric_weights.append(20)

        if 'velocity' in user_metrics and 'velocity' in self.baselines:
            percentile = self._calculate_percentile(user_metrics['velocity'], self.baselines['velocity'])
            metric_scores.append(self._percentile_to_score(percentile))
            metric_weights.append(20)

        if 'stride_length' in user_metrics and 'stride_length' in self.baselines:
            percentile = self._calculate_percentile(user_metrics['stride_length'], self.baselines['stride_length'])
            metric_scores.append(self._percentile_to_score(percentile))
            metric_weights.append(15)

        if 'gait_symmetry' in user_metrics and 'gait_symmetry' in self.baselines:
            percentile = self._calculate_percentile(user_metrics['gait_symmetry'], self.baselines['gait_symmetry'])
            metric_scores.append(self._percentile_to_score(percentile))
            metric_weights.append(20)

        if 'stability_score' in user_metrics:
            metric_scores.append(user_metrics['stability_score'] * 100)
            metric_weights.append(15)

        if 'step_regularity' in user_metrics:
            metric_scores.append(user_metrics['step_regularity'] * 100)
            metric_weights.append(10)

        if metric_scores and metric_weights:
            weighted_sum = sum(score * weight for score, weight in zip(metric_scores, metric_weights))
            final_score = weighted_sum / sum(metric_weights)
        else:
            final_score = 50

        severe_count = sum(1 for problem in detected_problems if problem.get('severity') == 'severe')
        moderate_count = sum(1 for problem in detected_problems if problem.get('severity') == 'moderate')
        penalty = min(10, severe_count * 3 + moderate_count * 1.5)
        final_score = max(0, min(100, final_score - penalty))

        if final_score >= 90:
            grade = 'Excellent'
            grade_emoji = 'OK'
            color = 'green'
            recommendation = 'Your gait is excellent. Maintain your current activity level and continue regular exercise.'
        elif final_score >= 75:
            grade = 'Good'
            grade_emoji = 'GOOD'
            color = 'lightblue'
            recommendation = 'Good gait performance. Minor improvements are possible through targeted exercises.'
        elif final_score >= 60:
            grade = 'Fair'
            grade_emoji = 'WARN'
            color = 'yellow'
            recommendation = 'Moderate gait issues detected. Physical therapy is recommended to improve mobility.'
        elif final_score >= 45:
            grade = 'Poor'
            grade_emoji = 'ALERT'
            color = 'orange'
            recommendation = 'Significant gait impairments detected. Physical therapy is strongly recommended.'
        else:
            grade = 'Critical'
            grade_emoji = 'URGENT'
            color = 'red'
            recommendation = 'Severe gait problems detected. Urgent medical consultation and intensive therapy are recommended.'

        return {
            'score': int(final_score),
            'grade': grade,
            'grade_emoji': grade_emoji,
            'color': color,
            'recommendation': recommendation,
            'severe_count': severe_count,
            'moderate_count': moderate_count,
            'metrics_evaluated': len(metric_scores)
        }

    def _percentile_to_score(self, percentile):
        if percentile >= 75:
            return 95 + (percentile - 75) / 25 * 5
        if percentile >= 50:
            return 85 + (percentile - 50) / 25 * 10
        if percentile >= 25:
            return 70 + (percentile - 25) / 25 * 15
        if percentile >= 10:
            return 50 + (percentile - 10) / 15 * 20
        if percentile >= 5:
            return 30 + (percentile - 5) / 5 * 20
        return max(0, percentile / 5 * 30)
