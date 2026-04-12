import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartChat: (name: string, phone: string) => void;
}

export default function NewChatDialog({ open, onOpenChange, onStartChat }: NewChatDialogProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && phone.trim()) {
      onStartChat(name.trim(), phone.trim());
      setName('');
      setPhone('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>محادثة جديدة</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>الاسم</Label>
            <Input
              placeholder="اسم جهة الاتصال"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>رقم الهاتف</Label>
            <Input
              placeholder="+966XXXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              dir="ltr"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={!name.trim() || !phone.trim()}>
              بدء المحادثة
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
