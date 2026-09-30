import {
  CalendarHeart,
  FileHeart,
  LayoutDashboard,
  LogOut,
  UserRound,
} from 'lucide-react';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'records', label: 'Health Records', icon: FileHeart },
  { id: 'cycle', label: 'Cycle Tracker', icon: CalendarHeart },
  { id: 'profile', label: 'Profile', icon: UserRound },
];

function Navigation({
  activeTab,
  onTabChange,
  onLogout,
  user,
  isMobileOpen,
  onMobileClose,
}) {
  const handleTabChange = (tabId) => {
    onTabChange(tabId);
    onMobileClose?.();
  };

  return (
    <>
      {isMobileOpen && (
        <button
          type="button"
          className="lg:hidden fixed inset-0 bg-slate-950/30 backdrop-blur-[2px] z-40"
          onClick={onMobileClose}
          aria-label="Close menu"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 h-full w-[280px] border-r border-white/70 bg-white/90 backdrop-blur-xl shadow-[0_0_40px_rgba(148,163,184,0.14)] transition-transform duration-300 lg:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex h-full flex-col p-6">
          <div className="flex items-center gap-3 px-2">
            <div className="brand-mark">
              <span>♡</span>
            </div>
            <div>
              <p className="text-xl font-extrabold tracking-tight text-gradient">MedVault</p>
              <p className="text-xs font-medium text-slate-400">Women's health companion</p>
            </div>
          </div>

          <div className="mt-10">
            <p className="nav-section-title">Your space</p>
            <nav className="mt-3 space-y-1.5">
              {menuItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => handleTabChange(id)}
                  className={`nav-link w-full ${activeTab === id ? 'nav-link-active' : ''}`}
                >
                  <Icon size={19} strokeWidth={2.1} />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-auto">
            <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4">
              <div className="flex items-center gap-3">
                <div className="avatar avatar-gradient">
                  {user?.objectData?.Name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-800">
                    {user?.objectData?.Name || 'User'}
                  </p>
                  <p className="truncate text-xs text-slate-400">
                    {user?.objectData?.Email || ''}
                  </p>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
              >
                <LogOut size={17} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Navigation;
