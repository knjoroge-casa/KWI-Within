import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { Plus, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

const tabs = [
  { id: 'lab_result', label: 'Labs' },
  { id: 'scan', label: 'Scans' },
  { id: 'medication', label: 'Meds' },
  { id: 'supplement', label: 'Supps' },
  { id: 'appointment', label: 'Appts' },
];

const Sparkline = ({ data }: { data: number[] }) => {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const h = 24;
  const w = 60;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');

  return (
    <svg width={w} height={h} className="inline-block">
      <polyline fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" points={points} />
    </svg>
  );
};

const Records = () => {
  const { records } = useApp();
  const [activeTab, setActiveTab] = useState('lab_result');

  const filtered = records
    .filter(r => r.record_type === activeTab)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Group lab results by test name for sparklines
  const labGroups: Record<string, number[]> = {};
  records.filter(r => r.record_type === 'lab_result').forEach(r => {
    const name = r.details.test_name;
    if (!labGroups[name]) labGroups[name] = [];
    labGroups[name].push(r.details.value);
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Medical Records</h2>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn("rounded-full px-4 py-1.5 text-xs font-medium whitespace-nowrap transition-colors border",
              activeTab === t.id ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-muted")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.map(rec => (
          <div key={rec.id} className="rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{rec.title}</p>
                  {rec.details.flagged && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                </div>
                <p className="text-xs text-muted-foreground">{format(new Date(rec.date), 'dd MMM yyyy')}</p>
              </div>
              {activeTab === 'lab_result' && labGroups[rec.details.test_name] && (
                <Sparkline data={labGroups[rec.details.test_name]} />
              )}
            </div>

            {/* Detail rendering */}
            {activeTab === 'lab_result' && (
              <div className="mt-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{rec.details.value} {rec.details.unit}</span>
                {' '}(ref: {rec.details.ref_low}–{rec.details.ref_high})
                {rec.details.flagged && <span className="text-destructive ml-1">⚑ Outside range</span>}
              </div>
            )}
            {activeTab === 'scan' && (
              <p className="mt-2 text-xs text-muted-foreground">{rec.details.findings}</p>
            )}
            {activeTab === 'medication' && (
              <p className="mt-2 text-xs text-muted-foreground">{rec.details.dose} — {rec.details.frequency}</p>
            )}
            {activeTab === 'supplement' && (
              <p className="mt-2 text-xs text-muted-foreground">{rec.details.dose} — {rec.details.reason}</p>
            )}
            {activeTab === 'appointment' && (
              <div className="mt-2 text-xs text-muted-foreground space-y-1">
                <p>{rec.details.summary}</p>
                {rec.details.action_items && <p className="font-medium text-foreground">Action: {rec.details.action_items}</p>}
              </div>
            )}
          </div>
        ))}
      </div>

      <Button variant="outline" className="w-full gap-2">
        <Plus className="h-4 w-4" /> Add {tabs.find(t => t.id === activeTab)?.label.toLowerCase()} record
      </Button>
    </div>
  );
};

export default Records;
