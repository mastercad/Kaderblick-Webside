/**
 * Tests für MessagesModal
 *
 * Geprüft wird:
 *  - Daten laden beim Öffnen des Modals
 *  - Posteingang / Gesendet Tab-Wechsel
 *  - Suchfeld filtert Nachrichten
 *  - Klick auf Nachricht → Detailansicht
 *  - "Neue Nachricht"-Button → Compose-Ansicht
 *  - Antworten / Allen antworten / Weiterleiten / Erneut senden
 *  - Nachricht löschen
 *  - Nachricht senden inkl. Validierung
 *  - Deep-Link via initialMessageId
 *  - Fehlerbehandlung bei API-Fehlern
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MessagesModal } from '../MessagesModal';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../BaseModal', () => ({
  __esModule: true,
  default: ({ open, children }: { open: boolean; children: React.ReactNode; [k: string]: unknown }) =>
    open ? <div data-testid="BaseModal">{children}</div> : null,
}));

jest.mock('../../utils/api', () => ({
  apiJson: jest.fn(),
}));
import { apiJson } from '../../utils/api';

jest.mock('@mui/material/useMediaQuery', () => jest.fn().mockReturnValue(false));
import useMediaQuery from '@mui/material/useMediaQuery';

// Sub-panes als leichte Stubs – Props bleiben testbar
jest.mock('../messages/MessageListPane', () => ({
  MessageListPane: ({ messages, search, onSearch, folder, loading, onMessageClick, onMarkAllRead }: any) => (
    <div data-testid="MessageListPane" data-folder={folder} data-loading={String(loading)} data-search={search}>
      {messages.map((m: any) => (
        <button key={m.id} data-testid={`msg-${m.id}`} onClick={() => onMessageClick(m)}>
          {m.subject}
        </button>
      ))}
      <input
        data-testid="search-input"
        value={search}
        onChange={e => onSearch(e.target.value)}
      />
      <button data-testid="btn-mark-all-read" onClick={onMarkAllRead}>markAllRead</button>
    </div>
  ),
}));

jest.mock('../messages/MessageDetailPane', () => ({
  MessageDetailPane: ({ message, onBack, onReply, onReplyAll, onResend, onForward, onDelete, onMarkAsUnread }: any) => (
    <div data-testid="MessageDetailPane">
      {message && <span data-testid="detail-subject">{message.subject}</span>}
      <button data-testid="btn-back" onClick={onBack}>back</button>
      <button data-testid="btn-reply" onClick={onReply}>reply</button>
      <button data-testid="btn-reply-all" onClick={onReplyAll}>replyAll</button>
      <button data-testid="btn-resend" onClick={onResend}>resend</button>
      <button data-testid="btn-forward" onClick={() => onForward({ subject: message?.subject ?? '', content: message?.content ?? '' })}>forward</button>
      <button data-testid="btn-delete" onClick={onDelete}>delete</button>
      <button data-testid="btn-mark-unread" onClick={onMarkAsUnread}>markUnread</button>
    </div>
  ),
}));

jest.mock('../messages/MessageComposePane', () => ({
  MessageComposePane: ({ form, onChange, error, success, onSend, onDiscard, onGoToSent, teams, clubs, onGroupCreate, onGroupUpdate, onGroupDelete }: any) => (
    <div
      data-testid="MessageComposePane"
      data-teams={teams?.length ?? 0}
      data-clubs={clubs?.length ?? 0}
      data-parentid={form.parentId ?? ''}
    >
      {success && <span data-testid="compose-success">sent</span>}
      {error && <span data-testid="compose-error">{error}</span>}
      <input
        data-testid="compose-subject"
        value={form.subject}
        onChange={e => onChange({ ...form, subject: e.target.value })}
      />
      <input
        data-testid="compose-content"
        value={form.content}
        onChange={e => onChange({ ...form, content: e.target.value })}
      />
      <button data-testid="btn-send" onClick={onSend}>send</button>
      <button data-testid="btn-discard" onClick={onDiscard}>discard</button>
      <button data-testid="btn-go-to-sent" onClick={onGoToSent}>goToSent</button>
      <button
        data-testid="btn-set-team-specific-roles"
        onClick={() => onChange({ ...form, teamTargets: [{ teamId: 't1', roles: ['coaches', 'players'] }] })}
      >set team roles</button>
      <button
        data-testid="btn-set-club-specific-roles"
        onClick={() => onChange({ ...form, clubTargets: [{ clubId: 'c1', roles: ['coaches', 'players'] }] })}
      >set club roles</button>
      <button
        data-testid="btn-set-team-empty-roles"
        onClick={() => onChange({ ...form, teamTargets: [{ teamId: 't1', roles: [] }] })}
      >set empty roles</button>
      <button
        data-testid="btn-group-create"
        onClick={() => onGroupCreate({ id: 'gNew', name: 'Neu', memberCount: 0 })}
      >groupCreate</button>
      <button
        data-testid="btn-group-update"
        onClick={() => onGroupUpdate({ id: 'g1', name: 'Updated', memberCount: 5 })}
      >groupUpdate</button>
      <button
        data-testid="btn-group-delete"
        onClick={() => onGroupDelete('g1')}
      >groupDelete</button>
    </div>
  ),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MSG_INBOX: any[] = [
  { id: '1', subject: 'Willkommen', sender: 'Admin', senderId: 'u99', sentAt: new Date().toISOString(), isRead: false, content: 'Hallo!', recipients: [] },
  { id: '2', subject: 'Training morgen', sender: 'Trainer', senderId: 'u50', sentAt: new Date().toISOString(), isRead: true, content: 'Bitte kommen.', recipients: [] },
];
const MSG_OUTBOX: any[] = [
  { id: '3', subject: 'Meine Frage', sender: 'Ich', senderId: 'u1', sentAt: new Date().toISOString(), isRead: true, content: 'Frage hier', recipients: [] },
];
const USERS: any[] = [
  { id: 'u50', fullName: 'Trainer Müller' },
  { id: 'u99', fullName: 'Admin Schmidt' },
];
const GROUPS: any[] = [
  { id: 'g1', name: 'Team A', memberCount: 12 },
];
const TEAMS_DATA: any[] = [
  { id: 't1', name: 'Team Blau' },
];
const CLUBS_DATA: any[] = [
  { id: 'c1', name: 'Verein Nord' },
];

/** Standard-API-Mock: alle Endpoints liefern Fixtures */
function setupApiMock(overrides: Partial<Record<string, any>> = {}) {
  (apiJson as jest.Mock).mockImplementation(async (url: string, opts?: any) => {
    if (url in overrides) {
      const val = overrides[url];
      if (val instanceof Error) throw val;
      return val;
    }
    if (url === '/api/messages')          return { messages: MSG_INBOX };
    if (url === '/api/messages/outbox')   return { messages: MSG_OUTBOX };
    if (url === '/api/users/contacts')    return { users: USERS };
    if (url === '/api/message-groups')    return { groups: GROUPS };
    if (url === '/api/messaging/teams')   return { teams: TEAMS_DATA };
    if (url === '/api/messaging/clubs')   return { clubs: CLUBS_DATA };
    if (url.startsWith('/api/messages/') && opts?.method === 'DELETE') return {};
    if (url.startsWith('/api/messages/') && opts?.method === 'POST') return { id: '99' };
    if (url.startsWith('/api/messages/')) {
      const id = url.split('/').pop();
      return MSG_INBOX.find(m => m.id === id) ?? MSG_OUTBOX.find(m => m.id === id) ?? {};
    }
    return {};
  });
}

/** Klickt den sichtbaren "Neue Nachricht"-Button (der erste von zwei: Button + IconButton) */
function clickNeueNachricht() {
  const buttons = screen.getAllByRole('button', { name: /Neue Nachricht/i });
  fireEvent.click(buttons[0]);
}

const defaultProps = {
  open: true,
  onClose: jest.fn(),
};

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('MessagesModal', () => {
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterAll(() => {
    (console.error as jest.Mock).mockRestore();
  });
  beforeEach(() => {
    jest.clearAllMocks();
    setupApiMock();
  });

  // ─── Render / Daten laden ──────────────────────────────────────────────────

  it('rendert das Modal nicht wenn open=false', () => {
    render(<MessagesModal {...defaultProps} open={false} />);
    expect(screen.queryByTestId('BaseModal')).not.toBeInTheDocument();
  });

  it('rendert das Modal und lädt Daten beim Öffnen', async () => {
    await act(async () => {
      render(<MessagesModal {...defaultProps} />);
    });

    expect(screen.getByTestId('BaseModal')).toBeInTheDocument();
    expect(screen.getByText('Nachrichten')).toBeInTheDocument();
    expect(apiJson).toHaveBeenCalledWith('/api/messages');
    expect(apiJson).toHaveBeenCalledWith('/api/messages/outbox');
    expect(apiJson).toHaveBeenCalledWith('/api/users/contacts');
    expect(apiJson).toHaveBeenCalledWith('/api/message-groups');
    expect(apiJson).toHaveBeenCalledWith('/api/messaging/teams');
    expect(apiJson).toHaveBeenCalledWith('/api/messaging/clubs');
  });

  it('zeigt Inbox-Nachrichten im MessageListPane', async () => {
    await act(async () => {
      render(<MessagesModal {...defaultProps} />);
    });

    expect(screen.getByTestId('msg-1')).toBeInTheDocument();
    expect(screen.getByTestId('msg-2')).toBeInTheDocument();
    // Postausgang-Nachricht initial nicht in der Liste
    expect(screen.queryByTestId('msg-3')).not.toBeInTheDocument();
  });

  it('zeigt bei API-Fehler eine Fehlermeldung', async () => {
    (apiJson as jest.Mock).mockRejectedValue(new Error('network'));

    await act(async () => {
      render(<MessagesModal {...defaultProps} />);
    });

    expect(screen.getByText('Fehler beim Laden der Nachrichten')).toBeInTheDocument();
  });

  // ─── Tab-Wechsel ───────────────────────────────────────────────────────────

  it('wechselt beim Klick auf "Gesendet"-Tab zum Postausgang', async () => {
    await act(async () => {
      render(<MessagesModal {...defaultProps} />);
    });

    const outboxTab = screen.getByRole('tab', { name: /Gesendet/i });
    await act(async () => {
      fireEvent.click(outboxTab);
    });

    expect(screen.getByTestId('msg-3')).toBeInTheDocument();
    expect(screen.queryByTestId('msg-1')).not.toBeInTheDocument();
  });

  // ─── Suche ─────────────────────────────────────────────────────────────────

  it('filtert Nachrichten nach Betreff', async () => {
    await act(async () => {
      render(<MessagesModal {...defaultProps} />);
    });

    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'Willkommen' } });

    expect(screen.getByTestId('msg-1')).toBeInTheDocument();
    expect(screen.queryByTestId('msg-2')).not.toBeInTheDocument();
  });

  it('filtert nach Absender', async () => {
    await act(async () => {
      render(<MessagesModal {...defaultProps} />);
    });

    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'trainer' } });

    expect(screen.queryByTestId('msg-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('msg-2')).toBeInTheDocument();
  });

  // ─── Nachricht anklicken → Detail ─────────────────────────────────────────
  // Im Desktop-Layout sind ListPane und DetailPane stets nebeneinander sichtbar;
  // ein ausgewählte Nachricht zeigt das detail-subject-Element.

  it('lädt und zeigt die Nachricht nach Klick', async () => {
    await act(async () => {
      render(<MessagesModal {...defaultProps} />);
    });

    // Kein detail-subject solange nichts ausgewählt
    expect(screen.queryByTestId('detail-subject')).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByTestId('msg-1'));
    });

    expect(apiJson).toHaveBeenCalledWith('/api/messages/1');
    expect(screen.getByTestId('detail-subject')).toHaveTextContent('Willkommen');
  });

  it('zeigt Fehler wenn Nachrichten-Detail nicht geladen werden kann', async () => {
    setupApiMock({ '/api/messages/1': new Error('fail') });

    await act(async () => {
      render(<MessagesModal {...defaultProps} />);
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('msg-1'));
    });

    expect(screen.getByText('Fehler beim Laden der Nachricht')).toBeInTheDocument();
  });

  // ─── Compose ───────────────────────────────────────────────────────────────

  it('öffnet Compose-Ansicht beim Klick auf "Neue Nachricht"', async () => {
    await act(async () => {
      render(<MessagesModal {...defaultProps} />);
    });

    clickNeueNachricht();

    expect(screen.getByTestId('MessageComposePane')).toBeInTheDocument();
    // Desktop: ListPane bleibt neben dem ComposePane sichtbar (zwei Spalten)
    expect(screen.getByTestId('MessageListPane')).toBeInTheDocument();
  });

  it('kehrt via Verwerfen zur Listenansicht zurück', async () => {
    await act(async () => {
      render(<MessagesModal {...defaultProps} />);
    });

    clickNeueNachricht();
    expect(screen.getByTestId('MessageComposePane')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('btn-discard'));

    expect(screen.getByTestId('MessageListPane')).toBeInTheDocument();
    expect(screen.queryByTestId('MessageComposePane')).not.toBeInTheDocument();
  });

  // ─── Senden ────────────────────────────────────────────────────────────────

  it('zeigt Validierungsfehler wenn Betreff und Inhalt fehlen', async () => {
    await act(async () => {
      render(<MessagesModal {...defaultProps} />);
    });

    clickNeueNachricht();

    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-send'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('compose-error')).toHaveTextContent(
        'Bitte Betreff und Nachricht ausfüllen.'
      );
    });
  });

  it('zeigt Validierungsfehler wenn Empfänger fehlt (Betreff+Inhalt gesetzt)', async () => {
    await act(async () => {
      render(<MessagesModal {...defaultProps} />);
    });

    clickNeueNachricht();

    fireEvent.change(screen.getByTestId('compose-subject'), { target: { value: 'Test-Betreff' } });
    fireEvent.change(screen.getByTestId('compose-content'), { target: { value: 'Test-Inhalt' } });

    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-send'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('compose-error')).toHaveTextContent(
        'Bitte mindestens einen Empfänger, eine Gruppe oder ein Team/Verein wählen.'
      );
    });
  });

  it('zeigt Fehler bei fehlgeschlagenem Senden', async () => {
    (apiJson as jest.Mock).mockImplementation(async (url: string, opts?: any) => {
      if (url === '/api/messages' && opts?.method === 'POST') throw new Error('500');
      if (url === '/api/messages')        return { messages: MSG_INBOX };
      if (url === '/api/messages/outbox') return { messages: MSG_OUTBOX };
      if (url === '/api/users/contacts')  return { users: USERS };
      if (url === '/api/message-groups')  return { groups: GROUPS };
      if (url.startsWith('/api/messages/')) {
        const id = url.split('/').pop();
        return MSG_INBOX.find(m => m.id === id) ?? MSG_OUTBOX.find(m => m.id === id) ?? {};
      }
      return {};
    });

    await act(async () => {
      render(<MessagesModal {...defaultProps} />);
    });

    // Reply öffnet Compose mit gesperrten Empfängern (recipients vorhanden, kein Validierungsfehler)
    await act(async () => { fireEvent.click(screen.getByTestId('msg-1')); });

    await act(async () => { fireEvent.click(screen.getByTestId('btn-reply')); });

    fireEvent.change(screen.getByTestId('compose-subject'), { target: { value: 'Re: Willkommen' } });
    fireEvent.change(screen.getByTestId('compose-content'), { target: { value: 'Meine Antwort' } });

    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-send'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('compose-error')).toHaveTextContent('Fehler beim Senden der Nachricht');
    });
  });

  // ─── Antworten ─────────────────────────────────────────────────────────────

  it('öffnet Compose mit "Re:"-Betreff nach Antworten', async () => {
    await act(async () => {
      render(<MessagesModal {...defaultProps} />);
    });

    await act(async () => { fireEvent.click(screen.getByTestId('msg-1')); });
    fireEvent.click(screen.getByTestId('btn-reply'));

    expect(screen.getByTestId('MessageComposePane')).toBeInTheDocument();
    expect(screen.getByTestId('compose-subject')).toHaveValue('Re: Willkommen');
  });

  it('verdoppelt "Re:" nicht wenn Betreff bereits damit beginnt', async () => {
    const reMsg = { ...MSG_INBOX[0], id: '1', subject: 'Re: Original' };
    setupApiMock({ '/api/messages/1': reMsg });
    (apiJson as jest.Mock).mockImplementation(async (url: string) => {
      if (url === '/api/messages')        return { messages: [reMsg, MSG_INBOX[1]] };
      if (url === '/api/messages/outbox') return { messages: MSG_OUTBOX };
      if (url === '/api/users/contacts')  return { users: USERS };
      if (url === '/api/message-groups')  return { groups: GROUPS };
      if (url === '/api/messages/1')      return reMsg;
      return {};
    });

    await act(async () => {
      render(<MessagesModal {...defaultProps} />);
    });

    await act(async () => { fireEvent.click(screen.getByTestId('msg-1')); });
    fireEvent.click(screen.getByTestId('btn-reply'));

    expect(screen.getByTestId('compose-subject')).toHaveValue('Re: Original');
  });

  it('öffnet Compose mit allen Empfängern nach "Allen antworten"', async () => {
    await act(async () => {
      render(<MessagesModal {...defaultProps} />);
    });

    await act(async () => { fireEvent.click(screen.getByTestId('msg-1')); });
    fireEvent.click(screen.getByTestId('btn-reply-all'));

    expect(screen.getByTestId('MessageComposePane')).toBeInTheDocument();
    expect(screen.getByTestId('compose-subject')).toHaveValue('Re: Willkommen');
  });

  it('öffnet Compose ohne gesperrte Empfänger nach "Erneut senden"', async () => {
    await act(async () => {
      render(<MessagesModal {...defaultProps} />);
    });

    await act(async () => { fireEvent.click(screen.getByTestId('msg-1')); });
    fireEvent.click(screen.getByTestId('btn-resend'));

    expect(screen.getByTestId('MessageComposePane')).toBeInTheDocument();
    expect(screen.getByTestId('compose-subject')).toHaveValue('Willkommen');
  });

  it('öffnet Compose via "Weiterleiten" mit gleichem Betreff', async () => {
    await act(async () => {
      render(<MessagesModal {...defaultProps} />);
    });

    await act(async () => { fireEvent.click(screen.getByTestId('msg-1')); });
    fireEvent.click(screen.getByTestId('btn-forward'));

    expect(screen.getByTestId('MessageComposePane')).toBeInTheDocument();
    expect(screen.getByTestId('compose-subject')).toHaveValue('Willkommen');
  });

  // ─── Löschen ───────────────────────────────────────────────────────────────

  it('löscht eine Nachricht und setzt Detail zurück', async () => {
    await act(async () => {
      render(<MessagesModal {...defaultProps} />);
    });

    await act(async () => { fireEvent.click(screen.getByTestId('msg-1')); });
    expect(screen.getByTestId('detail-subject')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-delete'));
    });

    expect(apiJson).toHaveBeenCalledWith('/api/messages/1', { method: 'DELETE' });
    // Nach Löschen kein detail-subject mehr (selected = null)
    expect(screen.queryByTestId('detail-subject')).not.toBeInTheDocument();
  });

  it('zeigt Fehler wenn Löschen fehlschlägt', async () => {
    (apiJson as jest.Mock).mockImplementation(async (url: string, opts?: any) => {
      if (url === '/api/messages')        return { messages: MSG_INBOX };
      if (url === '/api/messages/outbox') return { messages: MSG_OUTBOX };
      if (url === '/api/users/contacts')  return { users: USERS };
      if (url === '/api/message-groups')  return { groups: GROUPS };
      if (url === '/api/messages/1' && !opts?.method) return MSG_INBOX[0];
      if (opts?.method === 'DELETE')      throw new Error('delete failed');
      return {};
    });

    await act(async () => {
      render(<MessagesModal {...defaultProps} />);
    });

    await act(async () => { fireEvent.click(screen.getByTestId('msg-1')); });

    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-delete'));
    });

    expect(screen.getByText('Fehler beim Löschen der Nachricht')).toBeInTheDocument();
  });

  // ─── Deep-Link via initialMessageId ────────────────────────────────────────

  it('öffnet automatisch die Nachricht per initialMessageId', async () => {
    await act(async () => {
      render(<MessagesModal {...defaultProps} initialMessageId="2" />);
    });

    await waitFor(() => {
      expect(apiJson).toHaveBeenCalledWith('/api/messages/2');
    });
    expect(screen.getByTestId('detail-subject')).toHaveTextContent('Training morgen');
  });

  it('wählt keine Nachricht aus wenn initialMessageId nicht in Inbox ist', async () => {
    await act(async () => {
      render(<MessagesModal {...defaultProps} initialMessageId="999" />);
    });

    expect(apiJson).not.toHaveBeenCalledWith('/api/messages/999');
    expect(screen.queryByTestId('detail-subject')).not.toBeInTheDocument();
  });

  // ─── Modal schließen ───────────────────────────────────────────────────────

  it('ruft onClose auf beim Klick auf den Schließen-Button', async () => {
    const onClose = jest.fn();
    await act(async () => {
      render(<MessagesModal open={true} onClose={onClose} />);
    });

    fireEvent.click(screen.getByRole('button', { name: /Schließen/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // ─── Reset beim erneuten Öffnen ────────────────────────────────────────────

  it('setzt Ansicht beim erneuten Öffnen zurück auf Listenansicht', async () => {
    const { rerender } = render(<MessagesModal open={true} onClose={jest.fn()} />);
    await act(async () => { /* initial load */ });

    // In Compose navigieren
    clickNeueNachricht();
    expect(screen.getByTestId('MessageComposePane')).toBeInTheDocument();

    // Modal schließen und wieder öffnen
    await act(async () => {
      rerender(<MessagesModal open={false} onClose={jest.fn()} />);
    });
    await act(async () => {
      rerender(<MessagesModal open={true} onClose={jest.fn()} />);
    });

    expect(screen.getByTestId('MessageListPane')).toBeInTheDocument();
    expect(screen.queryByTestId('MessageComposePane')).not.toBeInTheDocument();
  });

  it('lädt Daten NICHT neu beim Wiederöffnen innerhalb der Cache-TTL', async () => {
    const { rerender } = render(<MessagesModal open={true} onClose={jest.fn()} />);
    await act(async () => { /* initial load */ });

    const callCount = (apiJson as jest.Mock).mock.calls.length;

    await act(async () => { rerender(<MessagesModal open={false} onClose={jest.fn()} />); });
    await act(async () => { rerender(<MessagesModal open={true} onClose={jest.fn()} />); });

    // Cache ist frisch → kein erneuter Fetch
    expect((apiJson as jest.Mock).mock.calls.length).toBe(callCount);
  });

  it('lädt Daten neu beim Wiederöffnen nach Ablauf der Cache-TTL', async () => {
    const dateSpy = jest.spyOn(Date, 'now').mockReturnValue(0);
    const { rerender } = render(<MessagesModal open={true} onClose={jest.fn()} />);
    await act(async () => { /* initial load at t=0 */ });

    const callCount = (apiJson as jest.Mock).mock.calls.length;

    await act(async () => { rerender(<MessagesModal open={false} onClose={jest.fn()} />); });

    // Simuliere Ablauf der 30-Sekunden-TTL
    dateSpy.mockReturnValue(31_000);

    await act(async () => { rerender(<MessagesModal open={true} onClose={jest.fn()} />); });

    // Nach TTL-Ablauf wurden erneut API-Calls ausgelöst
    expect((apiJson as jest.Mock).mock.calls.length).toBeGreaterThan(callCount);

    dateSpy.mockRestore();
  });

  // ─── Verwerfen-Dialog (Discard Guard) ─────────────────────────────────────

  it('zeigt Verwerfen-Dialog beim Wegnavigieren aus schmutziger Compose-Ansicht', async () => {
    await act(async () => {
      render(<MessagesModal {...defaultProps} />);
    });

    clickNeueNachricht();

    // Formular dirty machen
    fireEvent.change(screen.getByTestId('compose-subject'), { target: { value: 'Hallo' } });

    // Auf eine Nachricht klicken → guardNavigate → Dialog erscheint
    await act(async () => {
      fireEvent.click(screen.getByTestId('msg-1'));
    });

    expect(screen.getByText('Entwurf verwerfen?')).toBeInTheDocument();
  });

  it('"Weiter bearbeiten" schließt Dialog und behält Compose offen', async () => {
    await act(async () => {
      render(<MessagesModal {...defaultProps} />);
    });

    clickNeueNachricht();
    fireEvent.change(screen.getByTestId('compose-subject'), { target: { value: 'Hallo' } });

    await act(async () => { fireEvent.click(screen.getByTestId('msg-1')); });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Weiter bearbeiten/i }));
    });

    // Wait for MUI Dialog exit transition to complete
    await waitFor(() => {
      expect(screen.queryByText('Entwurf verwerfen?')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('MessageComposePane')).toBeInTheDocument();
    expect(screen.getByTestId('compose-subject')).toHaveValue('Hallo');
  });

  it('"Verwerfen" bestätigen führt ausstehende Navigation aus', async () => {
    await act(async () => {
      render(<MessagesModal {...defaultProps} />);
    });

    clickNeueNachricht();
    fireEvent.change(screen.getByTestId('compose-subject'), { target: { value: 'Hallo' } });

    await act(async () => { fireEvent.click(screen.getByTestId('msg-1')); });

    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-confirm-discard'));
    });

    // Nach Bestätigen wird die Nachricht geladen
    expect(apiJson).toHaveBeenCalledWith('/api/messages/1');
    // Wait for MUI Dialog exit transition to complete
    await waitFor(() => {
      expect(screen.queryByText('Entwurf verwerfen?')).not.toBeInTheDocument();
    });
  });

  // ─── Ungelesen / Alle gelesen ──────────────────────────────────────────────

  it('markiert Nachricht als ungelesen und ruft PATCH-Endpoint auf', async () => {
    await act(async () => {
      render(<MessagesModal {...defaultProps} />);
    });

    await act(async () => { fireEvent.click(screen.getByTestId('msg-1')); });

    expect(screen.getByTestId('detail-subject')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-mark-unread'));
    });

    expect(apiJson).toHaveBeenCalledWith('/api/messages/1/unread', { method: 'PATCH' });
  });

  it('markiert alle Nachrichten als gelesen und ruft PATCH-Endpoint auf', async () => {
    await act(async () => {
      render(<MessagesModal {...defaultProps} />);
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-mark-all-read'));
    });

    expect(apiJson).toHaveBeenCalledWith('/api/messages/read-all', { method: 'PATCH' });
  });

  // ─── Senden → Postausgang ─────────────────────────────────────────────────

  it('navigiert nach erfolgreichem Senden via "Zum Postausgang" zur Outbox', async () => {
    await act(async () => {
      render(<MessagesModal {...defaultProps} />);
    });

    // Reply öffnet Compose mit vorausgefüllten Empfänger, Betreff und Inhalt
    await act(async () => { fireEvent.click(screen.getByTestId('msg-1')); });
    fireEvent.click(screen.getByTestId('btn-reply'));

    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-send'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('compose-success')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-go-to-sent'));
    });

    // Outbox aktiv → folder=1
    expect(screen.getByTestId('MessageListPane')).toHaveAttribute('data-folder', '1');
    expect(screen.queryByTestId('MessageComposePane')).not.toBeInTheDocument();
  });

  // ─── Bulk-Targets laden ───────────────────────────────────────────────────

  describe('Bulk-Targets laden', () => {
    it('lädt Teams und Clubs beim Öffnen des Modals', async () => {
      await act(async () => {
        render(<MessagesModal {...defaultProps} />);
      });

      expect(apiJson).toHaveBeenCalledWith('/api/messaging/teams');
      expect(apiJson).toHaveBeenCalledWith('/api/messaging/clubs');
    });

    it('übergibt geladene Teams an MessageComposePane', async () => {
      await act(async () => {
        render(<MessagesModal {...defaultProps} />);
      });

      clickNeueNachricht();

      const pane = screen.getByTestId('MessageComposePane');
      expect(pane).toHaveAttribute('data-teams', String(TEAMS_DATA.length));
    });

    it('übergibt geladene Clubs an MessageComposePane', async () => {
      await act(async () => {
        render(<MessagesModal {...defaultProps} />);
      });

      clickNeueNachricht();

      const pane = screen.getByTestId('MessageComposePane');
      expect(pane).toHaveAttribute('data-clubs', String(CLUBS_DATA.length));
    });

    it('übergibt leere Arrays wenn Endpoint leer antwortet', async () => {
      setupApiMock({
        '/api/messaging/teams': { teams: [] },
        '/api/messaging/clubs': { clubs: [] },
      });

      await act(async () => {
        render(<MessagesModal {...defaultProps} />);
      });

      clickNeueNachricht();

      const pane = screen.getByTestId('MessageComposePane');
      expect(pane).toHaveAttribute('data-teams', '0');
      expect(pane).toHaveAttribute('data-clubs', '0');
    });

    it('setzt teams/clubs auf [] bei API-Fehler für diese Endpoints', async () => {
      (apiJson as jest.Mock).mockImplementation(async (url: string, opts?: any) => {
        if (url === '/api/messaging/teams') throw new Error('network');
        if (url === '/api/messaging/clubs') throw new Error('network');
        if (url === '/api/messages')        return { messages: MSG_INBOX };
        if (url === '/api/messages/outbox') return { messages: MSG_OUTBOX };
        if (url === '/api/users/contacts')  return { users: USERS };
        if (url === '/api/message-groups')  return { groups: GROUPS };
        return {};
      });

      await act(async () => {
        render(<MessagesModal {...defaultProps} />);
      });

      clickNeueNachricht();

      const pane = screen.getByTestId('MessageComposePane');
      expect(pane).toHaveAttribute('data-teams', '0');
      expect(pane).toHaveAttribute('data-clubs', '0');
    });
  });

  // ── parentId bei Antworten (Thread-Verknüpfung) ───────────────────────────

  describe('parentId bei Antworten (Thread-Verknüpfung)', () => {
    // Nachricht, die bereits Empfänger hat – wird für Resend benötigt,
    // damit die Validierung (mind. 1 Empfänger) nicht greift.
    const MSG_WITH_RECIPIENT: any = {
      id: '10',
      subject:    'Nachricht mit Empfänger',
      sender:     'Admin',
      senderId:   'u99',
      sentAt:     new Date().toISOString(),
      isRead:     false,
      content:    'Inhalt für Resend-Test',
      recipients: [{ id: 'u50', name: 'Trainer Müller' }],
    };

    function setupApiMockExtended() {
      (apiJson as jest.Mock).mockImplementation(async (url: string, opts?: any) => {
        if (url === '/api/messages')          return { messages: [MSG_WITH_RECIPIENT, ...MSG_INBOX] };
        if (url === '/api/messages/outbox')   return { messages: MSG_OUTBOX };
        if (url === '/api/users/contacts')    return { users: USERS };
        if (url === '/api/message-groups')    return { groups: GROUPS };
        if (url === '/api/messaging/teams')   return { teams: TEAMS_DATA };
        if (url === '/api/messaging/clubs')   return { clubs: CLUBS_DATA };
        if (url === '/api/messages/10')       return MSG_WITH_RECIPIENT;
        if (url.startsWith('/api/messages/') && opts?.method === 'DELETE') return {};
        if (url.startsWith('/api/messages/')) {
          const id = url.split('/').pop();
          return MSG_INBOX.find(m => m.id === id) ?? MSG_OUTBOX.find(m => m.id === id) ?? {};
        }
        return {};
      });
    }

    beforeEach(() => {
      jest.clearAllMocks();
      setupApiMockExtended();
    });

    // ── Compose-Form-State ───────────────────────────────────────────────────

    it('Antworten setzt parentId auf die Id der ausgewählten Nachricht im Compose-Form', async () => {
      await act(async () => { render(<MessagesModal {...defaultProps} />); });

      await act(async () => { fireEvent.click(screen.getByTestId('msg-1')); });
      fireEvent.click(screen.getByTestId('btn-reply'));

      expect(screen.getByTestId('MessageComposePane')).toHaveAttribute('data-parentid', '1');
    });

    it('Allen antworten setzt parentId auf die Id der ausgewählten Nachricht im Compose-Form', async () => {
      await act(async () => { render(<MessagesModal {...defaultProps} />); });

      await act(async () => { fireEvent.click(screen.getByTestId('msg-1')); });
      fireEvent.click(screen.getByTestId('btn-reply-all'));

      expect(screen.getByTestId('MessageComposePane')).toHaveAttribute('data-parentid', '1');
    });

    it('Neue Nachricht hat leeres parentId im Compose-Form', async () => {
      await act(async () => { render(<MessagesModal {...defaultProps} />); });
      clickNeueNachricht();

      expect(screen.getByTestId('MessageComposePane')).toHaveAttribute('data-parentid', '');
    });

    it('Erneut senden setzt kein parentId im Compose-Form', async () => {
      await act(async () => { render(<MessagesModal {...defaultProps} />); });

      await act(async () => { fireEvent.click(screen.getByTestId('msg-1')); });
      fireEvent.click(screen.getByTestId('btn-resend'));

      expect(screen.getByTestId('MessageComposePane')).toHaveAttribute('data-parentid', '');
    });

    it('Weiterleiten setzt kein parentId im Compose-Form', async () => {
      await act(async () => { render(<MessagesModal {...defaultProps} />); });

      await act(async () => { fireEvent.click(screen.getByTestId('msg-1')); });
      fireEvent.click(screen.getByTestId('btn-forward'));

      expect(screen.getByTestId('MessageComposePane')).toHaveAttribute('data-parentid', '');
    });

    it('parentId wird auf "" zurückgesetzt, wenn nach einer Antwort eine neue Nachricht geöffnet wird', async () => {
      await act(async () => { render(<MessagesModal {...defaultProps} />); });

      // Antwort öffnen → parentId = '1', form ist dirty (Betreff+Inhalt vorausgefüllt)
      await act(async () => { fireEvent.click(screen.getByTestId('msg-1')); });
      fireEvent.click(screen.getByTestId('btn-reply'));
      expect(screen.getByTestId('MessageComposePane')).toHaveAttribute('data-parentid', '1');

      // Verwerfen bestätigen (Form ist dirty → Dialog erscheint)
      fireEvent.click(screen.getByTestId('btn-discard'));
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-confirm-discard'));
      });

      // Neue Nachricht öffnen → parentId zurückgesetzt
      await waitFor(() => {
        expect(screen.queryByText('Entwurf verwerfen?')).not.toBeInTheDocument();
      });
      clickNeueNachricht();
      expect(screen.getByTestId('MessageComposePane')).toHaveAttribute('data-parentid', '');
    });

    it('Antwort auf message-10 setzt parentId auf "10"', async () => {
      await act(async () => { render(<MessagesModal {...defaultProps} />); });

      await act(async () => { fireEvent.click(screen.getByTestId('msg-10')); });
      fireEvent.click(screen.getByTestId('btn-reply'));

      expect(screen.getByTestId('MessageComposePane')).toHaveAttribute('data-parentid', '10');
    });

    // ── API-Aufruf mit parentId ──────────────────────────────────────────────

    it('Antworten sendet parentId im POST-Request an die API', async () => {
      await act(async () => { render(<MessagesModal {...defaultProps} />); });
      await act(async () => { fireEvent.click(screen.getByTestId('msg-1')); });
      fireEvent.click(screen.getByTestId('btn-reply'));

      await act(async () => { fireEvent.click(screen.getByTestId('btn-send')); });

      await waitFor(() => {
        const postCall = (apiJson as jest.Mock).mock.calls.find(
          ([url, opts]) => url === '/api/messages' && opts?.method === 'POST'
        );
        expect(postCall).toBeDefined();
        expect(postCall![1].body).toMatchObject({ parentId: '1' });
      });
    });

    it('Allen antworten sendet parentId im POST-Request an die API', async () => {
      await act(async () => { render(<MessagesModal {...defaultProps} />); });
      await act(async () => { fireEvent.click(screen.getByTestId('msg-1')); });
      fireEvent.click(screen.getByTestId('btn-reply-all'));

      await act(async () => { fireEvent.click(screen.getByTestId('btn-send')); });

      await waitFor(() => {
        const postCall = (apiJson as jest.Mock).mock.calls.find(
          ([url, opts]) => url === '/api/messages' && opts?.method === 'POST'
        );
        expect(postCall).toBeDefined();
        expect(postCall![1].body).toMatchObject({ parentId: '1' });
      });
    });

    it('Erneut senden sendet parentId: null im POST-Request', async () => {
      await act(async () => { render(<MessagesModal {...defaultProps} />); });

      // MSG_WITH_RECIPIENT hat Empfänger → Validierung besteht
      await act(async () => { fireEvent.click(screen.getByTestId('msg-10')); });
      fireEvent.click(screen.getByTestId('btn-resend'));

      // subject und content sind vorausgefüllt (vom MSG_WITH_RECIPIENT)
      await act(async () => { fireEvent.click(screen.getByTestId('btn-send')); });

      await waitFor(() => {
        const postCall = (apiJson as jest.Mock).mock.calls.find(
          ([url, opts]) => url === '/api/messages' && opts?.method === 'POST'
        );
        expect(postCall).toBeDefined();
        expect(postCall![1].body).toMatchObject({ parentId: null });
      });
    });
  });

  // ─── Fehlerbehandlung markieren ──────────────────────────────────────────────

  it('zeigt Fehler wenn Markieren als ungelesen fehlschlägt', async () => {
    (apiJson as jest.Mock).mockImplementation(async (url: string, opts?: any) => {
      if (url === '/api/messages')          return { messages: MSG_INBOX };
      if (url === '/api/messages/outbox')   return { messages: MSG_OUTBOX };
      if (url === '/api/users/contacts')    return { users: USERS };
      if (url === '/api/message-groups')    return { groups: GROUPS };
      if (url === '/api/messaging/teams')   return { teams: TEAMS_DATA };
      if (url === '/api/messaging/clubs')   return { clubs: CLUBS_DATA };
      if (url === '/api/messages/1' && !opts?.method) return MSG_INBOX[0];
      if (url.includes('/unread') && opts?.method === 'PATCH') throw new Error('unread fail');
      return {};
    });

    await act(async () => { render(<MessagesModal {...defaultProps} />); });
    await act(async () => { fireEvent.click(screen.getByTestId('msg-1')); });

    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-mark-unread'));
    });

    await waitFor(() => {
      expect(screen.getByText('Fehler beim Markieren als ungelesen')).toBeInTheDocument();
    });
  });

  it('zeigt Fehler wenn Alle als gelesen markieren fehlschlägt', async () => {
    (apiJson as jest.Mock).mockImplementation(async (url: string, opts?: any) => {
      if (url === '/api/messages')          return { messages: MSG_INBOX };
      if (url === '/api/messages/outbox')   return { messages: MSG_OUTBOX };
      if (url === '/api/users/contacts')    return { users: USERS };
      if (url === '/api/message-groups')    return { groups: GROUPS };
      if (url === '/api/messaging/teams')   return { teams: TEAMS_DATA };
      if (url === '/api/messaging/clubs')   return { clubs: CLUBS_DATA };
      if (url === '/api/messages/read-all' && opts?.method === 'PATCH') throw new Error('read-all fail');
      return {};
    });

    await act(async () => { render(<MessagesModal {...defaultProps} />); });

    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-mark-all-read'));
    });

    await waitFor(() => {
      expect(screen.getByText('Fehler beim Markieren aller Nachrichten als gelesen')).toBeInTheDocument();
    });
  });

  it('klick auf btn-back wechselt Ansicht zurück auf Liste', async () => {
    await act(async () => { render(<MessagesModal {...defaultProps} />); });
    await act(async () => { fireEvent.click(screen.getByTestId('msg-1')); });

    // Covers onBack={() => setView('list')} callback
    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-back'));
    });

    expect(screen.getByTestId('MessageListPane')).toBeInTheDocument();
  });

  it('schließt globalen Fehler-Alert via onClose', async () => {
    (apiJson as jest.Mock).mockRejectedValue(new Error('network'));

    await act(async () => { render(<MessagesModal {...defaultProps} />); });

    await waitFor(() => {
      expect(screen.getByText('Fehler beim Laden der Nachrichten')).toBeInTheDocument();
    });

    // MUI Alert renders a close button with aria-label="Close" when onClose is provided
    const closeBtn = screen.getByRole('button', { name: /close/i });
    await act(async () => {
      fireEvent.click(closeBtn);
    });

    expect(screen.queryByText('Fehler beim Laden der Nachrichten')).not.toBeInTheDocument();
  });

  it('sendet teamTargets mit spezifischen Rollen korrekt (nicht all)', async () => {
    await act(async () => { render(<MessagesModal {...defaultProps} />); });

    clickNeueNachricht();

    // Set non-'all' team roles
    fireEvent.click(screen.getByTestId('btn-set-team-specific-roles'));

    fireEvent.change(screen.getByTestId('compose-subject'), { target: { value: 'Betreff' } });
    fireEvent.change(screen.getByTestId('compose-content'), { target: { value: 'Inhalt' } });

    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-send'));
    });

    await waitFor(() => {
      const postCall = (apiJson as jest.Mock).mock.calls.find(
        ([url, opts]) => url === '/api/messages' && opts?.method === 'POST'
      );
      expect(postCall).toBeDefined();
      expect(postCall![1].body.teamTargets).toEqual([
        { teamId: 't1', role: 'coaches' },
        { teamId: 't1', role: 'players' },
      ]);
    });
  });

  it('sendet clubTargets mit spezifischen Rollen korrekt (nicht all)', async () => {
    await act(async () => { render(<MessagesModal {...defaultProps} />); });

    clickNeueNachricht();

    // Set non-'all' club roles
    fireEvent.click(screen.getByTestId('btn-set-club-specific-roles'));

    fireEvent.change(screen.getByTestId('compose-subject'), { target: { value: 'Betreff' } });
    fireEvent.change(screen.getByTestId('compose-content'), { target: { value: 'Inhalt' } });

    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-send'));
    });

    await waitFor(() => {
      const postCall = (apiJson as jest.Mock).mock.calls.find(
        ([url, opts]) => url === '/api/messages' && opts?.method === 'POST'
      );
      expect(postCall).toBeDefined();
      expect(postCall![1].body.clubTargets).toEqual([
        { clubId: 'c1', role: 'coaches' },
        { clubId: 'c1', role: 'players' },
      ]);
    });
  });

  it('öffnet Compose via mobile Neue-Nachricht-Button', async () => {
    await act(async () => { render(<MessagesModal {...defaultProps} />); });

    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-neue-nachricht-mobile'));
    });

    expect(screen.getByTestId('MessageComposePane')).toBeInTheDocument();
  });

  // ─── || [] Fallbacks in loadAll ───────────────────────────────────────────

  it('verwendet leere Arrays als Fallback wenn API-Response keine Eigenschaften hat', async () => {
    setupApiMock({
      '/api/messages':        {},
      '/api/messages/outbox': {},
      '/api/users/contacts':  {},
      '/api/message-groups':  {},
      '/api/messaging/teams': {},
      '/api/messaging/clubs': {},
    });

    await act(async () => { render(<MessagesModal {...defaultProps} />); });

    // Component renders without crash, no messages shown
    expect(screen.getByTestId('BaseModal')).toBeInTheDocument();
    expect(screen.queryByTestId('msg-1')).not.toBeInTheDocument();
  });

  // ─── Mobile-Layout ────────────────────────────────────────────────────────

  it('rendert mobile Einzelansicht wenn isMobile=true', async () => {
    (useMediaQuery as jest.Mock).mockReturnValueOnce(true);

    await act(async () => { render(<MessagesModal {...defaultProps} />); });

    // Mobile mode: list shows initially
    expect(screen.getByTestId('MessageListPane')).toBeInTheDocument();
  });

  // ─── Gruppen-Callbacks ────────────────────────────────────────────────────

  it('handleGroupCreate fügt neue Gruppe zur Liste hinzu', async () => {
    await act(async () => { render(<MessagesModal {...defaultProps} />); });

    clickNeueNachricht();

    // The stub fires onGroupCreate with a new group
    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-group-create'));
    });

    // No crash, compose pane still visible
    expect(screen.getByTestId('MessageComposePane')).toBeInTheDocument();
  });

  it('handleGroupUpdate aktualisiert Gruppe in der Liste', async () => {
    await act(async () => { render(<MessagesModal {...defaultProps} />); });

    clickNeueNachricht();

    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-group-update'));
    });

    expect(screen.getByTestId('MessageComposePane')).toBeInTheDocument();
  });

  it('handleGroupDelete entfernt Gruppe aus der Liste', async () => {
    await act(async () => { render(<MessagesModal {...defaultProps} />); });

    clickNeueNachricht();

    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-group-delete'));
    });

    expect(screen.getByTestId('MessageComposePane')).toBeInTheDocument();
  });

  // ─── Antworten auf unbekannten Absender ────────────────────────────────────

  it('antwortet auf Nachricht von Absender der nicht in Kontakten ist', async () => {
    const MSG_UNKNOWN_SENDER: any = {
      id: '5',
      subject: 'Nachricht von Unbekannt',
      sender: 'Unbekannt',
      senderId: 'u_unknown',
      sentAt: new Date().toISOString(),
      isRead: false,
      content: 'Hallo',
      recipients: [],
    };
    (apiJson as jest.Mock).mockImplementation(async (url: string, opts?: any) => {
      if (url === '/api/messages')          return { messages: [MSG_UNKNOWN_SENDER, ...MSG_INBOX] };
      if (url === '/api/messages/outbox')   return { messages: MSG_OUTBOX };
      if (url === '/api/users/contacts')    return { users: USERS };
      if (url === '/api/message-groups')    return { groups: GROUPS };
      if (url === '/api/messaging/teams')   return { teams: TEAMS_DATA };
      if (url === '/api/messaging/clubs')   return { clubs: CLUBS_DATA };
      if (url === '/api/messages/5')        return MSG_UNKNOWN_SENDER;
      if (url.startsWith('/api/messages/')) {
        const id = url.split('/').pop();
        return MSG_INBOX.find((m: any) => m.id === id) ?? {};
      }
      return {};
    });

    await act(async () => { render(<MessagesModal {...defaultProps} />); });
    await act(async () => { fireEvent.click(screen.getByTestId('msg-5')); });

    // Reply – sender not in users list, should use ?? fallback to synthesize user
    fireEvent.click(screen.getByTestId('btn-reply'));

    expect(screen.getByTestId('MessageComposePane')).toBeInTheDocument();
    expect(screen.getByTestId('compose-subject')).toHaveValue('Re: Nachricht von Unbekannt');
  });

  // ─── Senden mit leeren Rollen (Fallback zu 'all') ─────────────────────────

  it('sendet teamTargets mit leeren roles und verwendet all als Fallback', async () => {
    await act(async () => { render(<MessagesModal {...defaultProps} />); });

    clickNeueNachricht();

    // Set teamTargets with empty roles array (roles: [])
    fireEvent.click(screen.getByTestId('btn-set-team-empty-roles'));

    fireEvent.change(screen.getByTestId('compose-subject'), { target: { value: 'Betreff' } });
    fireEvent.change(screen.getByTestId('compose-content'), { target: { value: 'Inhalt' } });

    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-send'));
    });

    await waitFor(() => {
      const postCall = (apiJson as jest.Mock).mock.calls.find(
        ([url, opts]) => url === '/api/messages' && opts?.method === 'POST'
      );
      expect(postCall).toBeDefined();
      // roles: [] → fallback to ['all'] → single entry with role: 'all'
      expect(postCall![1].body.teamTargets).toEqual([{ teamId: 't1', role: 'all' }]);
    });
  });
});

