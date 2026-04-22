import { DailyLog } from '@/data/types';

export const FunctionalCapacityBar = ({ logs }: { logs: DailyLog[] }) => {
  const last7 = logs.slice(-7);
  const full = last7.filter(l => l.energy?.functional_capacity === 'full').length;
  const reduced = last7.filter(l => l.energy?.functional_capacity === 'got_through' || l.energy?.functional_capacity === 'empty').length;
  const rest = last7.filter(l => l.energy?.functional_capacity === 'rest').length;
  const total = last7.length;

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-2 text-sm font-semibold">This week's capacity</h3>
      <div className="flex h-6 overflow-hidden rounded-full">
        {full > 0 && (
          <div className="bg-energy-5 flex items-center justify-center text-[10px] font-medium text-primary-foreground" style={{ width: `${(full / total) * 100}%` }}>
            {full}
          </div>
        )}
        {reduced > 0 && (
          <div className="bg-energy-3 flex items-center justify-center text-[10px] font-medium text-primary-foreground" style={{ width: `${(reduced / total) * 100}%` }}>
            {reduced}
          </div>
        )}
        {rest > 0 && (
          <div className="bg-energy-1 flex items-center justify-center text-[10px] font-medium text-primary-foreground" style={{ width: `${(rest / total) * 100}%` }}>
            {rest}
          </div>
        )}
      </div>
      <div className="mt-2 flex gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-energy-5" /> Full ({full})</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-energy-3" /> Reduced ({reduced})</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-energy-1" /> Rest ({rest})</span>
      </div>
    </div>
  );
};
