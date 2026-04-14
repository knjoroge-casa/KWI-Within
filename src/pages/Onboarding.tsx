import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MultiSelect = ({ options, selected, onChange }: { options: { value: string; label: string }[]; selected: string[]; onChange: (v: string[]) => void }) => (
  <div className="flex flex-wrap gap-2">
    {options.map(o => (
      <button key={o.value} onClick={() => onChange(selected.includes(o.value) ? selected.filter(s => s !== o.value) : [...selected, o.value])}
        className={cn("rounded-full px-4 py-2 text-sm border transition-colors",
          selected.includes(o.value) ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-muted")}>
        {o.label}
      </button>
    ))}
  </div>
);

const OptionPicker = ({ options, value, onChange }: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) => (
  <div className="flex flex-wrap gap-2">
    {options.map(o => (
      <button key={o.value} onClick={() => onChange(o.value)}
        className={cn("rounded-full px-4 py-2 text-sm border transition-colors",
          value === o.value ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-muted")}>
        {o.label}
      </button>
    ))}
  </div>
);

const Onboarding = () => {
  const { profile, setProfile, setOnboarded } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(profile.name);
  const [fibroids, setFibroids] = useState(profile.has_fibroids);
  const [hormonal, setHormonal] = useState(profile.hormonal_treatment);
  const [conditions, setConditions] = useState(profile.diagnosed_conditions);
  const [perimenopause, setPerimenopause] = useState(profile.perimenopause_status);
  const [cycle, setCycle] = useState(profile.has_regular_cycle);
  const [joints, setJoints] = useState(profile.joint_conditions);
  const [exerciseReg, setExerciseReg] = useState(profile.exercises_regularly);
  const [exerciseTypes, setExerciseTypes] = useState(profile.exercise_types);
  const [stress, setStress] = useState(profile.stress_baseline);
  const [goals, setGoals] = useState(profile.tracking_goals);

  const totalSteps = 4;
  const progress = ((step + 1) / totalSteps) * 100;

  const handleFinish = () => {
    setProfile({
      ...profile,
      name,
      has_fibroids: fibroids,
      hormonal_treatment: hormonal,
      diagnosed_conditions: conditions,
      perimenopause_status: perimenopause,
      has_regular_cycle: cycle,
      joint_conditions: joints,
      exercises_regularly: exerciseReg,
      exercise_types: exerciseTypes,
      stress_baseline: stress,
      tracking_goals: goals,
    });
    setOnboarded(true);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="mx-auto w-full max-w-lg px-6 py-8 flex-1 flex flex-col">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary mb-1">KWI</h1>
          <Progress value={progress} className="h-1.5" />
          <p className="text-[10px] text-muted-foreground mt-2">You can update this anytime in settings.</p>
        </div>

        <div className="flex-1 space-y-6">
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-1">Let's start with you</h2>
                <p className="text-sm text-muted-foreground">Just the basics.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">What should we call you?</label>
                  <input value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-1">About your body</h2>
                <p className="text-sm text-muted-foreground">This helps us show you the right tracking sections.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Fibroids?</p>
                  <OptionPicker value={fibroids} onChange={(v) => setFibroids(v as any)} options={[
                    { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' },
                    { value: 'suspected', label: 'Suspected' }, { value: 'removed', label: 'Removed' },
                  ]} />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Perimenopause?</p>
                  <OptionPicker value={perimenopause} onChange={(v) => setPerimenopause(v as any)} options={[
                    { value: 'yes', label: 'Yes' }, { value: 'suspected', label: 'I think so' },
                    { value: 'no', label: 'No' }, { value: 'unsure', label: 'Unsure' },
                  ]} />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Is your cycle regular?</p>
                  <OptionPicker value={cycle} onChange={(v) => setCycle(v as any)} options={[
                    { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'irregular', label: 'Irregular' },
                  ]} />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Any diagnosed conditions?</p>
                  <MultiSelect selected={conditions} onChange={setConditions} options={[
                    { value: 'endometriosis', label: 'Endometriosis' },
                    { value: 'pcos', label: 'PCOS' },
                    { value: 'thyroid', label: 'Thyroid' },
                    { value: 'autoimmune', label: 'Autoimmune' },
                    { value: 'other', label: 'Other' },
                  ]} />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Joint issues?</p>
                  <OptionPicker value={joints ? 'yes' : 'no'} onChange={(v) => setJoints(v === 'yes')} options={[
                    { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' },
                  ]} />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-1">Your lifestyle</h2>
                <p className="text-sm text-muted-foreground">Helps us tailor your daily log.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Do you exercise regularly?</p>
                  <OptionPicker value={exerciseReg ? 'yes' : 'no'} onChange={(v) => setExerciseReg(v === 'yes')} options={[
                    { value: 'yes', label: 'Yes' }, { value: 'no', label: 'Not really' },
                  ]} />
                </div>
                {exerciseReg && (
                  <div>
                    <p className="text-sm font-medium mb-2">What kind?</p>
                    <MultiSelect selected={exerciseTypes} onChange={setExerciseTypes} options={[
                      { value: 'strength', label: 'Strength' },
                      { value: 'cardio', label: 'Cardio' },
                      { value: 'yoga_pilates', label: 'Yoga / Pilates' },
                      { value: 'walking', label: 'Walking' },
                      { value: 'running', label: 'Running' },
                      { value: 'sport', label: 'Sport' },
                      { value: 'other', label: 'Other' },
                    ]} />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium mb-2">Stress baseline?</p>
                  <OptionPicker value={stress} onChange={(v) => setStress(v as any)} options={[
                    { value: 'low', label: 'Low' }, { value: 'moderate', label: 'Moderate' }, { value: 'high', label: 'High' },
                  ]} />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-1">What do you want to understand?</h2>
                <p className="text-sm text-muted-foreground">Pick as many as you like. This shapes your insights.</p>
              </div>
              <MultiSelect selected={goals} onChange={setGoals} options={[
                { value: 'energy', label: '⚡ Energy patterns' },
                { value: 'cycle', label: '🔄 Cycle changes' },
                { value: 'fibroids', label: '🎯 Fibroid symptoms' },
                { value: 'mental_emotional', label: '🧠 Mental & emotional' },
                { value: 'exercise', label: '💪 Exercise response' },
                { value: 'general', label: '📊 General tracking' },
              ]} />
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-6">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1">Back</Button>
          )}
          {step < totalSteps - 1 ? (
            <Button onClick={() => setStep(s => s + 1)} className="flex-1">Continue</Button>
          ) : (
            <Button onClick={handleFinish} className="flex-1">Let's go</Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
