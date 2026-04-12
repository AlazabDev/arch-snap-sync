import { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Smile,
  Mic,
  Image as ImageIcon,
  FileText,
  Video,
  X,
  MoreVertical,
  Phone,
  Search,
  Check,
  CheckCheck,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { ChatContact } from './ChatSidebar';

export interface ChatMessage {
  id: string;
  content: string;
  timestamp: string;
  isSent: boolean;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  type: 'text' | 'image' | 'file' | 'video' | 'audio';
  mediaUrl?: string;
  fileName?: string;
  fileSize?: string;
}

interface ChatAreaProps {
  contact: ChatContact | null;
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  onSendFile: (file: File) => void;
  isLoading?: boolean;
}

function StatusIcon({ status }: { status: ChatMessage['status'] }) {
  if (status === 'sending') return <span className="text-muted-foreground text-[10px]">⏳</span>;
  if (status === 'sent') return <Check className="w-3.5 h-3.5 text-muted-foreground" />;
  if (status === 'delivered') return <CheckCheck className="w-3.5 h-3.5 text-muted-foreground" />;
  if (status === 'read') return <CheckCheck className="w-3.5 h-3.5 text-blue-500" />;
  if (status === 'failed') return <X className="w-3.5 h-3.5 text-destructive" />;
  return null;
}

export default function ChatArea({
  contact,
  messages,
  onSendMessage,
  onSendFile,
  isLoading,
}: ChatAreaProps) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (attachments.length > 0) {
      attachments.forEach((f) => onSendFile(f));
      setAttachments([]);
    }
    if (text.trim()) {
      onSendMessage(text.trim());
      setText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const addFiles = (files: FileList | null) => {
    if (files) setAttachments((prev) => [...prev, ...Array.from(files)]);
  };

  if (!contact) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/30">
        <div className="text-center text-muted-foreground">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
            <Send className="w-10 h-10 text-accent" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">ابدأ محادثة</h3>
          <p className="text-sm">اختر محادثة من القائمة أو أنشئ محادثة جديدة</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {contact.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">{contact.name}</h3>
            <p className="text-xs text-muted-foreground">{contact.phone}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost"><Search className="w-4 h-4" /></Button>
          <Button size="icon" variant="ghost"><Phone className="w-4 h-4" /></Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost"><MoreVertical className="w-4 h-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>معلومات جهة الاتصال</DropdownMenuItem>
              <DropdownMenuItem>كتم الإشعارات</DropdownMenuItem>
              <DropdownMenuItem>مسح المحادثة</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">حظر</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-3 max-w-3xl mx-auto">
          {messages.map((msg) => (
            <div key={msg.id} className={cn('flex', msg.isSent ? 'justify-start' : 'justify-end')}>
              <div
                className={cn(
                  'max-w-[75%] rounded-2xl px-4 py-2 shadow-sm',
                  msg.isSent
                    ? 'bg-card border border-border rounded-tr-sm'
                    : 'bg-accent/20 rounded-tl-sm'
                )}
              >
                {/* Media content */}
                {msg.type === 'image' && msg.mediaUrl && (
                  <img src={msg.mediaUrl} alt="" className="rounded-lg mb-2 max-w-full max-h-60 object-cover" />
                )}
                {msg.type === 'file' && (
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg mb-2">
                    <FileText className="w-8 h-8 text-accent flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{msg.fileName}</p>
                      {msg.fileSize && <p className="text-[10px] text-muted-foreground">{msg.fileSize}</p>}
                    </div>
                  </div>
                )}
                {msg.type === 'video' && (
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg mb-2">
                    <Video className="w-8 h-8 text-accent flex-shrink-0" />
                    <p className="text-xs font-medium">{msg.fileName || 'فيديو'}</p>
                  </div>
                )}

                {msg.content && <p className="text-sm text-foreground whitespace-pre-wrap">{msg.content}</p>}

                <div className="flex items-center gap-1 mt-1 justify-end">
                  <span className="text-[10px] text-muted-foreground">{msg.timestamp}</span>
                  {!msg.isSent && <StatusIcon status={msg.status} />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 border-t border-border bg-muted/30 flex gap-2 flex-wrap">
          {attachments.map((file, i) => (
            <div key={i} className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5 text-xs">
              <FileText className="w-4 h-4 text-accent" />
              <span className="truncate max-w-[120px]">{file.name}</span>
              <button onClick={() => setAttachments((p) => p.filter((_, idx) => idx !== i))}>
                <X className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 border-t border-border bg-card">
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          {/* Attach */}
          <DropdownMenu open={showAttachMenu} onOpenChange={setShowAttachMenu}>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="flex-shrink-0">
                <Paperclip className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-48">
              <DropdownMenuItem onClick={() => imageInputRef.current?.click()}>
                <ImageIcon className="w-4 h-4 ml-2 text-green-500" />
                صورة
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <FileText className="w-4 h-4 ml-2 text-blue-500" />
                مستند
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <Video className="w-4 h-4 ml-2 text-purple-500" />
                فيديو
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            multiple
            onChange={(e) => addFiles(e.target.files)}
          />
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            onChange={(e) => addFiles(e.target.files)}
          />

          <Button size="icon" variant="ghost" className="flex-shrink-0">
            <Smile className="w-5 h-5" />
          </Button>

          <div className="flex-1">
            <Input
              placeholder="اكتب رسالة..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="rounded-full"
            />
          </div>

          {text.trim() || attachments.length > 0 ? (
            <Button size="icon" onClick={handleSend} className="flex-shrink-0 rounded-full" disabled={isLoading}>
              <Send className="w-5 h-5" />
            </Button>
          ) : (
            <Button size="icon" variant="ghost" className="flex-shrink-0">
              <Mic className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
