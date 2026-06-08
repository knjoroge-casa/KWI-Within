import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { isMonday, isToday, parseISO } from 'date-fns';

interface Props {
  userId: string;
}

const STORAGE_KEY = 'weekly_insight_last_shown';

type Insight = {
  id: string;
  content: Record<string, unknown>;
};

export const WeeklyInsightModal = ({ userId }: Props) => {
  const [visible, setVisible] = useState(false);
  const [insight, setInsight] = useState<Insight | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;

    const today = new Date();
    if (!isMonday(today)) return;

    const lastShown = localStorage.getItem(STORAGE_KEY);
    if (lastShown && isToday(parseISO(lastShown))) return;

    supabase
      .from('ai_insights')
      .select('id, content')
      .eq('user_id', userId)
      .eq('insight_type', 'weekly_summary')
      .or('dismissed.eq.false,dismissed.is.null')
      .is('deleted_at', null)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setInsight({ id: data.id, content: data.content as Record<string, unknown> });
        setVisible(true);
        localStorage.setItem(STORAGE_KEY, today.toISOString());
      });
  }, [userId]);

  if (!visible || !insight) return null;

  const content = insight.content;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border bg-card p-5 shadow-lg relative">
        <button
          onClick={() => setVisible(false)}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <p className="text-xs font-medium text-primary mb-2">✨ Your weekly insight is ready</p>

        {typeof content.summary === 'string' && (
          <p className="text-sm text-foreground/90 leading-relaxed mb-4">{content.summary}</p>
        )}

        {Array.isArray(content.highlights) && (
          <ul className="mb-4 space-y-1">
            {(content.highlights as string[]).slice(0, 2).map((h, i) => (
              <li key={i} className="text-xs text-muted-foreground">• {h}</li>
            ))}
          </ul>
        )}

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => {
              setVisible(false);
              navigate('/insights');
            }}
            className="flex-1"
          >
            Read more
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setVisible(false)}
            className="flex-1"
          >
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
};
