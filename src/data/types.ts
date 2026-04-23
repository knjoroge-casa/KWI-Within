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
  body?: LogBody;
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

export type EnergyLevel = 'dead' | 'low' | 'okay' | 'good' | 'charged';

export interface LogEnergy {
  morning_energy: EnergyLevel | null;
  midday_energy: EnergyLevel | null;
  evening_energy: EnergyLevel | null;
  functional_capacity: 'full' | 'got_through' | 'empty' | 'rest' | null;
  energy_crash_time: 'none' | 'morning' | 'after_lunch' | 'late_afternoon' | 'evening' | null;
  rest_helped: 'yes' | 'somewhat' | 'no' | null;
  energy_level?: number; // legacy compat
}

export interface LogSleep {
  hours_slept: number | null;
  sleep_quality: 'terrible' | 'poor' | 'okay' | 'good' | 'deep' | null;
  night_sweats: 'none' | 'mild' | 'woke_me' | null;
  woke_during_night: 'slept_through' | 'once' | 'few_times' | 'all_night' | null;
  felt_rested: 'yes' | 'kind_of' | 'no' | null;
}

export interface LogBody {
  headache: 'none' | 'mild' | 'significant' | 'migraine' | null;
  headache_location: 'forehead' | 'temples' | 'back' | 'behind_eyes' | 'whole_head' | null;
  joint_pain: 'none' | 'mild' | 'noticeable' | 'difficult' | null;
  joint_pain_areas: string[];
  muscle_aches: 'none' | 'mild' | 'noticeable' | null;
  morning_stiffness: 'none' | 'loosened' | 'while' | 'midday' | null;
  pelvic_area: 'none' | 'mild' | 'noticeable' | 'significant' | null;
  lower_back: 'fine' | 'mild' | 'noticeable' | 'bad' | null;
  breast_tenderness: 'none' | 'mild' | 'noticeable' | 'painful' | null;
  perceived_temp: 'comfortable' | 'cold' | 'warm' | 'hot_flushes' | 'sweaty' | 'erratic' | null;
}

export interface LogMood {
  mood_emoji: '😔' | '🙁' | '😐' | '🙂' | '😄' | null;
  mood_score?: number; // legacy compat
  anxiety: 'none' | 'hum' | 'noticeable' | 'hard_to_shake' | null;
  irritability: 'none' | 'mild' | 'a_lot' | 'dont_talk' | null;
  brain_fog: 'sharp' | 'cloudy' | 'foggy' | 'cant_find_words' | null;
  memory: 'fine' | 'gaps' | 'what_was_i_doing' | null;
  motivation: 'ready' | 'push' | 'struggled' | 'couldnt_start' | null;
  feeling_like_yourself: 'yes' | 'mostly' | 'not_really' | 'not_at_all' | null;
  screen_behaviour: 'normal' | 'more' | 'doom_scroll' | 'numb' | null;
  social_energy: 'wanted_people' | 'either_way' | 'needed_quiet' | 'antisocial' | null;
  social_match: 'yes' | 'more_than_wanted' | 'less_than_wanted' | null;
  emotional_eating: 'no' | 'a_little' | 'yes' | null;
  // legacy compat
  memory_gaps?: boolean;
  emotional_sensitivity?: boolean;
}

export interface LogAppetite {
  appetite: 'none' | 'low' | 'normal' | 'more' | 'couldnt_stop' | null;
  cravings: ('none' | 'sweet' | 'salty' | 'carbs' | 'everything' | 'specific')[];
  cravings_detail: string;
  bloating: 'none' | 'mild' | 'noticeable' | 'uncomfortable' | null;
  digestion: 'normal' | 'sluggish' | 'unsettled' | 'nausea' | 'both_ends' | null;
  unusual_thirst: boolean;
  bowel_movements: 'none' | 'once_normal' | 'multiple' | 'loose' | 'hard' | 'urgent' | null;
  // legacy compat
  appetite_score?: number;
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
  skin_today: 'clear' | 'few_spots' | 'breaking_out' | 'cystic' | 'irritated' | null;
  breakout_locations: string[];
  skin_feel: 'normal' | 'dry' | 'oily' | 'sensitive' | 'combination' | null;
  new_skincare: boolean;
  new_skincare_detail: string;
  hair_shedding: 'normal' | 'more' | 'a_lot_more' | null;
  scalp: 'fine' | 'itchy' | 'dry' | 'tender' | null;
  // legacy compat
  hair_shedding_elevated?: boolean;
  scalp_changes?: string;
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
  alcohol_units: 'none' | '1-2' | '3-4' | '4_plus' | null;
  alcohol_type: 'wine' | 'beer' | 'spirits' | 'mixed' | null;
  next_morning_feel: 'fine' | 'slightly_off' | 'rough' | 'regrets' | null;
  caffeine: 'normal' | 'more' | 'less' | 'none' | null;
  other?: string;
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
