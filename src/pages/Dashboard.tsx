import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { HeatmapCalendar } from '@/components/dashboard/HeatmapCalendar';
import { SymptomBarChart } from '@/components/dashboard/SymptomBarChart';
import { RotatingCard } from '@/components/dashboard/RotatingCard';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { FunctionalCapacityBar } from '@/components/dashboard/FunctionalCapacityBar';
import { WeeklyInsightModal } from '@/components/dashboard/WeeklyInsightModal';
import { didYouKnowFacts, quotes, symptomFrequencyData } from '@/data/placeholder';
import { Button } from '@/components/ui/button';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const Dashboard = () => {
  const { profile, logs, insights, dismissInsight } = useApp();
  const navigate = useNavigate();

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayLog = logs.find(l => l.date === todayStr);
  const totalDays = logs.filter(l => l.completed).length;

  return (
    <div className="space-y-4">
      <WeeklyInsightModal insights={insights} />

      {/* Greeting */}
      <div>
        <h2 className="text-xl font-bold">
          {getGreeting()}, {profile.name}
        </h2>
        <p className="text-sm text-muted-foreground">
          {format(new Date(), 'EEEE, MMMM d')}
        </p>
        {totalDays > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {totalDays} days of data. Your dashboard is getting interesting.
          </p>
        )}
      </div>

      {/* Today's log status */}
      <div className="rounded-lg border bg-card p-4">
        {todayLog?.completed ? (
          <div className="flex items-center gap-2">
            <span className="text-accent text-lg">✓</span>
            <span className="text-sm">Today's log is done. Nice one.</span>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                How are you actually doing today?
              </p>
              <p className="text-xs text-muted-foreground">
                Your log is waiting.
              </p>
            </div>
            <Button size="sm" onClick={() => navigate('/log')}>
              Log now
            </Button>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <QuickStats logs={logs} />

      {/* Heatmap */}
      <HeatmapCalendar logs={logs} />

      {/* Functional Capacity */}
      <FunctionalCapacityBar logs={logs} />

      {/* Symptom Frequency */}
      <SymptomBarChart data={symptomFrequencyData} />

      {/* Did You Know — moved to after symptom chart */}
      <RotatingCard items={didYouKnowFacts} variant="fact" />

      {/* Quote */}
      <RotatingCard items={quotes} variant="quote" />
    </div>
  );
};

export default Dashboard;
