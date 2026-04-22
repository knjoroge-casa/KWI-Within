import { UserProfile, DailyLog, MedicalRecord, AIInsight } from './types';
import { subDays, format } from 'date-fns';

const today = new Date();
const d = (daysAgo: number) => format(subDays(today, daysAgo), 'yyyy-MM-dd');

export const defaultProfile: UserProfile = {
  name: 'Kui',
  birthday: '1983-06-15',
  weight: 72,
  height: 165,
  has_fibroids: 'yes',
  hormonal_treatment: 'none',
  diagnosed_conditions: [],
  perimenopause_status: 'suspected',
  has_regular_cycle: 'irregular',
  joint_conditions: true,
  joint_conditions_detail: 'Knee stiffness, occasional lower back',
  exercises_regularly: true,
  exercise_types: ['strength', 'yoga_pilates', 'walking'],
  tracks_food: false,
  stress_baseline: 'moderate',
  tracking_goals: ['energy', 'fibroids', 'cycle', 'exercise'],
};

const energyPatterns = [3, 4, 2, 3, 4, 5, 3, 2, 3, 4, 4, 3, 2, 1, 2, 3, 4, 4, 5, 3, 3, 2, 4, 3, 3, 4, 2, 3, 4, 5, 3, 2, 3, 4, 3, 2, 4, 3, 3, 4, 5, 3];
const sleepPatterns = [6.5, 7, 5.5, 7.5, 8, 6, 7, 5, 6.5, 7.5, 7, 6.5, 5, 4.5, 6, 7, 7.5, 8, 7, 6.5, 7, 5.5, 7.5, 6, 6.5, 7, 5, 6.5, 7, 8, 7, 6, 7, 7.5, 6.5, 5.5, 7, 6.5, 7, 7.5, 8, 7];
const capacityPatterns: ('full' | 'reduced' | 'rest')[] = ['full', 'full', 'reduced', 'full', 'full', 'full', 'reduced', 'rest', 'reduced', 'full', 'full', 'full', 'reduced', 'rest', 'rest', 'reduced', 'full', 'full', 'full', 'full', 'reduced', 'rest', 'full', 'full', 'reduced', 'full', 'rest', 'reduced', 'full', 'full', 'full', 'reduced', 'full', 'full', 'reduced', 'rest', 'full', 'full', 'full', 'full', 'full', 'reduced'];
const moodPatterns = [3, 4, 2, 3, 4, 4, 3, 2, 3, 4, 4, 3, 2, 2, 3, 3, 4, 4, 5, 4, 3, 2, 4, 3, 3, 4, 2, 3, 4, 4, 3, 2, 3, 4, 3, 2, 4, 3, 4, 4, 5, 4];

export const placeholderLogs: DailyLog[] = Array.from({ length: 42 }, (_, i) => {
  const daysAgo = 41 - i;
  const energy = energyPatterns[i] || 3;
  const sleep = sleepPatterns[i] || 7;
  const capacity = capacityPatterns[i] || 'full';
  const mood = moodPatterns[i] || 3;

  const energyToLevel = (n: number): 'dead' | 'low' | 'okay' | 'good' | 'charged' =>
    (['dead', 'low', 'okay', 'good', 'charged'] as const)[Math.max(0, Math.min(4, n - 1))];
  const sleepToQuality = (h: number): 'terrible' | 'poor' | 'okay' | 'good' | 'deep' => {
    if (h < 5) return 'terrible';
    if (h < 6) return 'poor';
    if (h < 7) return 'okay';
    if (h < 8) return 'good';
    return 'deep';
  };
  const moodEmoji = (m: number): '😔' | '🙁' | '😐' | '🙂' | '😄' =>
    (['😔', '🙁', '😐', '🙂', '😄'] as const)[Math.max(0, Math.min(4, m - 1))];

  const log: DailyLog = {
    id: `log-${daysAgo}`,
    date: d(daysAgo),
    completed: daysAgo > 0,
    energy: {
      energy_level: energy,
      morning_energy: energyToLevel(energy),
      midday_energy: energyToLevel(Math.max(1, energy - (energy <= 2 ? 0 : 1))),
      evening_energy: energyToLevel(Math.max(1, energy - 1)),
      functional_capacity: capacity === 'reduced' ? 'got_through' : capacity,
      energy_crash_time: energy <= 2 ? 'after_lunch' : 'none',
      rest_helped: capacity === 'rest' ? 'yes' : null,
    },
    sleep: {
      hours_slept: sleep,
      sleep_quality: sleepToQuality(sleep),
      night_sweats: i % 7 === 0 ? 'mild' : 'none',
      woke_during_night: sleep < 6 ? 'all_night' : sleep < 7 ? 'once' : 'slept_through',
      felt_rested: sleep >= 7 ? 'yes' : sleep >= 6 ? 'kind_of' : 'no',
    },
    mood: {
      mood_score: mood,
      mood_emoji: moodEmoji(mood),
      anxiety: mood <= 2 ? 'noticeable' : mood <= 3 ? 'hum' : 'none',
      irritability: mood <= 2 ? 'a_lot' : 'none',
      brain_fog: energy <= 2 ? 'foggy' : energy <= 3 ? 'cloudy' : 'sharp',
      memory: energy <= 2 ? 'gaps' : 'fine',
      motivation: energy <= 2 ? 'struggled' : 'ready',
      screen_behaviour: mood <= 2 ? 'doom_scroll' : 'normal',
      social_energy: mood <= 2 ? 'needed_quiet' : 'either_way',
      social_match: 'yes',
      emotional_eating: mood <= 2 ? 'a_little' : 'no',
      feeling_like_yourself: mood >= 4 ? 'yes' : mood >= 3 ? 'mostly' : 'not_really',
    },
  };

  // Cycle data - simulate a period around days 14-18 ago and days 40-42 ago
  if (daysAgo >= 14 && daysAgo <= 18) {
    log.cycle = {
      period_status: daysAgo === 18 ? 'started' : daysAgo === 14 ? 'ended' : 'ongoing',
      flow_intensity: daysAgo === 16 ? 'heavy' : daysAgo === 17 ? 'medium' : 'light',
      clotting: daysAgo === 16 ? 'large' : 'small',
      cramping: daysAgo >= 16 ? 'moderate' : 'mild',
      cycle_phase_estimated: 'menstrual',
      notes: '',
    };
  } else if (daysAgo >= 38 && daysAgo <= 41) {
    log.cycle = {
      period_status: daysAgo === 41 ? 'started' : daysAgo === 38 ? 'ended' : 'ongoing',
      flow_intensity: daysAgo === 40 ? 'heavy' : 'medium',
      clotting: daysAgo === 40 ? 'large' : 'none',
      cramping: daysAgo >= 39 ? 'moderate' : 'none',
      cycle_phase_estimated: 'menstrual',
      notes: '',
    };
  }

  // Fibroid symptoms - more intense around period
  if (i % 3 === 0 || (daysAgo >= 14 && daysAgo <= 18)) {
    log.fibroid = {
      pelvic_pain: (daysAgo >= 14 && daysAgo <= 18) ? 'moderate' : i % 5 === 0 ? 'mild' : 'none',
      pelvic_heaviness: (daysAgo >= 14 && daysAgo <= 18) ? 'moderate' : 'mild',
      lower_back_pain: capacity === 'rest' ? 'moderate' : 'mild',
      abdomen_distended: daysAgo >= 15 && daysAgo <= 17,
      urinary_urgency: daysAgo >= 15 && daysAgo <= 17,
      anaemia_symptoms: { breathlessness: energy <= 2, dizziness: energy <= 1, pallor: false },
    };
  }

  // Activity - some days
  if (capacity !== 'rest' && i % 2 === 0) {
    log.activity = {
      exercised: 'yes',
      exercise_types: i % 3 === 0 ? ['strength'] : ['yoga_pilates', 'walking'],
      duration_mins: i % 3 === 0 ? 45 : 30,
      intensity: energy >= 4 ? 'moderate' : 'light',
      body_feel_during: energy >= 4 ? 'good' : 'struggled_but_finished',
      body_feel_after: energy >= 4 ? 'energised' : 'normal',
      motivation_going_in: mood >= 3 ? 'motivated' : 'pushed_through',
      mind_body_alignment: energy >= 3 && mood >= 3 ? 'both_aligned' : 'mind_willing_body_not',
      rest_day_type: 'not_a_rest_day',
      steps: 5000 + Math.round(Math.random() * 8000),
    };
  }

  return log;
});

export const placeholderRecords: MedicalRecord[] = [
  {
    id: 'rec-1', record_type: 'lab_result', date: d(35), title: 'Full Blood Count',
    details: { test_name: 'Haemoglobin', value: 11.2, unit: 'g/dL', ref_low: 12.0, ref_high: 15.5, lab_name: 'CityLab', flagged: true },
  },
  {
    id: 'rec-2', record_type: 'lab_result', date: d(35), title: 'Ferritin',
    details: { test_name: 'Ferritin', value: 15, unit: 'ng/mL', ref_low: 20, ref_high: 200, lab_name: 'CityLab', flagged: true },
  },
  {
    id: 'rec-3', record_type: 'lab_result', date: d(35), title: 'TSH',
    details: { test_name: 'TSH', value: 2.1, unit: 'mIU/L', ref_low: 0.4, ref_high: 4.0, lab_name: 'CityLab', flagged: false },
  },
  {
    id: 'rec-1b', record_type: 'lab_result', date: d(90), title: 'Full Blood Count',
    details: { test_name: 'Haemoglobin', value: 11.8, unit: 'g/dL', ref_low: 12.0, ref_high: 15.5, lab_name: 'CityLab', flagged: true },
  },
  {
    id: 'rec-2b', record_type: 'lab_result', date: d(90), title: 'Ferritin',
    details: { test_name: 'Ferritin', value: 18, unit: 'ng/mL', ref_low: 20, ref_high: 200, lab_name: 'CityLab', flagged: true },
  },
  {
    id: 'rec-4', record_type: 'scan', date: d(60), title: 'Pelvic Ultrasound',
    details: { scan_type: 'Transvaginal ultrasound', findings: 'Intramural fibroid 4.2cm posterior wall. Subserosal fibroid 2.1cm fundal. Endometrium 8mm.', facility: 'Womens Imaging Centre' },
  },
  {
    id: 'rec-5', record_type: 'medication', date: d(120), title: 'Tranexamic Acid',
    details: { name: 'Tranexamic Acid', dose: '500mg', frequency: 'As needed during period', start_date: d(120), prescriber: 'Dr Chen', reason: 'Heavy menstrual bleeding' },
  },
  {
    id: 'rec-6', record_type: 'supplement', date: d(90), title: 'Iron Bisglycinate',
    details: { name: 'Iron Bisglycinate', dose: '25mg', reason: 'Low ferritin', start_date: d(90) },
  },
  {
    id: 'rec-7', record_type: 'supplement', date: d(90), title: 'Vitamin D3',
    details: { name: 'Vitamin D3', dose: '2000 IU', reason: 'General', start_date: d(180) },
  },
  {
    id: 'rec-8', record_type: 'appointment', date: d(10), title: 'Gynaecology Follow-up',
    details: { provider: 'Dr Chen', specialty: 'Gynaecology', summary: 'Reviewed ultrasound. Fibroids stable. Discussed management options including UAE and myomectomy. Continue iron supplementation.', action_items: 'Repeat bloods in 3 months. Consider MRI if symptoms worsen.', followup_date: d(-80) },
  },
];

export const placeholderInsights: AIInsight[] = [
  {
    id: 'ins-1',
    generated_at: d(1),
    period_start: d(7),
    period_end: d(1),
    insight_type: 'weekly_summary',
    dismissed: false,
    content: {
      summary: "Your energy dipped mid-week — that afternoon crash pattern is showing up again, especially on days you slept under 6.5 hours. On the bright side, your rest days this week seem to have actually helped. Your body's getting better at telling you what it needs.",
      highlights: [
        'Energy crashes correlate with nights under 6.5 hours sleep',
        'Rest days followed by improved energy the next day',
        'Joint stiffness appeared 3 times this week, all mornings',
      ],
    },
  },
  {
    id: 'ins-2',
    generated_at: d(1),
    period_start: d(30),
    period_end: d(1),
    insight_type: 'correlation_flags',
    dismissed: false,
    content: {
      correlations: [
        { pair: ['Heavy flow days', 'Low energy'], strength: 'strong', note: 'Energy drops to 1-2 on heavy flow days — your body is working hard.' },
        { pair: ['Brain fog', 'Poor sleep'], strength: 'moderate', note: 'Brain fog shows up mostly after nights with multiple wakeups.' },
        { pair: ['Yoga days', 'Better mood'], strength: 'moderate', note: 'Mood scores are consistently higher on days you do yoga or pilates.' },
        { pair: ['Pelvic heaviness', 'Cycle day'], strength: 'strong', note: 'Fibroid symptoms peak in the 2 days before your period starts.' },
      ],
    },
  },
];

export const didYouKnowFacts = [
  "Perimenopause can start up to 10 years before menopause. If things feel different in your early 40s — they probably are.",
  "Fibroids affect up to 80% of women by age 50. You're not unusual. You're just paying attention.",
  "Brain fog during perimenopause is real — declining oestrogen affects neurotransmitters. Your brain isn't broken, it's adapting.",
  "Joint pain in perimenopause? Oestrogen is anti-inflammatory. As it fluctuates, your joints notice.",
  "Your ferritin (iron stores) needs to be above 30 for most women to feel energised. 'Normal range' starts at 20 but that's a low bar.",
  "Hot flashes are your nervous system recalibrating its thermostat. Annoying, but not dangerous.",
  "Progesterone is your calming hormone. When it drops in perimenopause, anxiety can spike seemingly out of nowhere.",
];

export const quotes = [
  { text: "You are not broken. Your body is changing, and that takes energy.", author: "KWI" },
  { text: "Rest is not giving up. It's getting smarter about how you show up.", author: "KWI" },
  { text: "Some days the data is the win. You showed up and noticed.", author: "KWI" },
  { text: "Your body has been doing extraordinary things for decades. It's allowed to be loud about it sometimes.", author: "KWI" },
  { text: "Tracking isn't about control. It's about understanding.", author: "KWI" },
];

export const symptomFrequencyData = [
  { name: 'Brain fog', count: 14 },
  { name: 'Joint stiffness', count: 12 },
  { name: 'Fatigue', count: 11 },
  { name: 'Night sweats', count: 6 },
  { name: 'Pelvic heaviness', count: 8 },
  { name: 'Bloating', count: 7 },
  { name: 'Anxiety', count: 9 },
  { name: 'Headache', count: 5 },
].sort((a, b) => b.count - a.count);
