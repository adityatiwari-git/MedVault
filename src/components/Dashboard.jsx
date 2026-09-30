import { useEffect, useState } from 'react';
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  FileHeart,
  HeartPulse,
  Pill,
  Plus,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';
import {
  getUserCycles,
  getUserDocuments,
  getUserPrescriptions,
} from '../services/storage.js';

function getProfileCompletion(data = {}) {
  const fields = [
    data.Name,
    data.Age,
    data.HeightCm,
    data.WeightKg,
    data.BloodGroup,
    data.Allergies,
    data.MedicalConditions,
    data.CurrentMedications,
    data.EmergencyContactName,
    data.EmergencyContactPhone,
  ];

  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function Dashboard({ user, onNavigate }) {
  const [data, setData] = useState({
    documents: [],
    prescriptions: [],
    cycles: [],
    loading: true,
  });

  useEffect(() => {
    let mounted = true;

    Promise.all([
      getUserDocuments(user.objectId, 8),
      getUserPrescriptions(user.objectId, 8),
      getUserCycles(user.objectId, 6),
    ])
      .then(([documents, prescriptions, cycles]) => {
        if (mounted) {
          setData({ documents, prescriptions, cycles, loading: false });
        }
      })
      .catch((error) => {
        console.error('Dashboard loading error:', error);
        if (mounted) setData((current) => ({ ...current, loading: false }));
      });

    return () => {
      mounted = false;
    };
  }, [user.objectId]);

  if (data.loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-36 rounded-3xl bg-white/70" />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-36 rounded-3xl bg-white/70" />
          ))}
        </div>
      </div>
    );
  }

  const activeReminders = data.prescriptions.filter(
    (item) => item.objectData.ReminderEnabled,
  );
  const latestCycle = data.cycles[0];
  const lastPeriod = latestCycle?.objectData?.PeriodStartDate;
  const daysSincePeriod = lastPeriod
    ? Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(lastPeriod).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : null;

  const profileCompletion = getProfileCompletion(user.objectData);

  const stats = [
    {
      label: 'Health records',
      value: data.documents.length,
      helper: 'Saved documents',
      icon: FileHeart,
      tone: 'blue',
    },
    {
      label: 'Cycle logs',
      value: data.cycles.length,
      helper: 'Entries recorded',
      icon: CalendarDays,
      tone: 'pink',
    },
    {
      label: 'Active medicines',
      value: data.prescriptions.length,
      helper: 'Prescription records',
      icon: Pill,
      tone: 'green',
    },
    {
      label: 'Profile',
      value: profileCompletion + '%',
      helper: 'Information complete',
      icon: UserRound,
      tone: 'purple',
    },
  ];

  return (
    <div className="space-y-7">
      <section className="hero-panel">
        <div className="relative z-10 max-w-3xl">
          <div className="eyebrow">Your daily health overview</div>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
            Welcome back, {user.objectData.Name?.split(' ')[0] || 'there'}.
            <span className="ml-2">🌸</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
            Keep your records, medicines, cycle history, and personal health details
            organized in one private space.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={() => onNavigate('records')} className="btn btn-primary">
              <Plus size={18} />
              Add health record
            </button>
            <button onClick={() => onNavigate('cycle')} className="btn btn-light">
              <CalendarDays size={18} />
              Log period
            </button>
          </div>
        </div>

        <div className="hero-decoration">
          <HeartPulse size={110} strokeWidth={1.2} />
        </div>

        <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-emerald-700">
          <ShieldCheck size={18} />
          <span>Your data is connected to your MedVault account.</span>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, helper, icon: Icon, tone }) => (
          <div key={label} className={'stat-panel stat-' + tone}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
                <p className="mt-1 text-xs text-slate-400">{helper}</p>
              </div>
              <div className={'stat-icon stat-icon-' + tone}>
                <Icon size={22} />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.35fr_0.9fr]">
        <div className="surface-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">Health records</p>
              <h2 className="section-title">Recent uploads</h2>
            </div>
            <button className="link-button" onClick={() => onNavigate('records')}>
              View all
              <ChevronRight size={17} />
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {data.documents.length === 0 ? (
              <div className="empty-state">
                <FileHeart size={34} />
                <p className="font-semibold text-slate-700">No health records yet</p>
                <p className="text-sm text-slate-400">
                  Save your first report, prescription, or scan.
                </p>
                <button className="btn btn-light mt-2" onClick={() => onNavigate('records')}>
                  Upload a document
                </button>
              </div>
            ) : (
              data.documents.slice(0, 4).map((document) => (
                <div key={document.objectId} className="list-row">
                  <div className="list-icon">
                    <FileHeart size={19} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-800">
                      {document.objectData.FileName}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs">
                      <span className="tag tag-purple">{document.objectData.Category}</span>
                      <span className="text-slate-400">
                        {formatDate(document.objectData.DateUploaded)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={17} className="text-slate-300" />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="surface-card">
          <div>
            <p className="eyebrow">Medication</p>
            <h2 className="section-title">Active reminders</h2>
          </div>

          <div className="mt-5 space-y-3">
            {activeReminders.length === 0 ? (
              <div className="empty-state compact">
                <Clock3 size={31} />
                <p className="font-semibold text-slate-700">No active reminders</p>
                <p className="text-sm text-slate-400">
                  Add a prescription from Health Records.
                </p>
              </div>
            ) : (
              activeReminders.slice(0, 4).map((item) => (
                <div key={item.objectId} className="medication-row">
                  <div className="medication-dot">
                    <Pill size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-800">
                      {item.objectData.MedicineName}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {item.objectData.Dosage || 'Dosage not added'} · {item.objectData.Frequency || 'Schedule not added'}
                    </p>
                  </div>
                  <Clock3 size={17} className="text-emerald-500" />
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="surface-card soft-purple">
          <p className="eyebrow">Cycle tracker</p>
          <h3 className="mt-2 text-xl font-extrabold text-slate-900">
            {lastPeriod ? daysSincePeriod + ' days since last log' : 'Start your cycle log'}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Keep period dates, symptoms, flow, and notes together for your own history.
          </p>
          <button className="link-button mt-5" onClick={() => onNavigate('cycle')}>
            Open cycle tracker <ChevronRight size={17} />
          </button>
        </div>

        <div className="surface-card soft-green">
          <p className="eyebrow">Quick action</p>
          <h3 className="mt-2 text-xl font-extrabold text-slate-900">
            Save a prescription
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Keep medicine name, dosage, dates, and notes available whenever you need them.
          </p>
          <button className="link-button mt-5" onClick={() => onNavigate('records')}>
            Manage prescriptions <ChevronRight size={17} />
          </button>
        </div>

        <div className="surface-card soft-blue">
          <p className="eyebrow">Profile</p>
          <h3 className="mt-2 text-xl font-extrabold text-slate-900">
            {profileCompletion}% complete
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Add body measurements, blood group, medical notes, and emergency contact details.
          </p>
          <button className="link-button mt-5" onClick={() => onNavigate('profile')}>
            Update profile <ChevronRight size={17} />
          </button>
        </div>
      </section>

      <section className="surface-card">
        <div className="flex items-center gap-3">
          <div className="section-icon">
            <Sparkles size={19} />
          </div>
          <div>
            <p className="eyebrow">MedVault now</p>
            <h2 className="text-xl font-extrabold text-slate-900">Your health space, organized.</h2>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            ['Records', 'Keep important reports and prescriptions together.'],
            ['Cycle', 'Maintain your period history with useful notes.'],
            ['Profile', 'Keep essential personal and emergency details updated.'],
          ].map(([title, text]) => (
            <div key={title} className="rounded-2xl bg-slate-50 p-4">
              <p className="font-bold text-slate-800">{title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
