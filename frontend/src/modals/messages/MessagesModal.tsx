import React, { useState, useEffect, useMemo, useRef } from 'react';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import InboxIcon from '@mui/icons-material/Inbox';
import MailIcon from '@mui/icons-material/Mail';
import SendIcon from '@mui/icons-material/Send';
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import BaseModal from '../BaseModal';
import { apiJson } from '../../utils/api';
import { MessageListPane }    from './MessageListPane';
import { MessageDetailPane }  from './MessageDetailPane';
import { MessageComposePane } from './MessageComposePane';
import { ComposeForm, Folder, Message, MessageGroup, MessagesModalProps, User, View } from './types';

const EMPTY_COMPOSE: ComposeForm = { recipients: [], groupId: '', subject: '', content: '' };

export const MessagesModal: React.FC<MessagesModalProps> = ({ open, onClose, initialMessageId }) => {
  const theme    = useTheme();
  const isDark   = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // ── Data ──────────────────────────────────────────────────────────────────
  const [inbox,    setInbox]    = useState<Message[]>([]);
  const [outbox,   setOutbox]   = useState<Message[]>([]);
  const [users,    setUsers]    = useState<User[]>([]);
  const [groups,   setGroups]   = useState<MessageGroup[]>([]);
  const [selected, setSelected] = useState<Message | null>(null);

  // ── UI ────────────────────────────────────────────────────────────────────
  const [folder,        setFolder]        = useState<Folder>(0);
  const [view,          setView]          = useState<View>('list');
  const [search,        setSearch]        = useState('');
  const [loading,       setLoading]       = useState(false);
  const [sendLoading,   setSendLoading]   = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [composeForm,      setComposeForm]      = useState<ComposeForm>(EMPTY_COMPOSE);
  const [composeError,     setComposeError]     = useState<string | null>(null);
  const [sendSuccess,      setSendSuccess]      = useState(false);
  const [recipientsLocked, setRecipientsLocked] = useState(false);

  // Ref to ensure auto-selection from deep-link only fires once per modal open
  const autoSelectedRef = useRef(false);

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      autoSelectedRef.current = false;
      loadAll();
      setView('list');
      setSearch('');
      setFolder(0);
      setSelected(null);
      setSendSuccess(false);
    }
  }, [open]);

  // Auto-select message when opened via deep-link (push notification)
  useEffect(() => {
    if (!open || !initialMessageId || inbox.length === 0 || autoSelectedRef.current) return;
    const found = inbox.find(m => String(m.id) === String(initialMessageId));
    if (found) {
      autoSelectedRef.current = true;
      handleMessageClick(found);
    }
  }, [open, initialMessageId, inbox]);

  // ── API ───────────────────────────────────────────────────────────────────
  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [inboxRes, outboxRes, usersRes, groupsRes] = await Promise.all([
        apiJson('/api/messages'),
        apiJson('/api/messages/outbox'),
        apiJson('/api/users/contacts'),
        apiJson('/api/message-groups'),
      ]);
      setInbox(inboxRes.messages   || []);
      setOutbox(outboxRes.messages || []);
      setUsers(usersRes.users      || []);
      setGroups(groupsRes.groups   || []);
    } catch {
      setError('Fehler beim Laden der Nachrichten');
    } finally {
      setLoading(false);
    }
  };

  const handleMessageClick = async (msg: Message) => {
    setDetailLoading(true);
    setSelected(msg);
    setView('detail');
    try {
      const full = await apiJson(`/api/messages/${msg.id}`);
      setSelected(full);
      setInbox(prev => prev.map(m => m.id === msg.id ? { ...m, isRead: true } : m));
    } catch {
      setError('Fehler beim Laden der Nachricht');
    } finally {
      setDetailLoading(false);
    }
  };

  const openCompose = (prefill?: Partial<ComposeForm>, lockRecipients = false) => {
    setComposeForm({ ...EMPTY_COMPOSE, ...prefill });
    setComposeError(null);
    setSendSuccess(false);
    setRecipientsLocked(lockRecipients);
    setView('compose');
  };

  const handleReply = () => {
    if (!selected) return;
    const replySubject = selected.subject.startsWith('Re:') ? selected.subject : `Re: ${selected.subject}`;
    const replyContent = `\n\n─────────────────────\nVon: ${selected.sender}\nDatum: ${new Date(selected.sentAt).toLocaleString('de-DE')}\n\n${selected.content || ''}`;
    // Sender direkt aus der Nachricht bauen – funktioniert auch ohne Kontaktliste
    const senderUser: User = users.find(u => u.id === selected.senderId)
      ?? { id: selected.senderId, fullName: selected.sender };
    openCompose({
      recipients: [senderUser],
      subject:    replySubject,
      content:    replyContent,
    }, true);
  };

  const handleReplyAll = () => {
    if (!selected) return;
    const replySubject = selected.subject.startsWith('Re:') ? selected.subject : `Re: ${selected.subject}`;
    const replyContent = `\n\n─────────────────────\nVon: ${selected.sender}\nDatum: ${new Date(selected.sentAt).toLocaleString('de-DE')}\n\n${selected.content || ''}`;
    // build recipient list: all original recipients (as User objects) + sender
    const fromRecipients: User[] = (selected.recipients || []).map(r => ({
      id:       r.id,
      fullName: r.name,
    }));
    const senderUser: User = users.find(u => u.id === selected.senderId)
      ?? { id: selected.senderId, fullName: selected.sender };
    const allRecipients = [senderUser, ...fromRecipients.filter(r => r.id !== senderUser.id)];
    openCompose({
      recipients: allRecipients,
      subject:    replySubject,
      content:    replyContent,
    }, true);
  };

  const handleResend = () => {
    if (!selected) return;
    // Pre-fill compose with same recipients + content, but recipients editable
    const recipients: User[] = (selected.recipients || []).map(r => ({
      id:       r.id,
      fullName: r.name,
    }));
    openCompose({ recipients, subject: selected.subject, content: selected.content || '' });
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await apiJson(`/api/messages/${selected.id}`, { method: 'DELETE' });
      setSelected(null);
      setView('list');
      await loadAll();
    } catch {
      setError('Fehler beim Löschen der Nachricht');
    }
  };

  const handleSend = async () => {
    if (!composeForm.subject.trim() || !composeForm.content.trim()) {
      setComposeError('Bitte Betreff und Nachricht ausfüllen.');
      return;
    }
    if (!composeForm.recipients.length && !composeForm.groupId) {
      setComposeError('Bitte mindestens einen Empfänger oder eine Gruppe wählen.');
      return;
    }
    setSendLoading(true);
    setComposeError(null);
    try {
      await apiJson('/api/messages', {
        method: 'POST',
        body: {
          recipientIds: composeForm.recipients.map(r => r.id),
          groupId:      composeForm.groupId || null,
          subject:      composeForm.subject,
          content:      composeForm.content,
        },
      });
      setSendSuccess(true);
      setComposeForm(EMPTY_COMPOSE);
      await loadAll();
      setTimeout(() => { setView('list'); setFolder(1); setSendSuccess(false); }, 1200);
    } catch {
      setComposeError('Fehler beim Senden der Nachricht');
    } finally {
      setSendLoading(false);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const activeMessages = folder === 0 ? inbox : outbox;
  const filtered = useMemo(() => {
    if (!search.trim()) return activeMessages;
    const q = search.toLowerCase();
    return activeMessages.filter(m =>
      m.subject.toLowerCase().includes(q) || m.sender.toLowerCase().includes(q)
    );
  }, [activeMessages, search]);

  const unreadCount = inbox.filter(m => !m.isRead).length;

  // ── Header gradient shared for brevity ────────────────────────────────────
  const headerBg = isDark
    ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.4)} 0%, ${alpha(theme.palette.primary.main, 0.15)} 100%)`
    : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.10)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`;

  // ── Pane instances ────────────────────────────────────────────────────────
  const listPane = (
    <MessageListPane
      messages={filtered} groups={groups}
      search={search} onSearch={setSearch}
      folder={folder} selectedId={selected?.id}
      isMobile={isMobile} loading={loading}
      onMessageClick={handleMessageClick}
    />
  );

  // User darf antworten wenn er Kontakte hat ODER der Absender ein Superadmin ist
  const canReply = users.length > 0 || (selected?.senderIsSuperAdmin === true);

  const detailPane = (
    <MessageDetailPane
      message={selected} loading={detailLoading}
      isMobile={isMobile} isOutbox={folder === 1}
      canReply={canReply}
      onBack={() => setView('list')}
      onReply={handleReply}
      onReplyAll={handleReplyAll}
      onResend={handleResend}
      onForward={prefill => openCompose(prefill)}
      onDelete={handleDelete}
    />
  );

  const composePane = (
    <MessageComposePane
      users={users} groups={groups}
      form={composeForm} onChange={setComposeForm}
      isMobile={isMobile} loading={sendLoading} contactsLoading={loading}
      recipientsLocked={recipientsLocked}
      error={composeError} success={sendSuccess}
      onSend={handleSend}
      onDiscard={() => setView('list')}
    />
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <BaseModal open={open} onClose={onClose} maxWidth="lg" title={undefined} actions={undefined}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: { xs: '85vh', sm: '72vh' }, minHeight: 0 }}>

        {/* Header */}
        <Box sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          px: { xs: 2, sm: 2.5 }, py: 1.5, flexShrink: 0,
          background: headerBg,
          borderBottom: '1px solid', borderColor: 'divider',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Badge badgeContent={unreadCount} color="error" max={99}>
              <MailIcon color="primary" />
            </Badge>
            <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: '1rem', sm: '1.15rem' } }}>
              Nachrichten
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button variant="contained" size="small" startIcon={<EditIcon />}
              onClick={() => openCompose()}
              sx={{ display: { xs: 'none', sm: 'flex' } }}>
              Neue Nachricht
            </Button>
            <Tooltip title="Neue Nachricht">
              <IconButton size="small" color="primary" onClick={() => openCompose()}
                sx={{ display: { xs: 'flex', sm: 'none' } }}>
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Schließen">
              <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Folder tabs (hidden while composing on mobile) */}
        {(view !== 'compose' || !isMobile) && (
          <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
            <Tabs
              value={folder}
              onChange={(_, v) => { setFolder(v); setSelected(null); setView('list'); }}
              sx={{ minHeight: 40, '& .MuiTab-root': { minHeight: 40, fontSize: '0.8rem', px: 2 } }}
            >
              <Tab
                icon={<InboxIcon fontSize="small" />} iconPosition="start"
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    Posteingang
                    {unreadCount > 0 && (
                      <Chip label={unreadCount} size="small" color="primary"
                        sx={{ height: 18, fontSize: '0.68rem', '& .MuiChip-label': { px: 0.75 } }} />
                    )}
                  </Box>
                }
              />
              <Tab icon={<SendIcon fontSize="small" />} iconPosition="start" label="Gesendet" />
            </Tabs>
          </Box>
        )}

        {/* Global error */}
        {error && (
          <Alert severity="error" sx={{ mx: 2, mt: 1, flexShrink: 0 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Body */}
        <Box sx={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
          {isMobile ? (
            /* Mobile: single active view */
            <>
              {view === 'list'    && listPane}
              {view === 'detail'  && detailPane}
              {view === 'compose' && composePane}
            </>
          ) : (
            /* Desktop: two-column or compose full-panel */
            view === 'compose' ? (
              <Box sx={{ width: '100%', minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {composePane}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', width: '100%', height: '100%', minHeight: 0 }}>
                <Box sx={{
                  width: { sm: 300, md: 340 }, flexShrink: 0,
                  borderRight: '1px solid', borderColor: 'divider',
                  display: 'flex', flexDirection: 'column', minHeight: 0,
                }}>
                  {listPane}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  {detailPane}
                </Box>
              </Box>
            )
          )}
        </Box>
      </Box>
    </BaseModal>
  );
};

export default MessagesModal;
