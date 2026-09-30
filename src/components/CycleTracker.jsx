import { useEffect, useMemo, useState } from 'react';
import { CalendarHeart, ChevronRight, Droplets, Edit3, Plus, Trash2, X } from 'lucide-react';
import {
  createCycleEntry,
  deleteCycleEntry,
  getUserCycles,
  updateCycleEntry,
} from '../services/storage.js';

const symptomOptions = [
  'Cramps',
  'Headache',
  'Mood changes',
  'Bloating',
  'Fatigue',
  'Back pain',
  'Nausea',
  'Breast tenderness',
];

const flowOptions = ['Light', 'Medium', 'Heavy'];

function calculateAverageCycle(cycles) {
  const dates = cycles
    .map((item) => new Date(item.objectData.PeriodStartDate))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a - b);

  if (dates.length < 2) return null;

  let total = 0;
  let count = 0;

  for (let index = 1; index < dates.length; index += 1) {
    const days = Math.round(
      (dates[index].getTime() - dates[index - 1].getTime()) /
        (1000 * 60 * 60 * 24),
    );

    if (days > 0 && days < 120) {
      total += days;
      count += 1;
    }
  }

  return count ? Math.round(total / count) : null;
}

function CycleTracker({ user }) {
  const [cycles, setCycles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCycle, setEditingCycle] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    startDate: '',
    endDate: '',
    flowIntensity: 'Medium',
    symptoms: [],
    notes: '',
  });

  const loadCycles = async () => {
    setIsLoading(true);
    try {
      setCycles(await getUserCycles(user.objectId));
    } catch (err) {
      setError(err.message || 'Unable to load cycle history.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCycles();
  }, [user.objectId]);

  const averageCycle = useMemo(() => calculateAverageCycle(cycles), [cycles]);
  const latestCycle = cycles[0];
  const daysSinceLatest = latestCycle?.objectData?.PeriodStartDate
    ? Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(latestCycle.objectData.PeriodStartDate).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : null;

  const openNewForm = () => {
    setEditingCycle(null);
    setForm({
      startDate: '',
      endDate: '',
      flowIntensity: 'Medium',
      symptoms: [],
      notes: '',
    });
    setError('');
    setShowForm(true);
  };

  const openEditForm = (cycle) => {
    setEditingCycle(cycle);
    setForm({
      startDate: cycle.objectData.PeriodStartDate || '',
      endDate: cycle.objectData.PeriodEndDate || '',
      flowIntensity: cycle.objectData.FlowIntensity || 'Medium',
      symptoms: cycle.objectData.Symptoms || [],
      notes: cycle.objectData.Notes || '',
    });
    setError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingCycle(null);
  };

  const toggleSymptom = (symptom) => {
    setForm((current) => ({
      ...current,
      symptoms: current.symptoms.includes(symptom)
        ? current.symptoms.filter((item) => item !== symptom)
        : [...current.symptoms, symptom],
    }));
  };

  const saveCycle = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      if (!form.startDate) throw new Error('Please choose the period start date.');

      const payload = {
        periodStartDate: form.startDate,
        periodEndDate: form.endDate,
        flowIntensity: form.flowIntensity,
        symptoms: form.symptoms,
        notes: form.notes,
        aiPrediction: null,
      };

      if (editingCycle) {
        await updateCycleEntry(user.objectId, editingCycle.objectId, payload);
      } else {
        await createCycleEntry(user.objectId, payload);
      }

      closeForm();
      await loadCycles();
    } catch (err) {
      setError(err.message || 'Unable to save this cycle entry.');
    } finally {
      setIsSaving(false);
    }
  };

  const removeCycle = async (id) => {
    if (!window.confirm('Delete this cycle entry?')) return;

    try {
      await deleteCycleEntry(user.objectId, id);
      await loadCycles();
    } catch (err) {
      setError(err.message || 'Unable to delete this cycle entry.');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-32 rounded-3xl bg-white/70" />
        <div className="grid gap-5 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-28 rounded-3xl bg-white/70" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="page-header">
        <div>
          <p className="eyebrow">Women's wellness</p>
          <h1 className="page-title">Cycle Tracker</h1>
          <p className="page-subtitle">
            Keep a simple record of period dates, flow, symptoms, and notes.
          </p>
        </div>

        <button className="btn btn-primary" onClick={openNewForm}>
          <Plus size={18} />
          Log period
        </button>
      </section>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="grid gap-5 md:grid-cols-3">
        <div className="stat-panel stat-pink">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Period logs</p>
              <p className="mt-2 text-3xl font-black text-slate-900">{cycles.length}</p>
            </div>
            <div className="stat-icon stat-icon-pink"><CalendarHeart size={21} /></div>
          </div>
        </div>

        <div className="stat-panel stat-purple">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Average cycle</p>
              <p className="mt-2 text-3xl font-black text-slate-900">
                {averageCycle ? averageCycle + 'd' : '—'}
              </p>
            </div>
            <div className="stat-icon stat-icon-purple"><ChevronRight size={21} /></div>
          </div>
        </div>

        <div className="stat-panel stat-blue">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Latest start</p>
              <p className="mt-2 text-3xl font-black text-slate-900">
                {daysSinceLatest !== null ? daysSinceLatest + 'd ago' : '—'}
              </p>
            </div>
            <div className="stat-icon stat-icon-blue"><Droplets size={21} /></div>
          </div>
        </div>
      </section>

      <section className="surface-card">
        <div className="flex items-center gap-3">
          <div className="section-icon section-icon-pink">
            <CalendarHeart size={19} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Your cycle history</h2>
            <p className="text-sm text-slate-400">
              Your past entries stay connected to your account and can be edited later.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {cycles.map((cycle) => {
            const item = cycle.objectData;
            const length =
              item.PeriodStartDate && item.PeriodEndDate
                ? Math.max(
                    1,
                    Math.round(
                      (new Date(item.PeriodEndDate).getTime() -
                        new Date(item.PeriodStartDate).getTime()) /
                        (1000 * 60 * 60 * 24),
                    ) + 1,
                  )
                : null;

            return (
              <div key={cycle.objectId} className="cycle-row">
                <div className="cycle-date">
                  <span>{new Date(item.PeriodStartDate).toLocaleDateString('en-IN', { day: '2-digit' })}</span>
                  <small>{new Date(item.PeriodStartDate).toLocaleDateString('en-IN', { month: 'short' })}</small>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-slate-800">
                      {item.PeriodEndDate ? 'Period logged' : 'Period started'}
                    </p>
                    <span className="tag tag-pink">{item.FlowIntensity || 'Flow not added'}</span>
                    {length && <span className="tag tag-gray">{length} days</span>}
                  </div>

                  {item.Symptoms?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.Symptoms.map((symptom) => (
                        <span key={symptom} className="tag tag-gray">{symptom}</span>
                      ))}
                    </div>
                  )}

                  {item.Notes && (
                    <p className="mt-2 text-sm leading-6 text-slate-500">{item.Notes}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button className="icon-button" onClick={() => openEditForm(cycle)} aria-label="Edit">
                    <Edit3 size={16} />
                  </button>
                  <button className="icon-button danger-icon" onClick={() => removeCycle(cycle.objectId)} aria-label="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}

          {cycles.length === 0 && (
            <div className="empty-state">
              <CalendarHeart size={40} />
              <p className="font-bold text-slate-700">No cycle entries yet</p>
              <p className="text-sm text-slate-400">Log your first period to start building your history.</p>
              <button className="btn btn-primary mt-2" onClick={openNewForm}>
                <Plus size={18} />
                Log your first period
              </button>
            </div>
          )}
        </div>
      </section>

      {showForm && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <p className="eyebrow">{editingCycle ? 'Edit period' : 'New period entry'}</p>
                <h2 className="modal-title">{editingCycle ? 'Update cycle details' : 'Log your period'}</h2>
              </div>
              <button className="icon-button" onClick={closeForm} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={saveCycle} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="field-label">
                  Start date
                  <input
                    type="date"
                    className="input-control input-control-full mt-1"
                    value={form.startDate}
                    onChange={(event) => setForm({ ...form, startDate: event.target.value })}
                    required
                  />
                </label>
                <label className="field-label">
                  End date
                  <input
                    type="date"
                    className="input-control input-control-full mt-1"
                    value={form.endDate}
                    onChange={(event) => setForm({ ...form, endDate: event.target.value })}
                  />
                </label>
              </div>

              <label className="field-label">
                Flow
                <select
                  className="input-control input-control-full mt-1"
                  value={form.flowIntensity}
                  onChange={(event) => setForm({ ...form, flowIntensity: event.target.value })}
                >
                  {flowOptions.map((flow) => <option key={flow}>{flow}</option>)}
                </select>
              </label>

              <div>
                <p className="field-label">Symptoms</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {symptomOptions.map((symptom) => (
                    <button
                      type="button"
                      key={symptom}
                      className={'symptom-chip ' + (form.symptoms.includes(symptom) ? 'symptom-chip-active' : '')}
                      onClick={() => toggleSymptom(symptom)}
                    >
                      {symptom}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                className="input-control input-control-full min-h-24 resize-none"
                placeholder="Notes"
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
              />

              <div className="flex gap-3">
                <button type="button" className="btn btn-light flex-1" onClick={closeForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CycleTracker;
