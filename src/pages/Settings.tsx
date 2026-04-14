import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const Settings = () => {
  const { profile, setOnboarded } = useApp();
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <button onClick={() => navigate('/')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h2 className="text-xl font-bold">Settings</h2>

      {/* Profile */}
      <div className="rounded-lg border bg-card p-4 space-y-2">
        <h3 className="text-sm font-semibold">Profile</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div><span className="text-muted-foreground">Name:</span> {profile.name}</div>
          <div><span className="text-muted-foreground">Age:</span> {new Date().getFullYear() - new Date(profile.birthday).getFullYear()}</div>
          <div><span className="text-muted-foreground">Fibroids:</span> {profile.has_fibroids}</div>
          <div><span className="text-muted-foreground">Perimenopause:</span> {profile.perimenopause_status}</div>
          <div><span className="text-muted-foreground">Cycle:</span> {profile.has_regular_cycle}</div>
          <div><span className="text-muted-foreground">Stress:</span> {profile.stress_baseline}</div>
        </div>
        <Button variant="outline" size="sm" onClick={() => { setOnboarded(false); navigate('/onboarding'); }}>
          Edit profile
        </Button>
      </div>

      {/* Notifications */}
      <div className="rounded-lg border bg-card p-4 space-y-2">
        <h3 className="text-sm font-semibold">Daily log reminder</h3>
        <p className="text-xs text-muted-foreground">Get a nudge to log at a time that works for you.</p>
        <div className="flex items-center gap-2">
          <input type="time" defaultValue="21:00" className="rounded-md border bg-background px-3 py-1.5 text-sm" />
          <Button size="sm" variant="outline" onClick={() => toast.success("Reminder set.")}>Save</Button>
        </div>
      </div>

      {/* Import */}
      <div className="rounded-lg border bg-card p-4 space-y-2">
        <h3 className="text-sm font-semibold">Import cycle data</h3>
        <p className="text-xs text-muted-foreground">Upload from Apple Health (XML) or CSV.</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1" onClick={() => toast("Import coming soon.")}>
            <Upload className="h-3 w-3" /> Apple Health XML
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => toast("Import coming soon.")}>
            <Upload className="h-3 w-3" /> CSV
          </Button>
        </div>
      </div>

      {/* Account */}
      <div className="rounded-lg border bg-card p-4 space-y-2">
        <h3 className="text-sm font-semibold">Account</h3>
        <p className="text-xs text-muted-foreground">Account management will be available when authentication is added.</p>
      </div>
    </div>
  );
};

export default Settings;
