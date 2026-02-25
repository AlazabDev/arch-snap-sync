export type FileType = 'image' | 'video' | 'audio' | 'pdf';
export type ProjectStatus = 'active' | 'completed' | 'archived';
export type UserRole = 'admin' | 'architect' | 'consultant' | 'contractor' | 'client';

export interface ProjectFile {
  id: string;
  name: string;
  type: FileType;
  size: number;
  url: string;
  thumbnail?: string;
  uploadedAt: string;
  sender: string;
  senderRole: UserRole;
  projectId: string;
  duration?: number; // seconds for video/audio
  pages?: number; // for PDF
  width?: number;
  height?: number;
  comments: { author: string; text: string; date: string }[];
}

export interface Project {
  id: string;
  name: string;
  number: string;
  client: string;
  location: string;
  startDate: string;
  status: ProjectStatus;
  thumbnail: string;
  lastActivity: string;
  filesCount: { images: number; videos: number; audio: number; pdf: number };
  totalSize: number;
  engineers: string[];
}

export const projects: Project[] = [
  {
    id: '1',
    name: 'برج الواحة السكني',
    number: 'PRJ-2024-001',
    client: 'شركة الواحة للتطوير العقاري',
    location: 'الرياض - حي الملقا',
    startDate: '2024-01-15',
    status: 'active',
    thumbnail: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&h=300&fit=crop',
    lastActivity: '2025-02-24',
    filesCount: { images: 145, videos: 23, audio: 67, pdf: 34 },
    totalSize: 4.2 * 1024 * 1024 * 1024,
    engineers: ['م. أحمد الراشد', 'م. سارة العمري'],
  },
  {
    id: '2',
    name: 'مجمع النخيل التجاري',
    number: 'PRJ-2024-002',
    client: 'مؤسسة النخيل الاستثمارية',
    location: 'جدة - كورنيش الحمراء',
    startDate: '2024-03-01',
    status: 'active',
    thumbnail: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=400&h=300&fit=crop',
    lastActivity: '2025-02-23',
    filesCount: { images: 89, videos: 12, audio: 45, pdf: 21 },
    totalSize: 2.8 * 1024 * 1024 * 1024,
    engineers: ['م. خالد المطيري', 'م. نورة الدوسري'],
  },
  {
    id: '3',
    name: 'فيلا الأندلس',
    number: 'PRJ-2024-003',
    client: 'عبدالله بن سعيد',
    location: 'الدمام - حي الفيصلية',
    startDate: '2024-05-10',
    status: 'active',
    thumbnail: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop',
    lastActivity: '2025-02-22',
    filesCount: { images: 210, videos: 35, audio: 90, pdf: 55 },
    totalSize: 6.1 * 1024 * 1024 * 1024,
    engineers: ['م. أحمد الراشد'],
  },
  {
    id: '4',
    name: 'مستشفى الشفاء',
    number: 'PRJ-2023-015',
    client: 'وزارة الصحة',
    location: 'المدينة المنورة',
    startDate: '2023-08-20',
    status: 'completed',
    thumbnail: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=400&h=300&fit=crop',
    lastActivity: '2024-12-15',
    filesCount: { images: 320, videos: 55, audio: 120, pdf: 88 },
    totalSize: 9.3 * 1024 * 1024 * 1024,
    engineers: ['م. سارة العمري', 'م. فهد القحطاني'],
  },
  {
    id: '5',
    name: 'مسجد النور',
    number: 'PRJ-2023-008',
    client: 'جمعية البناء الخيرية',
    location: 'مكة المكرمة',
    startDate: '2023-03-01',
    status: 'archived',
    thumbnail: 'https://images.unsplash.com/photo-1585129777188-94600bc7b4b3?w=400&h=300&fit=crop',
    lastActivity: '2024-06-30',
    filesCount: { images: 180, videos: 28, audio: 55, pdf: 40 },
    totalSize: 3.5 * 1024 * 1024 * 1024,
    engineers: ['م. خالد المطيري'],
  },
  {
    id: '6',
    name: 'منتجع البحر الأحمر',
    number: 'PRJ-2024-010',
    client: 'شركة السياحة الوطنية',
    location: 'ينبع - الشاطئ الشمالي',
    startDate: '2024-07-01',
    status: 'active',
    thumbnail: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=400&h=300&fit=crop',
    lastActivity: '2025-02-25',
    filesCount: { images: 67, videos: 8, audio: 22, pdf: 15 },
    totalSize: 1.5 * 1024 * 1024 * 1024,
    engineers: ['م. نورة الدوسري', 'م. فهد القحطاني'],
  },
];

export const projectFiles: ProjectFile[] = [
  // Project 1 files
  {
    id: 'f1', name: 'واجهة المبنى الرئيسية.jpg', type: 'image', size: 3.2 * 1024 * 1024,
    url: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200',
    thumbnail: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&h=300&fit=crop',
    uploadedAt: '2025-02-24T10:30:00', sender: 'م. أحمد الراشد', senderRole: 'architect',
    projectId: '1', width: 4000, height: 3000, comments: [
      { author: 'م. سارة العمري', text: 'الواجهة تحتاج تعديل في الزوايا العلوية', date: '2025-02-24T11:00:00' }
    ],
  },
  {
    id: 'f2', name: 'تقدم الأعمال - الطابق الثالث.mp4', type: 'video', size: 45 * 1024 * 1024,
    url: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop',
    uploadedAt: '2025-02-23T14:20:00', sender: 'م. خالد المقاول', senderRole: 'contractor',
    projectId: '1', duration: 180, comments: [],
  },
  {
    id: 'f3', name: 'ملاحظات المهندس المشرف.ogg', type: 'audio', size: 1.5 * 1024 * 1024,
    url: '', thumbnail: undefined,
    uploadedAt: '2025-02-22T09:15:00', sender: 'م. أحمد الراشد', senderRole: 'architect',
    projectId: '1', duration: 95, comments: [],
  },
  {
    id: 'f4', name: 'المخطط التنفيذي المحدث.pdf', type: 'pdf', size: 8.5 * 1024 * 1024,
    url: '', thumbnail: undefined,
    uploadedAt: '2025-02-21T16:00:00', sender: 'م. سارة العمري', senderRole: 'architect',
    projectId: '1', pages: 24, comments: [
      { author: 'م. أحمد الراشد', text: 'تمت المراجعة والموافقة', date: '2025-02-21T17:30:00' }
    ],
  },
  {
    id: 'f5', name: 'صور الموقع - المرحلة الثانية.jpg', type: 'image', size: 2.8 * 1024 * 1024,
    url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200',
    thumbnail: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop',
    uploadedAt: '2025-02-20T11:45:00', sender: 'م. خالد المقاول', senderRole: 'contractor',
    projectId: '1', width: 3500, height: 2625, comments: [],
  },
  {
    id: 'f6', name: 'الهيكل الخرساني.jpg', type: 'image', size: 4.1 * 1024 * 1024,
    url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1200',
    thumbnail: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&h=300&fit=crop',
    uploadedAt: '2025-02-19T08:30:00', sender: 'م. أحمد الراشد', senderRole: 'architect',
    projectId: '1', width: 4200, height: 2800, comments: [],
  },
  {
    id: 'f7', name: 'تقرير التفتيش.pdf', type: 'pdf', size: 5.2 * 1024 * 1024,
    url: '', thumbnail: undefined,
    uploadedAt: '2025-02-18T15:00:00', sender: 'م. سارة العمري', senderRole: 'architect',
    projectId: '1', pages: 12, comments: [],
  },
  {
    id: 'f8', name: 'ملاحظات العميل.ogg', type: 'audio', size: 2.1 * 1024 * 1024,
    url: '', thumbnail: undefined,
    uploadedAt: '2025-02-17T10:00:00', sender: 'شركة الواحة', senderRole: 'client',
    projectId: '1', duration: 140, comments: [],
  },
  // Project 2 files
  {
    id: 'f9', name: 'تصميم الواجهة الزجاجية.jpg', type: 'image', size: 5.5 * 1024 * 1024,
    url: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1200',
    thumbnail: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=400&h=300&fit=crop',
    uploadedAt: '2025-02-23T09:00:00', sender: 'م. خالد المطيري', senderRole: 'architect',
    projectId: '2', width: 5000, height: 3333, comments: [],
  },
  {
    id: 'f10', name: 'جولة في الموقع.mp4', type: 'video', size: 120 * 1024 * 1024,
    url: '', thumbnail: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400&h=300&fit=crop',
    uploadedAt: '2025-02-22T13:00:00', sender: 'م. نورة الدوسري', senderRole: 'architect',
    projectId: '2', duration: 420, comments: [],
  },
];

export const stats = {
  activeProjects: projects.filter(p => p.status === 'active').length,
  totalFiles: projects.reduce((sum, p) => sum + p.filesCount.images + p.filesCount.videos + p.filesCount.audio + p.filesCount.pdf, 0),
  totalStorage: projects.reduce((sum, p) => sum + p.totalSize, 0),
  activeConversations: 12,
};

export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} جيجا`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} ميجا`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} كيلو`;
  return `${bytes} بايت`;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function getStatusLabel(status: ProjectStatus): string {
  const labels: Record<ProjectStatus, string> = { active: 'نشط', completed: 'مكتمل', archived: 'مؤرشف' };
  return labels[status];
}

export function getStatusClass(status: ProjectStatus): string {
  const classes: Record<ProjectStatus, string> = { active: 'badge-active', completed: 'badge-completed', archived: 'badge-archived' };
  return classes[status];
}

export function getFileTypeLabel(type: FileType): string {
  const labels: Record<FileType, string> = { image: 'صورة', video: 'فيديو', audio: 'صوتي', pdf: 'مستند' };
  return labels[type];
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = { admin: 'مدير النظام', architect: 'مهندس معماري', consultant: 'استشاري', contractor: 'مقاول', client: 'عميل' };
  return labels[role];
}
