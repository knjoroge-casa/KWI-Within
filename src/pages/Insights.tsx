import { useApp } from '@/contexts/AppContext';
import { InsightCard } from '@/components/dashboard/InsightCard';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';
import { format, subDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Insights = () => {
  const { logs, insights, dismissInsight, records } = useApp();
  const navigate = useNavigate();

  // Energy over 90 days
  const energyData = logs.map(l => ({
    date: format(new Date(l.date), 'MMM d'),
    energy: l.energy?.energy_level || null,
  }));

  // Sleep over 90 days
  const sleepData = logs.map(l => ({
    date: format(new Date(l.date), 'MMM d'),
    sleep: l.sleep?.hours_slept || null,
  }));

  // Lab trends
  const labTests: Record<string, { date: string; value: number; ref_low: number; ref_high: number }[]> = {};
  records.filter(r => r.record_type === 'lab_result').forEach(r => {
    const name = r.details.test_name;
    if (!labTests[name]) labTests[name] = [];
    labTests[name].push({
      date: format(new Date(r.date), 'MMM d'),
      value: r.details.value,
      ref_low: r.details.ref_low,
      ref_high: r.details.ref_high,
    });
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Insights</h2>
      <p className="text-xs text-muted-foreground">What your data is telling you.</p>

      {/* AI Insights */}
      {insights.filter(i => !i.dismissed).map(i => (
        <InsightCard key={i.id} insight={i} onDismiss={dismissInsight} />
      ))}

      {/* Energy Trend */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3">Energy over time</h3>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={energyData}>
            <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis domain={[0, 5]} tick={{ fontSize: 10 }} width={20} />
            <Tooltip contentStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="energy" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Sleep Trend */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3">Sleep over time</h3>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={sleepData}>
            <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis domain={[3, 10]} tick={{ fontSize: 10 }} width={20} />
            <Tooltip contentStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="sleep" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
            <ReferenceLine y={7} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" label={{ value: '7h', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Lab Trends */}
      {Object.entries(labTests).map(([name, data]) => (
        <div key={name} className="rounded-lg border bg-card p-4">
          <h3 className="text-sm font-semibold mb-3">{name}</h3>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={data}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} width={30} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="ref_high" stroke="none" fill="hsl(var(--accent))" fillOpacity={0.1} />
              <Area type="monotone" dataKey="ref_low" stroke="none" fill="hsl(var(--background))" fillOpacity={1} />
              <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-muted-foreground mt-1">
            Reference range: {data[0]?.ref_low}–{data[0]?.ref_high} {records.find(r => r.details.test_name === name)?.details.unit}
          </p>
        </div>
      ))}

      {/* Doctor Report CTA */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-sm font-semibold mb-1">Ready for your next appointment?</h3>
        <p className="text-xs text-muted-foreground mb-3">Generate a summary for your doctor with your data, labs, and patterns.</p>
        <Button size="sm" onClick={() => navigate('/doctor-report')}>Create Doctor Report</Button>
      </div>
    </div>
  );
};

export default Insights;
