import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';

const CONVERSATION: Array<{ role: 'user' | 'kwi'; text: string }> = [
  { role: 'user', text: "Why have I been so tired this week?" },
  {
    role: 'kwi',
    text: "Looking at your logs from the last 7 days, you rated your energy below 3 on 5 out of 7 days. Your sleep averaged 5.5 hours, which is below your usual 7. Your period also started on Tuesday — energy dips in the first two days of your cycle are a pattern in your data. These three things together might explain how you've been feeling. Worth mentioning the sleep pattern to your doctor if it continues.",
  },
];

export const AskKWIButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Ask KWI"
        className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 active:scale-95 transition-all"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="h-[85vh] flex flex-col gap-0 p-0 rounded-t-2xl">
          <div className="flex items-start justify-between px-4 pt-5 pb-3 border-b shrink-0">
            <div>
              <h2 className="font-semibold">Ask KWI</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Ask anything about your data</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 hover:bg-muted transition-colors mt-0.5"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {CONVERSATION.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'kwi' && (
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center mr-2 shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">K</span>
                  </div>
                )}
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed max-w-[85%] ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-muted rounded-tl-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 px-4 pb-8 pt-3 border-t shrink-0">
            <input
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Ask about your data..."
              className="flex-1 rounded-full border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              disabled={!inputText.trim()}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40 transition-opacity shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
