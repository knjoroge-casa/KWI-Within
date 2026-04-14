import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { format, subDays } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const DoctorReport = () => {
  const { profile, logs, records, insights } = useApp();
  const navigate = useNavigate();
  const [days, setDays] = useState(30);
  const [discussion, setDiscussion] = useState('');
  const [generated, setGenerated] = useState(false);

  const periodLogs = logs.filter(l => {
    const logDate = new Date(l.date);
    return logDate >= subDays(new Date(), days);
  });

  const handleGenerate = () => {
    setGenerated(true);
    toast.success("Report preview generated.");
  };

  return (
    <div className="space-y-4">
      <button onClick={() => navigate('/insights')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Insights
      </button>

      <h2 className="text-xl font-bold">Doctor Report</h2>
      <p className="text-xs text-muted-foreground">A structured summary of your data for your healthcare provider.</p>

      {/* Date range */}
      <div className="rounded-lg border bg-card p-4 space-y-2">
        <p className="text-sm font-medium">Date range</p>
        <div className="flex gap-2">
          {[14, 30, 60, 90].map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`rounded-full px-3 py-1 text-xs border transition-colors ${days === d ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:bg-muted'}`}>
              {d} days
            </button>
          ))}
        </div>
      </div>

      {/* Discussion topic */}
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm font-medium mb-2">What do you want to discuss?</p>
        <textarea
          value={discussion}
          onChange={e => setDiscussion(e.target.value)}
          placeholder="e.g., Fibroid management options, fatigue that won't shift, cycle changes..."
          className="w-full rounded-md border bg-background p-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px]"
        />
      </div>

      {/* Preview */}
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm font-medium mb-2">Report will include:</p>
        <ul className="space-y-1 text-xs text-muted-foreground">
          <li>• {periodLogs.length} days of symptom data</li>
          <li>• Energy & sleep trends</li>
          <li>• Symptom frequency summary</li>
          <li>• {records.filter(r => r.record_type === 'lab_result').length} lab results</li>
          <li>• AI-generated correlations</li>
          {discussion && <li>• Your discussion notes</li>}
        </ul>
      </div>

      {!generated ? (
        <Button onClick={handleGenerate} className="w-full" size="lg">Generate Report</Button>
      ) : (
        <div className="space-y-4">
          {/* Report preview */}
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <div className="border-b pb-3">
              <h3 className="text-base font-bold">Patient Health Summary</h3>
              <p className="text-xs text-muted-foreground">Generated {format(new Date(), 'dd MMM yyyy')} — covering {days} days</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Patient</p>
              <p className="text-sm">{profile.name}, {new Date().getFullYear() - new Date(profile.birthday).getFullYear()} years</p>
              <p className="text-xs text-muted-foreground">Perimenopause status: {profile.perimenopause_status} | Fibroids: {profile.has_fibroids}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Key Metrics ({days} days)</p>
              <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
                <span>Avg energy: {(periodLogs.reduce((s, l) => s + (l.energy?.energy_level || 0), 0) / periodLogs.length).toFixed(1)}/5</span>
                <span>Avg sleep: {(periodLogs.reduce((s, l) => s + (l.sleep?.hours_slept || 0), 0) / periodLogs.length).toFixed(1)} hrs</span>
                <span>Rest days: {periodLogs.filter(l => l.energy?.functional_capacity === 'rest').length}</span>
                <span>Data points: {periodLogs.length}</span>
              </div>
            </div>

            {discussion && (
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Patient's Discussion Points</p>
                <p className="text-sm mt-1">{discussion}</p>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Notable Correlations</p>
              <ul className="text-xs mt-1 space-y-1 text-muted-foreground">
                <li>• Energy crashes correlate with nights under 6.5 hours sleep</li>
                <li>• Fibroid symptoms peak in pre-menstrual phase</li>
                <li>• Mood improvements on exercise days (particularly yoga/pilates)</li>
              </ul>
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={() => toast("PDF export coming soon — this is a UI preview.")}>
            Export as PDF
          </Button>
        </div>
      )}
    </div>
  );
};

export default DoctorReport;
