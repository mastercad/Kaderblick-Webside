export interface Message {
  id: string;
  subject: string;
  sender: string;
  senderId: string;
  sentAt: string;
  isRead: boolean;
  content?: string;
  recipients?: Array<{ id: string; name: string }>;
  /** true wenn der Absender ROLE_SUPERADMIN hat */
  senderIsSuperAdmin?: boolean;
}

export interface User {
  id: string;
  fullName: string;
  /** Role + team/club context for disambiguation, e.g. "Spieler · TSV München U17" */
  context?: string;
}

export interface MessageGroup {
  id: string;
  name: string;
  memberCount: number;
}

export interface ComposeForm {
  recipients: User[];
  groupId: string;
  subject: string;
  content: string;
}

export interface MessagesModalProps {
  open: boolean;
  onClose: () => void;
  initialMessageId?: string;
}

export type View    = 'list' | 'detail' | 'compose';
export type Folder  = 0 | 1; // 0 = Posteingang, 1 = Gesendet
