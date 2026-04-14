import { DailyLog } from '@/data/types';

export const QuickStats = ({ logs }: { logs: DailyLog[] }) => {
  const last7 = logs.slice(-7);

  const avgEnergy = last7.reduce((s, l) => s + (l.energy?.energy_level || 0), 0) / last7.length;
  const avgSleep = last7.reduce((s, l) => s + (l.sleep?.hours_slept || 0), 0) / last7.length;
  const restDays = logs.slice(-30).filter(l => l.energy?.functional_capacity === 'rest').length;

  const stats = [
    { label: 'Avg energy', value: avgEnergy.toFixed(1), suffix: '/5' },
    { label: 'Avg sleep', value: avgSleep.toFixed(1), suffix: 'hrs' },
    { label: 'Rest days', value: restDays.toString(), suffix: 'this month' },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map(s => (
        <div key={s.label} className="rounded-lg border bg-card p-3 text-center">
          <p className="text-lg font-bold text-foreground">{s.value}</p>
          <p className="text-[10px] text-muted-foreground">{s.suffix}</p>
          <p className="text-[10px] text-muted-foreground mt-1">{s.label}</p>
        </div>
      ))}
    </div>
  );
};
