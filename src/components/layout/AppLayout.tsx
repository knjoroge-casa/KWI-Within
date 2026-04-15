import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AppLayout = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur-md">
        <div className="w-8" />
        <img
          src="/LogoMain.png"
          alt="Logo"
          className="max-h-full w-auto object-contain"
        />
        <button
          onClick={() => navigate('/settings')}
          className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Settings className="h-5 w-5" />
        </button>
      </header>
      <main className="mx-auto max-w-lg px-4 py-4">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};
