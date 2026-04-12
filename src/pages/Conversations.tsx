import { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import ChatSidebar, { type ChatContact } from '@/components/conversations/ChatSidebar';
import ChatArea, { type ChatMessage } from '@/components/conversations/ChatArea';
import NewChatDialog from '@/components/conversations/NewChatDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function Conversations() {
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch conversations from whatsapp_messages grouped by phone
  const fetchContacts = useCallback(async () => {
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    if (!data || data.length === 0) {
      setContacts([]);
      return;
    }

    // Group messages by a pseudo phone (using message id prefix as proxy)
    const contactMap = new Map<string, ChatContact>();
    data.forEach((msg) => {
      // Use first 8 chars of id as grouping key for demo
      const key = msg.id.substring(0, 8);
      if (!contactMap.has(key)) {
        contactMap.set(key, {
          id: key,
          name: `محادثة ${contactMap.size + 1}`,
          phone: key,
          lastMessage: msg.message || '',
          timestamp: format(new Date(msg.timestamp), 'hh:mm a', { locale: ar }),
          unreadCount: 0,
          isOnline: msg.status === 'sent' || msg.status === 'delivered',
        });
      }
    });

    setContacts(Array.from(contactMap.values()));
  }, []);

  // Fetch messages for selected contact
  const fetchMessages = useCallback(async () => {
    if (!selectedContact) return;

    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .order('timestamp', { ascending: true })
      .limit(100);

    if (error) {
      console.error('Error:', error);
      return;
    }

    setMessages(
      (data || []).map((msg) => ({
        id: msg.id,
        content: msg.message,
        timestamp: format(new Date(msg.timestamp), 'hh:mm a', { locale: ar }),
        isSent: msg.type === 'received',
        status: (msg.status as ChatMessage['status']) || 'sent',
        type: msg.media_url ? 'image' : 'text',
        mediaUrl: msg.media_url || undefined,
      }))
    );
  }, [selectedContact]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('whatsapp-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_messages' }, () => {
        fetchContacts();
        if (selectedContact) fetchMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchContacts, fetchMessages, selectedContact]);

  const handleSendMessage = async (content: string) => {
    if (!selectedContact) return;
    setIsLoading(true);

    const msgId = uuidv4();
    const newMsg: ChatMessage = {
      id: msgId,
      content,
      timestamp: format(new Date(), 'hh:mm a', { locale: ar }),
      isSent: false,
      status: 'sending',
      type: 'text',
    };

    setMessages((prev) => [...prev, newMsg]);

    try {
      const { error } = await supabase.from('whatsapp_messages').insert({
        id: msgId,
        message: content,
        status: 'sent',
        type: 'text',
        timestamp: new Date().toISOString(),
      });

      if (error) throw error;

      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, status: 'sent' as const } : m))
      );
    } catch (err) {
      console.error(err);
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, status: 'failed' as const } : m))
      );
      toast.error('فشل إرسال الرسالة');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendFile = async (file: File) => {
    if (!selectedContact) return;
    setIsLoading(true);

    const msgId = uuidv4();
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    // Upload to Supabase storage
    try {
      const filePath = `chat/${msgId}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);

      const newMsg: ChatMessage = {
        id: msgId,
        content: '',
        timestamp: format(new Date(), 'hh:mm a', { locale: ar }),
        isSent: false,
        status: 'sent',
        type: isImage ? 'image' : isVideo ? 'video' : 'file',
        mediaUrl: urlData.publicUrl,
        fileName: file.name,
        fileSize: `${(file.size / 1024).toFixed(1)} KB`,
      };

      setMessages((prev) => [...prev, newMsg]);

      await supabase.from('whatsapp_messages').insert({
        id: msgId,
        message: file.name,
        status: 'sent',
        type: isImage ? 'image' : isVideo ? 'video' : 'document',
        media_url: urlData.publicUrl,
        timestamp: new Date().toISOString(),
      });

      toast.success('تم إرسال الملف');
    } catch (err) {
      console.error(err);
      toast.error('فشل رفع الملف');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = (name: string, phone: string) => {
    const newContact: ChatContact = {
      id: uuidv4(),
      name,
      phone,
      lastMessage: '',
      timestamp: format(new Date(), 'hh:mm a', { locale: ar }),
      unreadCount: 0,
      isOnline: false,
    };
    setContacts((prev) => [newContact, ...prev]);
    setSelectedContact(newContact);
  };

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        {/* Chat Sidebar */}
        <div className="w-80 flex-shrink-0 border-l border-border">
          <ChatSidebar
            contacts={contacts}
            selectedContact={selectedContact}
            onSelectContact={setSelectedContact}
            onNewChat={() => setShowNewChat(true)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        {/* Chat Area */}
        <ChatArea
          contact={selectedContact}
          messages={messages}
          onSendMessage={handleSendMessage}
          onSendFile={handleSendFile}
          isLoading={isLoading}
        />
      </div>

      <NewChatDialog
        open={showNewChat}
        onOpenChange={setShowNewChat}
        onStartChat={handleNewChat}
      />
    </AppLayout>
  );
}
