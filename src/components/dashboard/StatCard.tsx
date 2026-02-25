import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: 'accent' | 'primary' | 'success' | 'info';
}

const colorMap = {
  accent: 'bg-accent/15 text-accent',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/15 text-success',
  info: 'bg-info/15 text-info',
};

export default function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
