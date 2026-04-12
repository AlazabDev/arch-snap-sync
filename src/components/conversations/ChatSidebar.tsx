import { useState } from 'react';
import { Search, Plus, MessageSquare, Circle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface ChatContact {
  id: string;
  name: string;
  phone: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isOnline: boolean;
  avatar?: string;
}

interface ChatSidebarProps {
  contacts: ChatContact[];
  selectedContact: ChatContact | null;
  onSelectContact: (contact: ChatContact) => void;
  onNewChat: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export default function ChatSidebar({
  contacts,
  selectedContact,
  onSelectContact,
  onNewChat,
  searchQuery,
  onSearchChange,
}: ChatSidebarProps) {
  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  return (
    <div className="flex flex-col h-full border-l border-border bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">المحادثات</h2>
          <Button size="icon" variant="ghost" onClick={onNewChat}>
            <Plus className="w-5 h-5" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث في المحادثات..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pr-9 text-sm"
          />
        </div>
      </div>

      {/* Contact List */}
      <ScrollArea className="flex-1">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            لا توجد محادثات
          </div>
        ) : (
          filtered.map((contact) => (
            <button
              key={contact.id}
              onClick={() => onSelectContact(contact)}
              className={cn(
                'w-full flex items-center gap-3 p-3 hover:bg-accent/10 transition-colors text-right border-b border-border/50',
                selectedContact?.id === contact.id && 'bg-accent/10'
              )}
            >
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                  {contact.name.charAt(0)}
                </div>
                {contact.isOnline && (
                  <Circle className="absolute bottom-0 left-0 w-3.5 h-3.5 fill-accent text-accent" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-foreground truncate">
                    {contact.name}
                  </span>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {contact.timestamp}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-muted-foreground truncate">
                    {contact.lastMessage}
                  </p>
                  {contact.unreadCount > 0 && (
                    <span className="bg-accent text-accent-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                      {contact.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </ScrollArea>
    </div>
  );
}
