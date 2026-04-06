export interface RecipientLabel {
  type: 'team' | 'club' | 'group' | 'user';
  label: string;
  /** Human-readable role filter, e.g. "Alle Mitglieder", "Nur Spieler" */
  detail?: string;
}

export interface Pagination {
  page:    number;
  limit:   number;
  total:   number;
  pages:   number;
  hasMore: boolean;
}

export interface PagedResponse<T> {
  messages:   T[];
  pagination: Pagination;
}

export interface Message {
  id: string;
  subject: string;
  /** Short plain-text preview (≤ 160 chars), returned by the list endpoints */
  snippet?: string;
  sender: string;
  senderId: string;
  sentAt: string;
  isRead: boolean;
  content?: string;
  recipients?: Array<{ id: string; name: string }>;
  /**
   * Contextual labels representing the original send-target selection.
   * Present on messages that were sent after context-persistence was introduced.
   * Null for older messages.
   */
  recipientLabels?: RecipientLabel[] | null;
  /** true wenn der Absender ROLE_SUPERADMIN hat */
  senderIsSuperAdmin?: boolean;
  /** ID der Nachricht, auf die geantwortet wird (für Thread-Darstellung) */
  parentId?: string;
  /** Gemeinsame Thread-ID aller Nachrichten einer Konversation */
  threadId?: string;
  /** Anzahl der Antworten in diesem Thread (nur auf Root-Nachrichten in der List-Antwort) */
  replyCount?: number;
  hasUnreadReplies?: boolean;
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
  /** Present when loaded via GET /api/message-groups/:id */
  members?: User[];
}

export type BulkRole = 'all' | 'players' | 'coaches' | 'parents';

export interface OrgRef {
  id: string;
  name: string;
}

export interface TeamTarget {
  teamId: string;
  /** Mehrfachauswahl: welche Rollen erhalten die Nachricht */
  roles: BulkRole[];
}

export interface ClubTarget {
  clubId: string;
  /** Mehrfachauswahl: welche Rollen erhalten die Nachricht */
  roles: BulkRole[];
}

export interface ComposeForm {
  recipients: User[];
  groupId: string;
  teamTargets: TeamTarget[];
  clubTargets: ClubTarget[];
  subject: string;
  content: string;
  /** ID of the message being replied to (for thread tracking) */
  parentId?: string | null;
}

export interface MessagesModalProps {
  open: boolean;
  onClose: () => void;
  initialMessageId?: string;
}

export type View     = 'list' | 'detail' | 'compose';
export type Folder   = 0 | 1; // 0 = Posteingang, 1 = Gesendet
/** chrono = Posteingang/Postausgang getrennt | thread = vereinte Konversationsansicht */
export type ViewMode = 'chrono' | 'thread';
