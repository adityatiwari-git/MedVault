import { useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  CalendarDays,
  Check,
  Edit3,
  HeartPulse,
  Mail,
  Save,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';
import { getUserDocuments, getUserCycles, getUserPrescriptions } from '../services/storage.js';
import { updateUserProfile } from '../services/auth.js';

const emptyForm = {
  name: '',
  email: '',
  age: '',
  gender: 'female',
  heightCm: '',
  weightKg: '',
  bloodGroup: '',
  allergies: '',
  medicalConditions: '',
  currentMedications: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
};

function Profile({ user, onUserUpdated }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    documents: 0,
    cycles: 0,
    prescriptions: 0,
  });
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    setForm({
      name: user.objectData.Name || '',
      email: user.objectData.Email || '',
      age: user.objectData.Age || '',
      gender: user.objectData.Gender || 'female',
      heightCm: user.objectData.HeightCm || '',
      weightKg: user.objectData.WeightKg || '',
      bloodGroup: user.objectData.BloodGroup || '',
      allergies: user.objectData.Allergies || '',
      medicalConditions: user.objectData.MedicalConditions || '',
      currentMedications: user.objectData.CurrentMedications || '',
      emergencyContactName: user.objectData.EmergencyContactName || '',
      emergencyContactPhone: user.objectData.EmergencyContactPhone || '',
    });
  }, [user]);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      getUserDocuments(user.objectId),
      getUserCycles(user.objectId),
      getUserPrescriptions(user.objectId),
    ])
      .then(([documents, cycles, prescriptions]) => {
        if (mounted) {
          setStats({
            documents: documents.length,
            cycles: cycles.length,
            prescriptions: prescriptions.length,
          });
        }
      })
      .catch((err) => {
        console.error('Profile stats error:', err);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [user.objectId]);

  const handleSave = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    setMessage('');

    try {
      const updatedProfile = await updateUserProfile(user.objectId, form);

      onUserUpdated({
        ...user,
        objectData: {
          ...user.objectData,
          Name: updatedProfile.name,
          Age: updatedProfile.age,
          Gender: updatedProfile.gender,
          HeightCm: updatedProfile.height_cm,
          WeightKg: updatedProfile.weight_kg,
          BloodGroup: updatedProfile.blood_group,
          Allergies: updatedProfile.allergies,
          MedicalConditions: updatedProfile.medical_conditions,
          CurrentMedications: updatedProfile.current_medications,
          EmergencyContactName: updatedProfile.emergency_contact_name,
          EmergencyContactPhone: updatedProfile.emergency_contact_phone,
        },
      });

      setIsEditing(false);
      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(err.message || 'Unable to update your profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-36 rounded-3xl bg-white/70" />
        <div className="h-80 rounded-3xl bg-white/70" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="page-header">
        <div>
          <p className="eyebrow">Your information</p>
          <h1 className="page-title">Your Profile</h1>
          <p className="page-subtitle">
            Keep the personal and health information you want close at hand.
          </p>
        </div>

        <button
          className={isEditing ? 'btn btn-light' : 'btn btn-primary'}
          onClick={() => {
            setIsEditing((current) => !current);
            setError('');
            setMessage('');
          }}
        >
          {isEditing ? <X size={18} /> : <Edit3 size={18} />}
          {isEditing ? 'Cancel editing' : 'Edit profile'}
        </button>
      </section>

      {message && (
        <div className="alert alert-success">
          <Check size={17} />
          {message}
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={17} />
          {error}
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-6">
          <ProfileSection title="Personal information" icon={<UserRound size={19} />}>
            <div className="grid gap-4 md:grid-cols-2">
              <ProfileInput
                label="Full name"
                value={form.name}
                onChange={(value) => setForm({ ...form, name: value })}
                required
              />
              <ProfileInput label="Email address" value={form.email} readOnly />
              <ProfileInput
                label="Age"
                type="number"
                min="1"
                max="120"
                value={form.age}
                onChange={(value) => setForm({ ...form, age: value })}
                required
              />
              <label className="field-label">
                Gender
                <select
                  className="input-control input-control-full mt-1"
                  value={form.gender}
                  onChange={(event) => setForm({ ...form, gender: event.target.value })}
                >
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </label>
            </div>
          </ProfileSection>

          <ProfileSection title="Body & health details" icon={<HeartPulse size={19} />}>
            <div className="grid gap-4 md:grid-cols-3">
              <ProfileInput
                label="Height (cm)"
                type="number"
                min="1"
                max="300"
                value={form.heightCm}
                onChange={(value) => setForm({ ...form, heightCm: value })}
              />
              <ProfileInput
                label="Weight (kg)"
                type="number"
                min="1"
                max="500"
                value={form.weightKg}
                onChange={(value) => setForm({ ...form, weightKg: value })}
              />
              <label className="field-label">
                Blood group
                <select
                  className="input-control input-control-full mt-1"
                  value={form.bloodGroup}
                  onChange={(event) => setForm({ ...form, bloodGroup: event.target.value })}
                >
                  <option value="">Not added</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((group) => (
                    <option key={group}>{group}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <ProfileTextarea
                label="Allergies"
                placeholder="Food, medicine, environmental, or other allergies"
                value={form.allergies}
                onChange={(value) => setForm({ ...form, allergies: value })}
              />
              <ProfileTextarea
                label="Medical conditions"
                placeholder="Conditions you want recorded"
                value={form.medicalConditions}
                onChange={(value) => setForm({ ...form, medicalConditions: value })}
              />
              <ProfileTextarea
                label="Current medications"
                placeholder="Medicines you are currently taking"
                value={form.currentMedications}
                onChange={(value) => setForm({ ...form, currentMedications: value })}
              />
            </div>
          </ProfileSection>

          <ProfileSection title="Emergency contact" icon={<AlertCircle size={19} />}>
            <div className="grid gap-4 md:grid-cols-2">
              <ProfileInput
                label="Contact name"
                value={form.emergencyContactName}
                onChange={(value) => setForm({ ...form, emergencyContactName: value })}
              />
              <ProfileInput
                label="Contact phone"
                type="tel"
                value={form.emergencyContactPhone}
                onChange={(value) => setForm({ ...form, emergencyContactPhone: value })}
              />
            </div>
          </ProfileSection>

          <div className="flex justify-end">
            <button className="btn btn-primary" type="submit" disabled={isSaving}>
              <Save size={18} />
              {isSaving ? 'Saving...' : 'Save profile'}
            </button>
          </div>
        </form>
      ) : (
        <>
          <section className="profile-hero">
            <div className="avatar avatar-large avatar-gradient">
              {user.objectData.Name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl font-black text-slate-900">
                {user.objectData.Name || 'Your profile'}
              </h2>
              <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                <Mail size={15} />
                {user.objectData.Email}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="tag tag-purple">Women-focused space</span>
                <span className="tag tag-green"><ShieldCheck size={13} /> Account connected</span>
              </div>
            </div>
          </section>

          <section className="grid gap-5 md:grid-cols-3">
            <ProfileStat label="Health records" value={stats.documents} icon={<FileIcon />} />
            <ProfileStat label="Cycle entries" value={stats.cycles} icon={<CalendarDays size={20} />} />
            <ProfileStat label="Prescriptions" value={stats.prescriptions} icon={<PillIcon />} />
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <ProfileSection title="Personal information" icon={<UserRound size={19} />}>
              <InfoGrid
                items={[
                  ['Full name', user.objectData.Name || 'Not added'],
                  ['Email', user.objectData.Email || 'Not added'],
                  ['Age', user.objectData.Age ? user.objectData.Age + ' years' : 'Not added'],
                  ['Gender', user.objectData.Gender || 'Not added'],
                ]}
              />
            </ProfileSection>

            <ProfileSection title="Body & health details" icon={<HeartPulse size={19} />}>
              <InfoGrid
                items={[
                  ['Height', user.objectData.HeightCm ? user.objectData.HeightCm + ' cm' : 'Not added'],
                  ['Weight', user.objectData.WeightKg ? user.objectData.WeightKg + ' kg' : 'Not added'],
                  ['Blood group', user.objectData.BloodGroup || 'Not added'],
                  ['Current medicines', user.objectData.CurrentMedications || 'Not added'],
                ]}
              />
              <div className="mt-4 grid gap-3">
                <InfoBlock label="Allergies" value={user.objectData.Allergies} />
                <InfoBlock label="Medical conditions" value={user.objectData.MedicalConditions} />
              </div>
            </ProfileSection>

            <ProfileSection title="Emergency contact" icon={<AlertCircle size={19} />}>
              <InfoGrid
                items={[
                  ['Name', user.objectData.EmergencyContactName || 'Not added'],
                  ['Phone', user.objectData.EmergencyContactPhone || 'Not added'],
                ]}
              />
            </ProfileSection>
          </section>
        </>
      )}
    </div>
  );
}

function ProfileSection({ title, icon, children }) {
  return (
    <section className="surface-card">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="section-icon">{icon}</div>
        <h2 className="text-lg font-extrabold text-slate-900">{title}</h2>
      </div>
      <div className="pt-5">{children}</div>
    </section>
  );
}

function ProfileInput({ label, value, onChange, type = 'text', readOnly = false, min, max, required = false }) {
  return (
    <label className="field-label">
      {label}
      <input
        type={type}
        className={'input-control input-control-full mt-1' + (readOnly ? ' bg-slate-50' : '')}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        readOnly={readOnly}
        min={min}
        max={max}
        required={required}
      />
    </label>
  );
}

function ProfileTextarea({ label, placeholder, value, onChange }) {
  return (
    <label className="field-label">
      {label}
      <textarea
        className="input-control input-control-full mt-1 min-h-28 resize-none"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function InfoGrid({ items }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">{label}</p>
          <p className="mt-1 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">{value || 'Not added'}</p>
        </div>
      ))}
    </div>
  );
}

function InfoBlock({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">
        {value || 'Not added'}
      </p>
    </div>
  );
}

function ProfileStat({ label, value, icon }) {
  return (
    <div className="surface-card flex items-center gap-4">
      <div className="stat-icon stat-icon-purple">{icon}</div>
      <div>
        <p className="text-2xl font-black text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function FileIcon() {
  return <Activity size={20} />;
}

function PillIcon() {
  return <HeartPulse size={20} />;
}

export default Profile;
