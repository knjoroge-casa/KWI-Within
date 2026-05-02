import { useState } from 'react';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { placeholderAppointments, placeholderPastReports } from '@/data/placeholder';
import type { PastReport } from '@/data/types';

// ── Constants ──

const PLUM = '#4a1f3d';

const DATE_RANGE_OPTIONS: Array<{ key: '30d' | '3m' | '6m' | 'custom'; label: string }> = [
  { key: '30d', label: 'Last 30 days' },
  { key: '3m',  label: 'Last 3 months' },
  { key: '6m',  label: 'Last 6 months' },
  { key: 'custom', label: 'Custom' },
];

const INCLUDE_ITEMS: Array<{ key: string; label: string; defaultOn: boolean; helper?: string }> = [
  { key: 'symptoms',     label: 'Symptom summary',                    defaultOn: true },
  { key: 'cycle',        label: 'Cycle data',                         defaultOn: true },
  { key: 'energy',       label: 'Energy and functional capacity',     defaultOn: true },
  { key: 'sleep',        label: 'Sleep patterns',                     defaultOn: true },
  { key: 'mood',         label: 'Mood and mental',                    defaultOn: true },
  { key: 'activity',     label: 'Activity',                           defaultOn: true },
  { key: 'substances',   label: 'Substances',                         defaultOn: true },
  { key: 'records',      label: 'Medical records',                    defaultOn: true },
  { key: 'appointments', label: 'Appointment history',                defaultOn: true },
  { key: 'observations', label: 'Within Kui pattern observations',    defaultOn: true },
  {
    key: 'thoughts',
    label: 'Thoughts entries',
    defaultOn: false,
    helper: "Only entries you've explicitly marked 'Include in doctor report' will be eligible. Off means none are included.",
  },
];

// ── Report content sub-component ──

function ReportContent({
  reportLength,
  includeThoughts,
}: {
  reportLength: 'full' | 'short';
  includeThoughts: boolean;
}) {
  const isFull = reportLength === 'full';

  const sectionLabel: React.CSSProperties = {
    fontFamily: 'sans-serif',
    fontSize: 13,
    fontWeight: 500,
    color: PLUM,
    letterSpacing: '1.2px',
    textTransform: 'uppercase',
    display: 'block',
    marginBottom: 12,
  };
  const tableWrap: React.CSSProperties = { overflowX: 'auto' };
  const table: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    borderTop: `1px solid ${PLUM}`,
  };
  const th: React.CSSProperties = {
    fontFamily: 'sans-serif',
    fontSize: 12,
    fontWeight: 500,
    color: PLUM,
    padding: '6px 8px',
    textAlign: 'left',
  };
  const td: React.CSSProperties = {
    fontSize: 13,
    padding: '6px 8px',
    borderBottom: '0.5px solid #ddd',
    verticalAlign: 'top',
  };
  const tdRed: React.CSSProperties = { ...td, color: '#a32d2d', fontWeight: 500 };

  return (
    <div
      style={{
        fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif',
        color: '#1a1a1a',
        maxWidth: 595,
        margin: '0 auto',
        padding: '32px 24px',
        background: 'white',
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: `1.5px solid ${PLUM}`,
          paddingBottom: 16,
          marginBottom: 28,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'sans-serif',
              fontSize: 13,
              fontWeight: 500,
              color: PLUM,
              letterSpacing: '1.2px',
              textTransform: 'uppercase',
            }}
          >
            Health Report
          </div>
          <div style={{ fontFamily: 'sans-serif', fontSize: 13, color: '#555', marginTop: 4 }}>
            Generated {format(new Date(), 'd MMMM yyyy')}
          </div>
        </div>
        <img src="/KWIHeaderM.png" alt="KWI Within" style={{ height: 44, width: 'auto' }} />
      </div>

      {/* PATIENT INFO */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 28 }}>
        <tbody>
          {[
            ['Patient',        'Kui Njoroge'],
            ['Date of birth',  '14 August 1982 (age 43)'],
            ['Report period',  '1 February 2026 – 1 May 2026 (3 months)'],
            ['Prepared for',   'Dr Wanjiru Osei, Gynaecology — 8 May 2026'],
          ].map(([label, value]) => (
            <tr key={label}>
              <td
                style={{
                  fontFamily: 'sans-serif',
                  fontSize: 13,
                  color: '#666',
                  padding: '4px 0',
                  width: '40%',
                }}
              >
                {label}
              </td>
              <td
                style={{ fontFamily: 'sans-serif', fontSize: 13, color: '#1a1a1a', padding: '4px 0' }}
              >
                {value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 1. WHAT I WANT TO DISCUSS */}
      <div style={{ marginBottom: 28 }}>
        <span style={sectionLabel}>What I want to discuss</span>
        <div
          style={{
            borderLeft: `2px solid ${PLUM}`,
            paddingLeft: 12,
            fontStyle: 'italic',
            fontSize: 15,
            lineHeight: 1.7,
          }}
        >
          Heavy bleeding has worsened over the past two cycles. I've also been experiencing
          increasing fatigue and hair shedding which I suspect may be linked. I'd like to discuss
          whether further imaging is needed and review my iron levels.
        </div>
      </div>

      {/* 2. SUMMARY */}
      <div style={{ marginBottom: 28 }}>
        <span style={sectionLabel}>Summary</span>
        <p style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 10 }}>
          Patient logged data on 84 of 90 days (93% adherence).
        </p>
        <ul style={{ fontSize: 14, lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
          <li>
            Heavy menstrual bleeding logged across all three cycles, with increasing intensity in
            the most recent cycle (clotting on 4 of 6 bleeding days)
          </li>
          <li>
            Fatigue logged on 47 of 84 days, with 12 days categorised as "rest day — body said no"
          </li>
          <li>Hair shedding flagged as elevated on 31 of 84 days</li>
          <li>
            Pelvic pressure logged on 22 days, predominantly in the second half of each cycle
          </li>
        </ul>
      </div>

      {/* 3. CYCLE HISTORY — full report only */}
      {isFull && (
        <div style={{ marginBottom: 28 }}>
          <span style={sectionLabel}>Cycle History</span>
          <div style={tableWrap}>
            <table style={table}>
              <thead>
                <tr>
                  {['Cycle start', 'Length', 'Flow', 'Notable'].map(h => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={td}>4 Feb 2026</td>
                  <td style={td}>6 days</td>
                  <td style={td}>Heavy days 1–4</td>
                  <td style={td}>Clotting days 2, 3</td>
                </tr>
                <tr>
                  <td style={td}>6 Mar 2026</td>
                  <td style={td}>7 days</td>
                  <td style={td}>Heavy days 1–5</td>
                  <td style={td}>Clotting days 2, 3, 4</td>
                </tr>
                <tr>
                  <td style={td}>8 Apr 2026</td>
                  <td style={td}>7 days</td>
                  <td style={td}>Very heavy days 1–4</td>
                  <td style={td}>Clotting days 1–4</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. SYMPTOM FREQUENCY */}
      <div style={{ marginBottom: 28 }}>
        <span style={sectionLabel}>Symptom Frequency</span>
        <div style={tableWrap}>
          <table style={table}>
            <thead>
              <tr>
                {['Symptom', 'Days logged', 'Trend'].map(h => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={td}>Fatigue</td>
                <td style={td}>47 / 84</td>
                <td style={td}>↑ Increased from 32</td>
              </tr>
              <tr>
                <td style={td}>Hair shedding (elevated)</td>
                <td style={td}>31 / 84</td>
                <td style={td}>↑ Increased from 18</td>
              </tr>
              <tr>
                <td style={td}>Pelvic pressure</td>
                <td style={td}>22 / 84</td>
                <td style={td}>↑ Increased from 14</td>
              </tr>
              <tr>
                <td style={td}>Brain fog</td>
                <td style={td}>19 / 84</td>
                <td style={td}>→ Stable</td>
              </tr>
              <tr>
                <td style={td}>Joint pain (knees, hips)</td>
                <td style={td}>11 / 84</td>
                <td style={td}>↑ Increased from 6</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. PATTERNS OBSERVED */}
      <div style={{ marginBottom: 28 }}>
        <span style={sectionLabel}>Patterns Observed</span>
        <ol style={{ fontSize: 14, lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
          <li>
            Fatigue and heavy bleeding — energy ratings dropped to 2 or below on all six days
            following a heavy or very heavy bleeding day.
          </li>
          <li>
            Hair shedding frequency increased markedly in the 60 days following the second heavy
            cycle (March).
          </li>
          <li>
            Pelvic pressure clusters in days 14–28 of each cycle, suggesting a relationship to
            fibroid activity rather than menstruation alone.
          </li>
        </ol>
      </div>

      {/* 6. LAB RESULTS */}
      <div style={{ marginBottom: 28 }}>
        <span style={sectionLabel}>Lab Results</span>
        <div style={tableWrap}>
          <table style={table}>
            <thead>
              <tr>
                {['Date', 'Test', 'Value', 'Range'].map(h => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={td}>12 Jan 2026</td>
                <td style={td}>Haemoglobin</td>
                <td style={tdRed}>11.2 g/dL ↓</td>
                <td style={td}>12.0–16.0</td>
              </tr>
              <tr>
                <td style={td}>12 Jan 2026</td>
                <td style={td}>Ferritin</td>
                <td style={tdRed}>18 ng/mL ↓</td>
                <td style={td}>30–200</td>
              </tr>
              {isFull && (
                <tr>
                  <td style={td}>12 Jan 2026</td>
                  <td style={td}>TSH</td>
                  <td style={td}>2.4 mIU/L</td>
                  <td style={td}>0.4–4.0</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. IN THE PATIENT'S OWN WORDS — only if thoughts included */}
      {includeThoughts && (
        <div style={{ marginBottom: 28 }}>
          <span style={sectionLabel}>In the Patient's Own Words</span>
          <p style={{ fontFamily: 'sans-serif', fontSize: 11, color: '#888', marginBottom: 16 }}>
            Selected journal entries, included with patient consent.
          </p>
          {[
            {
              date: '8 March 2026',
              text: 'Bleeding is getting heavier each cycle. Worried it\'s affecting my work. I had to leave a meeting yesterday because I felt like I was going to faint.',
            },
            ...(isFull
              ? [{
                  date: '22 April 2026',
                  text: 'My hair is coming out in clumps in the shower. It\'s not just shedding — it\'s noticeably thinner. I want to know if this is linked to the iron or to something else.',
                }]
              : []),
          ].map(q => (
            <div
              key={q.date}
              style={{ borderLeft: `2px solid ${PLUM}`, paddingLeft: 12, marginBottom: 16 }}
            >
              <div
                style={{
                  fontFamily: 'sans-serif',
                  fontSize: 11,
                  fontWeight: 500,
                  color: PLUM,
                  marginBottom: 4,
                }}
              >
                {q.date}
              </div>
              <div style={{ fontStyle: 'italic', fontSize: 14, lineHeight: 1.7 }}>{q.text}</div>
            </div>
          ))}
        </div>
      )}

      {/* 8. APPOINTMENT HISTORY — full report only */}
      {isFull && (
        <div style={{ marginBottom: 28 }}>
          <span style={sectionLabel}>Appointment History</span>
          <div style={tableWrap}>
            <table style={table}>
              <thead>
                <tr>
                  {['Date', 'Provider', 'Specialty', 'Outcome'].map(h => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={td}>12 Dec 2025</td>
                  <td style={td}>Dr Wanjiru Osei</td>
                  <td style={td}>Gynaecology</td>
                  <td style={td}>Pelvic ultrasound ordered</td>
                </tr>
                <tr>
                  <td style={td}>12 Jan 2026</td>
                  <td style={td}>Dr P Mwangi</td>
                  <td style={td}>General Practice</td>
                  <td style={td}>Bloodwork ordered, iron supplementation recommended</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div style={{ borderTop: '0.5px solid #ccc', paddingTop: 16, marginTop: 36 }}>
        <div style={{ fontFamily: 'sans-serif', fontSize: 10, color: '#888', lineHeight: 1.5 }}>
          <div style={{ marginBottom: 4 }}>
            <span style={{ color: PLUM, fontWeight: 500 }}>KWI Within</span>
            {' '}— Generated {format(new Date(), 'd MMMM yyyy')}
          </div>
          <div style={{ fontStyle: 'italic' }}>
            This report was generated from patient-logged data using KWI Within. KWI Within is a
            personal health data platform and does not provide medical advice, diagnosis, or
            treatment. The information contained in this report is for informational purposes only
            and should not be relied upon as a substitute for professional medical judgement. The
            patient has reviewed and approved its contents prior to sharing.
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ──

const DoctorReport = () => {
  const [reportLength, setReportLength] = useState<'full' | 'short'>('full');
  const [dateRange, setDateRange] = useState<'30d' | '3m' | '6m' | 'custom'>('3m');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [forAppointment, setForAppointment] = useState(false);
  const [selectedApptId, setSelectedApptId] = useState('');
  const [whatToDiscuss, setWhatToDiscuss] = useState('');
  const [includes, setIncludes] = useState<Record<string, boolean>>(
    Object.fromEntries(INCLUDE_ITEMS.map(i => [i.key, i.defaultOn]))
  );
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewReadOnly, setPreviewReadOnly] = useState(false);
  const [viewingReport, setViewingReport] = useState<PastReport | null>(null);

  const upcomingAppointments = placeholderAppointments;
  const pastReports = placeholderPastReports;

  const handleAppointmentChange = (id: string) => {
    setSelectedApptId(id);
    if (id) {
      const appt = upcomingAppointments.find(a => a.id === id);
      if (appt?.what_to_discuss) setWhatToDiscuss(appt.what_to_discuss);
    }
  };

  const handleGenerate = () => {
    setViewingReport(null);
    setPreviewReadOnly(false);
    setPreviewOpen(true);
  };

  const handleViewPast = (report: PastReport) => {
    setViewingReport(report);
    setPreviewReadOnly(true);
    setPreviewOpen(true);
  };

  const toggleInclude = (key: string) =>
    setIncludes(prev => ({ ...prev, [key]: !prev[key] }));

  const previewReportLength =
    previewReadOnly && viewingReport ? viewingReport.report_length : reportLength;
  const previewIncludeThoughts =
    previewReadOnly && viewingReport ? viewingReport.include_thoughts : includes.thoughts;

  return (
    <div className="space-y-8 pb-4">

      {/* ── SECTION 1: CONFIGURE ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold">For your doctor</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Generate a report from your data</p>
        </div>

        {/* A) Report length */}
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <p className="text-sm font-semibold">Report length</p>
          <div className="flex gap-2">
            {(['full', 'short'] as const).map(opt => (
              <button
                key={opt}
                onClick={() => setReportLength(opt)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  reportLength === opt
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {opt === 'full' ? 'Full report' : 'Short report'}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Full report covers everything in detail. Short report is a one-page summary of key
            findings.
          </p>
        </div>

        {/* B) Date range */}
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <p className="text-sm font-semibold">Date range</p>
          <div className="flex flex-wrap gap-2">
            {DATE_RANGE_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => setDateRange(opt.key)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  dateRange === opt.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {dateRange === 'custom' && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">From</label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={e => setCustomFrom(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">To</label>
                <input
                  type="date"
                  value={customTo}
                  onChange={e => setCustomTo(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          )}
        </div>

        {/* C) Appointment context — only if upcoming appointments exist */}
        {upcomingAppointments.length > 0 && (
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <p className="text-sm font-semibold">Generating this for an appointment?</p>
            <div className="flex gap-2">
              {[
                { val: false, label: 'No' },
                { val: true,  label: 'Yes' },
              ].map(opt => (
                <button
                  key={String(opt.val)}
                  onClick={() => setForAppointment(opt.val)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    forAppointment === opt.val
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {forAppointment && (
              <select
                value={selectedApptId}
                onChange={e => handleAppointmentChange(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select an appointment…</option>
                {upcomingAppointments.map(a => (
                  <option key={a.id} value={a.id}>
                    Dr {a.doctor}, {a.specialty} — {format(new Date(a.date), 'd MMM yyyy')}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* D) What you want to discuss */}
        <div className="rounded-lg border bg-card p-4 space-y-2">
          <p className="text-sm font-semibold">What you want to discuss</p>
          <Textarea
            value={whatToDiscuss}
            onChange={e => setWhatToDiscuss(e.target.value)}
            placeholder="Questions, concerns, things you want to raise..."
            className="resize-none text-sm min-h-[120px]"
          />
        </div>

        {/* E) What to include */}
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <p className="text-sm font-semibold">What to include</p>
          <div className="space-y-4">
            {INCLUDE_ITEMS.map(item => (
              <div key={item.key}>
                <div className="flex items-center justify-between">
                  <label htmlFor={`include-${item.key}`} className="text-sm cursor-pointer">
                    {item.label}
                  </label>
                  <Switch
                    id={`include-${item.key}`}
                    checked={includes[item.key]}
                    onCheckedChange={() => toggleInclude(item.key)}
                  />
                </div>
                {item.helper && (
                  <p className="text-xs text-muted-foreground mt-1 pr-12">{item.helper}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* F) Generate button */}
        <Button className="w-full" size="lg" onClick={handleGenerate}>
          Generate report
        </Button>
      </section>

      {/* ── SECTION 2: PAST REPORTS ── */}
      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-bold">Past reports</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Reports you've generated before</p>
        </div>

        {pastReports.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No reports yet. Generate your first one above.
          </p>
        ) : (
          <div className="space-y-3">
            {pastReports.map(report => (
              <div key={report.id} className="rounded-lg border bg-card p-4 space-y-2">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">
                    Generated {format(new Date(report.generated_at), 'd MMMM yyyy')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(report.period_start), 'd MMMM yyyy')}
                    {' '}–{' '}
                    {format(new Date(report.period_end), 'd MMMM yyyy')}
                  </p>
                  {report.appointment && (
                    <p className="text-xs text-muted-foreground">
                      For: Dr {report.appointment.doctor}, {report.appointment.specialty}
                      {' '}— {format(new Date(report.appointment.date), 'd MMMM yyyy')}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleViewPast(report)}
                    className="text-xs border rounded-full px-3 py-1 hover:bg-muted transition-colors text-muted-foreground"
                  >
                    View
                  </button>
                  <button
                    onClick={() => toast('Coming soon.')}
                    className="text-xs border rounded-full px-3 py-1 hover:bg-muted transition-colors text-muted-foreground"
                  >
                    Re-download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── PREVIEW OVERLAY ── */}
      <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
        <SheetContent side="bottom" className="h-[100dvh] flex flex-col gap-0 p-0">
          <SheetTitle className="sr-only">Report preview</SheetTitle>

          {/* Top bar */}
          <div className="relative flex items-center px-4 py-3 border-b shrink-0">
            <button
              onClick={() => setPreviewOpen(false)}
              className="absolute left-4 rounded-full p-1.5 hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
            <span className="text-sm font-semibold mx-auto">Report preview</span>
            {!previewReadOnly ? (
              <button
                onClick={() => setPreviewOpen(false)}
                className="absolute right-4 text-sm font-medium text-primary"
              >
                Edit
              </button>
            ) : (
              <div className="absolute right-4 w-10" />
            )}
          </div>

          {/* Scrollable report */}
          <div className="flex-1 overflow-y-auto bg-zinc-100">
            <ReportContent
              reportLength={previewReportLength}
              includeThoughts={previewIncludeThoughts}
            />
          </div>

          {/* Fixed bottom actions */}
          <div className="px-4 pb-8 pt-3 border-t shrink-0 space-y-2">
            <Button className="w-full" onClick={() => toast('Coming soon.')}>
              Download as PDF
            </Button>
            <Button variant="outline" className="w-full" onClick={() => toast('Coming soon.')}>
              Email to myself
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default DoctorReport;
