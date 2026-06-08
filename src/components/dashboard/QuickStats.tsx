interface Props {
  avgEnergy: number | null;
  avgSleep: number | null;
  restDaysThisMonth: number;
}

export const QuickStats = ({ avgEnergy, avgSleep, restDaysThisMonth }: Props) => {
  const stats = [
    {
      label: 'Avg energy',
      value: avgEnergy !== null ? avgEnergy.toFixed(1) : '—',
      suffix: avgEnergy !== null ? '/ 5' : '',
    },
    {
      label: 'Avg sleep',
      value: avgSleep !== null ? avgSleep.toFixed(1) : '—',
      suffix: avgSleep !== null ? 'hrs' : '',
    },
    {
      label: 'Rest days',
      value: restDaysThisMonth.toString(),
      suffix: 'this month',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map(s => (
        <div key={s.label} className="rounded-lg border bg-card p-3 text-center">
          <p className="text-lg font-bold text-foreground">{s.value}</p>
          {s.suffix && <p className="text-[10px] text-muted-foreground">{s.suffix}</p>}
          <p className="text-[10px] text-muted-foreground mt-1">{s.label}</p>
        </div>
      ))}
    </div>
  );
};
