export interface UserProfile {
  name: string;
  birthday: string;
  weight: number;
  height: number;
  has_fibroids: 'yes' | 'no' | 'suspected' | 'removed';
  hormonal_treatment: string;
  diagnosed_conditions: string[];
  perimenopause_status: 'yes' | 'suspected' | 'no' | 'unsure';
  has_regular_cycle: 'yes' | 'no' | 'irregular';
  joint_conditions: boolean;
  joint_conditions_detail: string;
  exercises_regularly: boolean;
  exercise_types: string[];
  tracks_food: boolean;
  stress_baseline: 'low' | 'moderate' | 'high';
  tracking_goals: string[];
}

export interface DailyLog {
  id: string;
  date: string;
  completed: boolean;
  energy?: LogEnergy;
  sleep?: LogSleep;
  mood?: LogMood;
  appetite?: LogAppetite;
  cycle?: LogCycle;
  fibroid?: LogFibroid;
  musculoskeletal?: LogMusculoskeletal;
  skinHair?: LogSkinHair;
  cardiovascular?: LogCardiovascular;
  urological?: LogUrological;
  activity?: LogActivity;
  substances?: LogSubstances;
  whatsNew?: LogWhatsNew;
  notes?: string;
}

export interface LogEnergy {
  energy_level: number;
  functional_capacity: 'full' | 'reduced' | 'rest';
  energy_crash_time: 'morning' | 'afternoon' | 'evening' | 'none';
  rest_helped: 'yes' | 'no' | 'partial' | 'didnt_rest';
}

export interface LogSleep {
  hours_slept: number;
  sleep_quality: number;
  night_sweats: 'none' | 'mild' | 'severe';
  woke_during_night: 'no' | 'once' | 'multiple';
  felt_rested: 'yes' | 'no' | 'partial';
}

export interface LogMood {
  mood_score: number;
  anxiety: 'none' | 'mild' | 'moderate' | 'severe';
  irritability: 'none' | 'mild' | 'moderate' | 'severe';
  brain_fog: 'none' | 'mild' | 'moderate' | 'severe';
  memory_gaps: boolean;
  emotional_sensitivity: boolean;
  motivation: 'normal' | 'low' | 'none';
  screen_behaviour: 'normal' | 'more_than_usual' | 'doom_scrolling' | 'numb';
  social_energy: 'wanted_people' | 'content_either_way' | 'needed_quiet' | 'avoided_people';
  social_match: 'matched' | 'more_social_than_wanted' | 'less_social_than_wanted';
  emotional_eating: boolean;
  feeling_like_yourself: 'yes' | 'mostly' | 'not_really' | 'not_at_all';
}

export interface LogAppetite {
  appetite_score: number;
  cravings: boolean;
  cravings_detail: string;
  bloating: 'none' | 'mild' | 'moderate' | 'severe';
  nausea: boolean;
  bowel_changes: 'none' | 'constipation' | 'diarrhea' | 'both';
  unusual_thirst: boolean;
}

export interface LogCycle {
  period_status: 'started' | 'ongoing' | 'ended' | 'none' | 'spotting';
  flow_intensity: 'none' | 'light' | 'medium' | 'heavy' | 'very_heavy';
  clotting: 'none' | 'small' | 'large';
  cramping: 'none' | 'mild' | 'moderate' | 'severe';
  cycle_phase_estimated: 'follicular' | 'ovulatory' | 'luteal' | 'menstrual' | 'unknown';
  notes: string;
}

export interface LogFibroid {
  pelvic_pain: 'none' | 'mild' | 'moderate' | 'severe';
  pelvic_heaviness: 'none' | 'mild' | 'moderate' | 'severe';
  lower_back_pain: 'none' | 'mild' | 'moderate' | 'severe';
  abdomen_distended: boolean;
  urinary_urgency: boolean;
  anaemia_symptoms: { breathlessness: boolean; dizziness: boolean; pallor: boolean };
}

export interface LogMusculoskeletal {
  joint_pain: boolean;
  joint_pain_areas: string[];
  muscle_aches: boolean;
  muscle_ache_areas: string[];
  morning_stiffness: 'none' | 'mild' | 'severe';
  morning_stiffness_duration_mins: number;
  joint_swelling: boolean;
  joint_swelling_areas: string[];
}

export interface LogSkinHair {
  hair_shedding_elevated: boolean;
  scalp_changes: 'none' | 'itching' | 'dryness' | 'tenderness';
  skin_dryness: 'none' | 'mild' | 'moderate' | 'severe';
  skin_sensitivity: boolean;
  hyperpigmentation_changes: boolean;
  hyperpigmentation_detail: string;
  nail_changes: boolean;
  nail_changes_detail: string;
}

export interface LogCardiovascular {
  palpitations: boolean;
  palpitations_duration_mins: number;
  dizziness: boolean;
  hot_flashes: boolean;
  hot_flashes_count: number;
  hot_flashes_severity: 'mild' | 'moderate' | 'severe';
  flushing: boolean;
  headache: boolean;
  headache_severity: 'mild' | 'moderate' | 'severe';
  headache_location: 'frontal' | 'temporal' | 'occipital' | 'whole_head';
}

export interface LogUrological {
  urinary_frequency_elevated: boolean;
  urgency: boolean;
  leakage: boolean;
  discomfort_or_burning: boolean;
  uti_symptoms: boolean;
}

export interface LogActivity {
  exercised: 'yes' | 'no' | 'planned_but_didnt';
  exercise_types: string[];
  duration_mins: number;
  intensity: 'light' | 'moderate' | 'hard' | 'destroyed_myself';
  body_feel_during: 'good' | 'struggled_but_finished' | 'had_to_stop' | 'better_than_expected';
  body_feel_after: 'energised' | 'normal' | 'depleted' | 'sore';
  motivation_going_in: 'motivated' | 'neutral' | 'pushed_through' | 'forced_myself';
  mind_body_alignment: 'both_aligned' | 'mind_willing_body_not' | 'body_willing_mind_not' | 'neither';
  rest_day_type: 'planned' | 'body_said_no' | 'just_didnt' | 'not_a_rest_day';
  steps: number;
}

export interface LogSubstances {
  alcohol_units: 'none' | '1-2' | '3-4' | '4_plus';
  alcohol_type: 'wine' | 'beer' | 'spirits' | 'mixed' | 'other';
  next_morning_feel: 'fine' | 'slightly_off' | 'rough' | 'never_again';
  caffeine: 'normal' | 'more' | 'less' | 'none';
  other: string;
}

export interface LogWhatsNew {
  new_food: string;
  new_product: string;
  new_product_type: 'topical' | 'ingestible' | 'other';
  new_activity_or_experience: string;
  environment_change: string;
  followup_feel: 'fine' | 'something_felt_different';
  followup_detail: string;
}

export interface MedicalRecord {
  id: string;
  record_type: 'lab_result' | 'scan' | 'medication' | 'supplement' | 'appointment';
  date: string;
  title: string;
  details: Record<string, any>;
}

export interface AIInsight {
  id: string;
  generated_at: string;
  period_start: string;
  period_end: string;
  insight_type: 'weekly_summary' | 'correlation_flags' | 'doctor_report';
  content: Record<string, any>;
  dismissed: boolean;
}
