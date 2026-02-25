import { Building2, FolderOpen, LayoutDashboard, Bell, BarChart3, Settings, FileText, MessageSquare } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';

const navItems = [
  { label: 'لوحة التحكم', icon: LayoutDashboard, path: '/' },
  { label: 'المشاريع', icon: Building2, path: '/projects' },
  { label: 'جميع الملفات', icon: FolderOpen, path: '/files' },
  { label: 'المحادثات', icon: MessageSquare, path: '/conversations' },
  { label: 'الدفترة', icon: FileText, path: '/accounting' },
  { label: 'التقارير', icon: BarChart3, path: '/reports' },
  { label: 'الإشعارات', icon: Bell, path: '/notifications' },
  { label: 'الإعدادات', icon: Settings, path: '/settings' },
];

export default function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="fixed top-0 right-0 h-screen w-64 flex flex-col z-40" style={{ background: 'var(--gradient-sidebar)' }}>
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <Building2 className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">أرشيف المعمار</h1>
            <p className="text-xs text-sidebar-foreground/50">إدارة ملفات المشاريع</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-sidebar-accent flex items-center justify-center text-sm font-bold text-sidebar-primary">
            أ
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">م. أحمد الراشد</p>
            <p className="text-xs text-sidebar-foreground/50">مهندس معماري</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
