/**
 * Tests für MessageListPane
 *
 * Geprüft wird:
 *  - Thread-Gruppierung anhand threadId (nicht per Betreff)
 *  - Thread-Gruppierung anhand parentId als Fallback
 *  - Nachrichten ohne threadId/parentId erscheinen als einzelne Einträge
 *  - Mischung: solo + threadId + parentId gruppiert korrekt
 *  - Neueste Nachricht eines Threads wird als Listeneintrag angezeigt
 *  - Betreff wird verbatim angezeigt (kein Stripping von "Re:"/"Fwd:" etc.)
 *  - Leerzustände: Posteingang, Postausgang, Suche ohne Treffer
 *  - Ladezustand zeigt Spinner
 *  - "Alle als gelesen markieren" nur im Posteingang bei unreadCount > 0
 *  - Suche: onSearch-Callback wird aufgerufen
 *  - onMessageClick wird mit richtigem Message-Objekt aufgerufen
 *  - Thread mit 2+ Nachrichten zeigt AvatarGroup statt einzelnen Avatar
 */

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MessageListPane } from '../messages/MessageListPane';
import { Message, Folder } from '../messages/types';

// ── MUI-Mocks ─────────────────────────────────────────────────────────────────

jest.mock('@mui/material/styles', () => ({
  useTheme: () => ({
    palette: {
      mode: 'light',
      primary: { main: '#1976d2', contrastText: '#fff', dark: '#115293' },
      action:  { hover: 'rgba(0,0,0,0.04)' },
      text:    { secondary: 'rgba(0,0,0,0.6)', disabled: 'rgba(0,0,0,0.38)', primary: 'rgba(0,0,0,0.87)' },
    },
  }),
  alpha: (color: string, _opacity: number) => color,
}));

jest.mock('@mui/material/Avatar', () => ({
  __esModule: true,
  default: ({ children, sx: _sx, ...p }: any) => <span data-testid="avatar" {...p}>{children}</span>,
}));
jest.mock('@mui/material/AvatarGroup', () => ({
  __esModule: true,
  default: ({ children, max: _m, sx: _sx }: any) => <div data-testid="avatar-group">{children}</div>,
}));
jest.mock('@mui/material/Badge', () => ({
  __esModule: true,
  default: ({ children, badgeContent: _bc, color: _col, variant: _v, invisible: _inv, overlap: _o, anchorOrigin: _ao, ...p }: any) => (
    <div {...p}>{children}</div>
  ),
}));
jest.mock('@mui/material/Box', () => ({
  __esModule: true,
  default: ({ children, sx: _sx, component, ...p }: any) => {
    // Avoid passing 'component' to DOM element
    return <div {...p}>{children}</div>;
  },
}));
jest.mock('@mui/material/Button', () => ({
  __esModule: true,
  default: ({ children, onClick, startIcon, size: _s, sx: _sx, ...p }: any) => (
    <button onClick={onClick} {...p}>{startIcon}{children}</button>
  ),
}));
jest.mock('@mui/material/CircularProgress', () => ({
  __esModule: true,
  default: () => <span data-testid="loading-spinner" />,
}));
jest.mock('@mui/material/Divider', () => ({
  __esModule: true,
  default: ({ component: _c, sx: _sx, ...p }: any) => <hr {...p} />,
}));
jest.mock('@mui/material/IconButton', () => ({
  __esModule: true,
  default: ({ children, onClick, size: _s, sx: _sx, ...p }: any) => (
    <button onClick={onClick} {...p}>{children}</button>
  ),
}));
jest.mock('@mui/material/InputAdornment', () => ({
  __esModule: true,
  default: ({ children, position: _p }: any) => <span>{children}</span>,
}));
jest.mock('@mui/material/List', () => ({
  __esModule: true,
  default: ({ children, disablePadding: _dp }: any) => <ul>{children}</ul>,
}));
jest.mock('@mui/material/ListItemAvatar', () => ({
  __esModule: true,
  default: ({ children, sx: _sx }: any) => <div data-testid="list-item-avatar">{children}</div>,
}));
jest.mock('@mui/material/ListItemButton', () => ({
  __esModule: true,
  default: ({ children, onClick, selected, 'data-testid': testId, sx: _sx, ...p }: any) => (
    <li
      data-testid={testId}
      data-selected={selected ? 'true' : 'false'}
      onClick={onClick}
      {...p}
    >
      {children}
    </li>
  ),
}));
jest.mock('@mui/material/ListItemText', () => ({
  __esModule: true,
  default: ({ primary, secondary, secondaryTypographyProps: _stp }: any) => (
    <div>
      <div data-testid="item-primary">{primary}</div>
      <div data-testid="item-secondary">{secondary}</div>
    </div>
  ),
}));
jest.mock('@mui/material/TextField', () => ({
  __esModule: true,
  default: ({ value, onChange, InputProps, placeholder, size: _s, fullWidth: _fw, sx: _sx }: any) => (
    <div>
      {InputProps?.startAdornment}
      <input
        data-testid="search-field"
        value={value}
        onChange={onChange ?? (() => {})}
        placeholder={placeholder}
      />
      {InputProps?.endAdornment}
    </div>
  ),
}));
jest.mock('@mui/material/Tooltip', () => ({
  __esModule: true,
  default: ({ children, title: _t }: any) => <>{children}</>,
}));
jest.mock('@mui/material/Typography', () => ({
  __esModule: true,
  default: ({ children, sx: _sx, variant: _v, fontWeight: _fw, noWrap: _nw, color: _c, gutterBottom: _gb, component: _cmp, ...p }: any) => (
    <span {...p}>{children}</span>
  ),
}));

jest.mock('@mui/icons-material/Clear',       () => ({ __esModule: true, default: () => <span data-testid="clear-icon" /> }));
jest.mock('@mui/icons-material/DoneAll',     () => ({ __esModule: true, default: () => <span /> }));
jest.mock('@mui/icons-material/Forum',       () => ({ __esModule: true, default: () => <span data-testid="forum-icon" /> }));
jest.mock('@mui/icons-material/MailOutline', () => ({ __esModule: true, default: () => <span data-testid="empty-icon" /> }));
jest.mock('@mui/icons-material/Search',      () => ({ __esModule: true, default: () => <span /> }));

// ── Hilfsfunktion ─────────────────────────────────────────────────────────────

/** Erzeugt ein minimales Message-Objekt mit optionalen Overrides */
function msg(overrides: Partial<Message> & Pick<Message, 'id'>): Message {
  return {
    subject:    'Standardbetreff',
    sender:     'Absender',
    senderId:   'u-default',
    sentAt:     '2026-01-10T10:00:00Z',
    isRead:     true,
    recipients: [],
    ...overrides,
  };
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const SOLO_A = msg({ id: 'solo-a', subject: 'Erster Brief', sender: 'Alice', sentAt: '2026-01-10T10:00:00Z' });
const SOLO_B = msg({ id: 'solo-b', subject: 'Zweiter Brief', sender: 'Bob',   sentAt: '2026-01-10T11:00:00Z' });

// Zwei Nachrichten im selben Thread (via threadId)
const THREAD_OLDER = msg({ id: 'th-old', subject: 'Thread Thema',     sender: 'Carol', sentAt: '2026-01-11T09:00:00Z', threadId: 'thread-x', isRead: true });
const THREAD_NEWER = msg({ id: 'th-new', subject: 'Re: Thread Thema', sender: 'Dave',  sentAt: '2026-01-11T10:30:00Z', threadId: 'thread-x', isRead: false });

// Zwei Nachrichten im selben Thread (via parentId, kein threadId)
const PARENT_ROOT  = msg({ id: 'par-root', subject: 'Elternnachricht',     sender: 'Eve',  sentAt: '2026-01-12T08:00:00Z', parentId: 'parent-y', isRead: true });
const PARENT_REPLY = msg({ id: 'par-reply', subject: 'Re: Elternnachricht', sender: 'Frank', sentAt: '2026-01-12T09:00:00Z', parentId: 'parent-y', isRead: false });

// ── Default Props ─────────────────────────────────────────────────────────────

const defaultProps = {
  messages:       [] as Message[],
  search:         '',
  onSearch:       jest.fn(),
  folder:         0 as Folder,
  isMobile:       false,
  loading:        false,
  unreadCount:    0,
  onMessageClick: jest.fn(),
  onMarkAllRead:  jest.fn(),
};

// ── Suites ────────────────────────────────────────────────────────────────────

describe('MessageListPane – Thread-Gruppierung via threadId', () => {
  beforeEach(() => jest.clearAllMocks());

  it('zwei Nachrichten mit gleichem threadId ergeben genau einen Listeneintrag', () => {
    render(
      <MessageListPane
        {...defaultProps}
        messages={[THREAD_OLDER, THREAD_NEWER]}
      />
    );

    // Nur die NEUESTE Nachricht erscheint als Eintrag
    expect(screen.getByTestId('msg-th-new')).toBeInTheDocument();
    // Die ältere Nachricht hat KEINEN eigenen Listeneintrag
    expect(screen.queryByTestId('msg-th-old')).not.toBeInTheDocument();
  });

  it('neueste Nachricht des Threads wird als Eintrag angezeigt', () => {
    render(
      <MessageListPane
        {...defaultProps}
        messages={[THREAD_OLDER, THREAD_NEWER]}
      />
    );

    // Der Eintrag zeigt die neueste Nachricht (th-new)
    const item = screen.getByTestId('msg-th-new');
    expect(item).toBeInTheDocument();
  });

  it('drei Nachrichten mit gleichem threadId werden zu einem Eintrag zusammengefasst', () => {
    const oldest  = msg({ id: 'th-1', threadId: 'grp', sentAt: '2026-01-01T08:00:00Z' });
    const middle  = msg({ id: 'th-2', threadId: 'grp', sentAt: '2026-01-01T09:00:00Z' });
    const newest  = msg({ id: 'th-3', threadId: 'grp', sentAt: '2026-01-01T10:00:00Z' });

    render(
      <MessageListPane {...defaultProps} messages={[oldest, middle, newest]} />
    );

    expect(screen.getByTestId('msg-th-3')).toBeInTheDocument();
    expect(screen.queryByTestId('msg-th-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('msg-th-2')).not.toBeInTheDocument();
  });

  it('unterschiedliche threadIds ergeben separate Einträge', () => {
    const first  = msg({ id: 'x1', threadId: 'thread-1', sentAt: '2026-01-01T10:00:00Z' });
    const second = msg({ id: 'x2', threadId: 'thread-2', sentAt: '2026-01-01T11:00:00Z' });

    render(
      <MessageListPane {...defaultProps} messages={[first, second]} />
    );

    expect(screen.getByTestId('msg-x1')).toBeInTheDocument();
    expect(screen.getByTestId('msg-x2')).toBeInTheDocument();
  });
});

describe('MessageListPane – Thread-Gruppierung via parentId', () => {
  beforeEach(() => jest.clearAllMocks());

  it('zwei Nachrichten mit gleichem parentId (ohne threadId) ergeben einen Eintrag', () => {
    render(
      <MessageListPane
        {...defaultProps}
        messages={[PARENT_ROOT, PARENT_REPLY]}
      />
    );

    // Nur die neuere Nachricht erscheint
    expect(screen.getByTestId('msg-par-reply')).toBeInTheDocument();
    expect(screen.queryByTestId('msg-par-root')).not.toBeInTheDocument();
  });

  it('threadId hat Vorrang vor parentId bei der Gruppenbildung', () => {
    // Beide haben parentId 'shared', aber unterschiedliche threadIds
    const withThreadA = msg({ id: 'ta', threadId: 'thread-A', parentId: 'shared', sentAt: '2026-01-01T10:00:00Z' });
    const withThreadB = msg({ id: 'tb', threadId: 'thread-B', parentId: 'shared', sentAt: '2026-01-01T11:00:00Z' });

    render(
      <MessageListPane {...defaultProps} messages={[withThreadA, withThreadB]} />
    );

    // Separate Threads, weil threadId unterschiedlich
    expect(screen.getByTestId('msg-ta')).toBeInTheDocument();
    expect(screen.getByTestId('msg-tb')).toBeInTheDocument();
  });
});

describe('MessageListPane – Solo-Nachrichten (kein threadId/parentId)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('Nachrichten ohne threadId und parentId erscheinen je als eigener Eintrag', () => {
    render(
      <MessageListPane {...defaultProps} messages={[SOLO_A, SOLO_B]} />
    );

    expect(screen.getByTestId('msg-solo-a')).toBeInTheDocument();
    expect(screen.getByTestId('msg-solo-b')).toBeInTheDocument();
  });

  it('Mischung: solo und gerät nicht in fremde Threads', () => {
    render(
      <MessageListPane
        {...defaultProps}
        messages={[SOLO_A, THREAD_OLDER, THREAD_NEWER]}
      />
    );

    // Solo-Nachricht hat eigenen Eintrag
    expect(screen.getByTestId('msg-solo-a')).toBeInTheDocument();
    // Thread-Nachrichten: nur die neuere
    expect(screen.getByTestId('msg-th-new')).toBeInTheDocument();
    expect(screen.queryByTestId('msg-th-old')).not.toBeInTheDocument();
  });

  it('zeigt zwei verschiedene solo-Nachrichten korrekt nebeneinander', () => {
    const m1 = msg({ id: 's1', sentAt: '2026-01-01T10:00:00Z' });
    const m2 = msg({ id: 's2', sentAt: '2026-01-01T11:00:00Z' });

    render(
      <MessageListPane {...defaultProps} messages={[m1, m2]} />
    );

    expect(screen.getByTestId('msg-s1')).toBeInTheDocument();
    expect(screen.getByTestId('msg-s2')).toBeInTheDocument();
  });
});

describe('MessageListPane – Betreff-Darstellung (verbatim)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('zeigt Betreff ohne Veränderung an', () => {
    render(
      <MessageListPane
        {...defaultProps}
        messages={[msg({ id: '1', subject: 'Regulärer Betreff' })]}
      />
    );

    expect(screen.getByText('Regulärer Betreff')).toBeInTheDocument();
  });

  it('zeigt "Re:"-Prefix NICHT weg (keine Normalisierung)', () => {
    render(
      <MessageListPane
        {...defaultProps}
        messages={[msg({ id: '1', subject: 'Re: Willkommen im Team' })]}
      />
    );

    // Exakter Betreff inklusive "Re:" muss sichtbar sein
    expect(screen.getByText('Re: Willkommen im Team')).toBeInTheDocument();
    // Der normalisierte Betreff (ohne Prefix) darf NICHT alleine stehen
    expect(screen.queryByText('Willkommen im Team')).not.toBeInTheDocument();
  });

  it('zeigt "Fwd:"-Prefix verbatim an', () => {
    render(
      <MessageListPane
        {...defaultProps}
        messages={[msg({ id: '1', subject: 'Fwd: Trainingsplan' })]}
      />
    );

    expect(screen.getByText('Fwd: Trainingsplan')).toBeInTheDocument();
  });

  it('zeigt verschachteltes "Re: Re:"-Prefix unverändert an', () => {
    render(
      <MessageListPane
        {...defaultProps}
        messages={[msg({ id: '1', subject: 'Re: Re: Spielbericht' })]}
      />
    );

    expect(screen.getByText('Re: Re: Spielbericht')).toBeInTheDocument();
  });

  it('zeigt Snippet wenn vorhanden', () => {
    render(
      <MessageListPane
        {...defaultProps}
        messages={[msg({ id: '1', subject: 'Mit Snippet', snippet: 'Kurze Vorschau...' })]}
      />
    );

    expect(screen.getByText('Kurze Vorschau...')).toBeInTheDocument();
  });
});

describe('MessageListPane – Thread-Avatare', () => {
  beforeEach(() => jest.clearAllMocks());

  it('Thread mit mehreren Nachrichten zeigt AvatarGroup', () => {
    render(
      <MessageListPane
        {...defaultProps}
        messages={[THREAD_OLDER, THREAD_NEWER]}
      />
    );

    // AvatarGroup wird für Thread-Einträge gerendert
    expect(screen.getByTestId('avatar-group')).toBeInTheDocument();
  });

  it('Solo-Nachricht zeigt einfachen Avatar (keine AvatarGroup)', () => {
    render(
      <MessageListPane
        {...defaultProps}
        messages={[SOLO_A]}
      />
    );

    expect(screen.queryByTestId('avatar-group')).not.toBeInTheDocument();
    expect(screen.getByTestId('avatar')).toBeInTheDocument();
  });
});

describe('MessageListPane – Leerzustände', () => {
  beforeEach(() => jest.clearAllMocks());

  it('zeigt "Keine Nachrichten" im leeren Posteingang', () => {
    render(
      <MessageListPane {...defaultProps} messages={[]} folder={0} search="" />
    );

    expect(screen.getByText('Keine Nachrichten')).toBeInTheDocument();
  });

  it('zeigt "Keine gesendeten Nachrichten" im leeren Postausgang', () => {
    render(
      <MessageListPane {...defaultProps} messages={[]} folder={1} search="" />
    );

    expect(screen.getByText('Keine gesendeten Nachrichten')).toBeInTheDocument();
  });

  it('zeigt "Keine Treffer" wenn Suche aktiv und Ergebnis leer', () => {
    render(
      <MessageListPane
        {...defaultProps}
        messages={[]}
        folder={0}
        search="nichtExistierenderSuchbegriff"
      />
    );

    expect(screen.getByText('Keine Treffer')).toBeInTheDocument();
  });

  it('zeigt leeres-Zustand-Icon', () => {
    render(
      <MessageListPane {...defaultProps} messages={[]} folder={0} />
    );

    expect(screen.getByTestId('empty-icon')).toBeInTheDocument();
  });
});

describe('MessageListPane – Ladezustand', () => {
  beforeEach(() => jest.clearAllMocks());

  it('zeigt Ladeindikator wenn loading=true', () => {
    render(
      <MessageListPane {...defaultProps} loading={true} />
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('rendert keine Nachrichten-Einträge während des Ladens', () => {
    render(
      <MessageListPane {...defaultProps} messages={[SOLO_A]} loading={true} />
    );

    // Spinner sichtbar, aber kein Nachrichten-Listeneintrag
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.queryByTestId('msg-solo-a')).not.toBeInTheDocument();
  });

  it('zeigt keine Leer-Nachricht während des Ladens', () => {
    render(
      <MessageListPane {...defaultProps} messages={[]} loading={true} />
    );

    expect(screen.queryByText('Keine Nachrichten')).not.toBeInTheDocument();
  });
});

describe('MessageListPane – "Alle als gelesen markieren"', () => {
  beforeEach(() => jest.clearAllMocks());

  it('zeigt den Button im Posteingang wenn unreadCount > 0', () => {
    render(
      <MessageListPane
        {...defaultProps}
        messages={[SOLO_A]}
        folder={0}
        unreadCount={3}
      />
    );

    expect(screen.getByText('Alle als gelesen markieren')).toBeInTheDocument();
  });

  it('zeigt den Button NICHT im Posteingang wenn unreadCount = 0', () => {
    render(
      <MessageListPane
        {...defaultProps}
        messages={[SOLO_A]}
        folder={0}
        unreadCount={0}
      />
    );

    expect(screen.queryByText('Alle als gelesen markieren')).not.toBeInTheDocument();
  });

  it('zeigt den Button NICHT im Postausgang (auch bei unreadCount > 0)', () => {
    render(
      <MessageListPane
        {...defaultProps}
        messages={[SOLO_A]}
        folder={1}
        unreadCount={5}
      />
    );

    expect(screen.queryByText('Alle als gelesen markieren')).not.toBeInTheDocument();
  });

  it('ruft onMarkAllRead beim Klick auf', () => {
    const onMarkAllRead = jest.fn();

    render(
      <MessageListPane
        {...defaultProps}
        messages={[SOLO_A]}
        folder={0}
        unreadCount={2}
        onMarkAllRead={onMarkAllRead}
      />
    );

    fireEvent.click(screen.getByText('Alle als gelesen markieren'));
    expect(onMarkAllRead).toHaveBeenCalledTimes(1);
  });
});

describe('MessageListPane – Suchfeld', () => {
  beforeEach(() => jest.clearAllMocks());

  it('zeigt Suchfeld', () => {
    render(<MessageListPane {...defaultProps} />);
    expect(screen.getByTestId('search-field')).toBeInTheDocument();
  });

  it('ruft onSearch beim Tippen im Suchfeld auf', () => {
    const onSearch = jest.fn();

    render(
      <MessageListPane {...defaultProps} onSearch={onSearch} />
    );

    fireEvent.change(screen.getByTestId('search-field'), {
      target: { value: 'Training' },
    });

    expect(onSearch).toHaveBeenCalledWith('Training');
  });

  it('zeigt Löschen-Icon wenn search nicht leer', () => {
    render(
      <MessageListPane {...defaultProps} search="abc" />
    );

    // ClearIcon wird gerendert wenn search gesetzt
    expect(screen.getByTestId('clear-icon')).toBeInTheDocument();
  });

  it('zeigt kein Löschen-Icon wenn search leer', () => {
    render(
      <MessageListPane {...defaultProps} search="" />
    );

    expect(screen.queryByTestId('clear-icon')).not.toBeInTheDocument();
  });

  it('Klick auf Löschen-Icon ruft onSearch mit leerem String auf', () => {
    const onSearch = jest.fn();

    render(
      <MessageListPane {...defaultProps} search="vorhandenerBegriff" onSearch={onSearch} />
    );

    // Der IconButton im endAdornment hat keinen aria-label, wir klicken per data-testid des Symbols
    const clearBtn = screen.getByTestId('clear-icon').closest('button');
    expect(clearBtn).not.toBeNull();
    fireEvent.click(clearBtn!);

    expect(onSearch).toHaveBeenCalledWith('');
  });
});

describe('MessageListPane – Nachrichten-Klick', () => {
  beforeEach(() => jest.clearAllMocks());

  it('ruft onMessageClick mit der geklickten Nachricht auf', () => {
    const onMessageClick = jest.fn();

    render(
      <MessageListPane
        {...defaultProps}
        messages={[SOLO_A]}
        onMessageClick={onMessageClick}
      />
    );

    fireEvent.click(screen.getByTestId('msg-solo-a'));
    expect(onMessageClick).toHaveBeenCalledWith(SOLO_A);
  });

  it('bei Thread-Klick wird die neueste Nachricht übergeben', () => {
    const onMessageClick = jest.fn();

    render(
      <MessageListPane
        {...defaultProps}
        messages={[THREAD_OLDER, THREAD_NEWER]}
        onMessageClick={onMessageClick}
      />
    );

    fireEvent.click(screen.getByTestId('msg-th-new'));
    expect(onMessageClick).toHaveBeenCalledWith(THREAD_NEWER);
  });

  it('markiert ausgewählte Nachricht als selected auf Desktop', () => {
    render(
      <MessageListPane
        {...defaultProps}
        messages={[SOLO_A, SOLO_B]}
        selectedId="solo-a"
        isMobile={false}
      />
    );

    expect(screen.getByTestId('msg-solo-a')).toHaveAttribute('data-selected', 'true');
    expect(screen.getByTestId('msg-solo-b')).toHaveAttribute('data-selected', 'false');
  });

  it('markiert keine Nachricht als selected auf Mobile', () => {
    render(
      <MessageListPane
        {...defaultProps}
        messages={[SOLO_A]}
        selectedId="solo-a"
        isMobile={true}
      />
    );

    // isMobile=true → isSelected immer false
    expect(screen.getByTestId('msg-solo-a')).toHaveAttribute('data-selected', 'false');
  });
});

describe('MessageListPane – Sortierung', () => {
  beforeEach(() => jest.clearAllMocks());

  it('neueste Nachricht erscheint zuerst in der Liste', () => {
    const early  = msg({ id: 'early',  sentAt: '2026-01-01T08:00:00Z' });
    const middle = msg({ id: 'middle', sentAt: '2026-01-01T12:00:00Z' });
    const late   = msg({ id: 'late',   sentAt: '2026-01-01T20:00:00Z' });

    render(
      <MessageListPane {...defaultProps} messages={[early, middle, late]} />
    );

    const items = screen.getAllByRole('listitem');
    // Erster Eintrag: 'late' (neueste)
    expect(items[0]).toHaveAttribute('data-testid', 'msg-late');
    expect(items[items.length - 1]).toHaveAttribute('data-testid', 'msg-early');
  });
});

describe('MessageListPane – Postausgang (folder=1)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('zeigt Nachricht im Postausgang korrekt an', () => {
    const sentMsg = msg({
      id:         'sent-1',
      subject:    'Meine gesendete Nachricht',
      sender:     'Ich',
      senderId:   'me',
      recipients: [{ id: 'r1', name: 'Empfänger Müller' }],
    });

    render(
      <MessageListPane {...defaultProps} messages={[sentMsg]} folder={1} />
    );

    expect(screen.getByTestId('msg-sent-1')).toBeInTheDocument();
    expect(screen.getByText('Meine gesendete Nachricht')).toBeInTheDocument();
  });

  it('zeigt Empfängernamen im Postausgang (nicht Absendername)', () => {
    const sentMsg = msg({
      id:         'sent-2',
      subject:    'Test',
      sender:     'Ich',
      senderId:   'me',
      recipients: [{ id: 'r1', name: 'Empfänger Müller' }],
    });

    render(
      <MessageListPane {...defaultProps} messages={[sentMsg]} folder={1} />
    );

    // Im Postausgang sollte 'Empfänger Müller' sichtbar sein (nicht 'Ich')
    expect(screen.getByText('Empfänger Müller')).toBeInTheDocument();
  });

  it('zeigt "–" als Empfänger wenn recipients leer und folder=1', () => {
    const sentMsg = msg({
      id:         'sent-3',
      subject:    'Test',
      sender:     'Ich',
      senderId:   'me',
      recipients: [],
    });

    render(
      <MessageListPane {...defaultProps} messages={[sentMsg]} folder={1} />
    );

    expect(screen.getByText('–')).toBeInTheDocument();
  });
});

// ── Realistisches Thread-Szenario: Root-Nachricht SELBST hat id = threadId ────
//
// Im Backend wird die Wurzelnachricht NICHT mit threadId gespeichert.
// Ihre id dient aber als threadId für alle Antworten.
// Schlüssel für die Gruppe:
//   root-msg:   threadId (undef) ?? parentId (undef) ?? id  → id
//   reply-msg:  threadId (= root.id)                       → root.id
// → beide landen im selben Bucket.

describe('MessageListPane – Root-Nachricht im realistischen Thread-Szenario', () => {
  beforeEach(() => jest.clearAllMocks());

  it('Root-Nachricht (keine threadId) und ihre direkte Antwort (threadId = root.id) ergeben einen Eintrag', () => {
    const root  = msg({ id: 'rt-1', subject: 'Ursprungsthema',     sender: 'Alice', sentAt: '2026-03-01T08:00:00Z' });
    const reply = msg({ id: 'rp-1', subject: 'Re: Ursprungsthema', sender: 'Bob',   sentAt: '2026-03-01T09:00:00Z', threadId: 'rt-1' });

    render(<MessageListPane {...defaultProps} messages={[root, reply]} />);

    // Neuere Nachricht erscheint als Listeneintrag
    expect(screen.getByTestId('msg-rp-1')).toBeInTheDocument();
    // Root selbst hat keinen eigenen Eintrag mehr (gehört zum selben Bucket)
    expect(screen.queryByTestId('msg-rt-1')).not.toBeInTheDocument();
  });

  it('Root-Nachricht erscheint als AvatarGroup wenn sie Teil eines Threads ist', () => {
    const root  = msg({ id: 'rt-2', sender: 'Alice', sentAt: '2026-03-02T08:00:00Z' });
    const reply = msg({ id: 'rp-2', sender: 'Bob',   sentAt: '2026-03-02T09:00:00Z', threadId: 'rt-2' });

    render(<MessageListPane {...defaultProps} messages={[root, reply]} />);

    expect(screen.getByTestId('avatar-group')).toBeInTheDocument();
  });

  it('Root-Nachricht allein (ohne Antworten) wird als solo Eintrag angezeigt', () => {
    const root = msg({ id: 'rt-3', subject: 'Einsame Nachricht', sender: 'Alice', sentAt: '2026-03-03T08:00:00Z' });

    render(<MessageListPane {...defaultProps} messages={[root]} />);

    expect(screen.getByTestId('msg-rt-3')).toBeInTheDocument();
    // Kein AvatarGroup für solo-Nachricht
    expect(screen.queryByTestId('avatar-group')).not.toBeInTheDocument();
  });

  it('Drei-Nachrichten-Kette: Root + 2 Antworten (threadId = root.id) → ein Eintrag mit neuester Nachricht', () => {
    const root   = msg({ id: 'rt-4', subject: 'Kette Start',      sender: 'Alice', sentAt: '2026-03-04T08:00:00Z' });
    const reply1 = msg({ id: 'rp-4a', subject: 'Re: Kette Start', sender: 'Bob',   sentAt: '2026-03-04T09:00:00Z', threadId: 'rt-4' });
    const reply2 = msg({ id: 'rp-4b', subject: 'Re: Kette Start', sender: 'Carol', sentAt: '2026-03-04T10:00:00Z', threadId: 'rt-4' });

    render(<MessageListPane {...defaultProps} messages={[root, reply1, reply2]} />);

    // Nur die jüngste Nachricht erscheint
    expect(screen.getByTestId('msg-rp-4b')).toBeInTheDocument();
    expect(screen.queryByTestId('msg-rt-4')).not.toBeInTheDocument();
    expect(screen.queryByTestId('msg-rp-4a')).not.toBeInTheDocument();
  });

  it('Root + Antwort: onMessageClick wird mit der neuesten Nachricht aufgerufen', () => {
    const onMessageClick = jest.fn();
    const root  = msg({ id: 'rt-5', sender: 'Alice', sentAt: '2026-03-05T08:00:00Z' });
    const reply = msg({ id: 'rp-5', sender: 'Bob',   sentAt: '2026-03-05T09:00:00Z', threadId: 'rt-5' });

    render(
      <MessageListPane
        {...defaultProps}
        messages={[root, reply]}
        onMessageClick={onMessageClick}
      />
    );

    fireEvent.click(screen.getByTestId('msg-rp-5'));
    expect(onMessageClick).toHaveBeenCalledWith(reply);
  });

  it('Zwei unabhängige Threads (verschiedene root-ids) bilden je einen eigenen Eintrag', () => {
    const rootA  = msg({ id: 'rt-a', sender: 'Alice', sentAt: '2026-03-06T08:00:00Z' });
    const replyA = msg({ id: 'rp-a', sender: 'Bob',   sentAt: '2026-03-06T09:00:00Z', threadId: 'rt-a' });
    const rootB  = msg({ id: 'rt-b', sender: 'Carol', sentAt: '2026-03-06T10:00:00Z' });
    const replyB = msg({ id: 'rp-b', sender: 'Dave',  sentAt: '2026-03-06T11:00:00Z', threadId: 'rt-b' });

    render(<MessageListPane {...defaultProps} messages={[rootA, replyA, rootB, replyB]} />);

    // Zwei Thread-Einträge (neueste Nachrichten beider Threads)
    expect(screen.getByTestId('msg-rp-a')).toBeInTheDocument();
    expect(screen.getByTestId('msg-rp-b')).toBeInTheDocument();
    // Roots erscheinen nicht separat
    expect(screen.queryByTestId('msg-rt-a')).not.toBeInTheDocument();
    expect(screen.queryByTestId('msg-rt-b')).not.toBeInTheDocument();
  });

  it('solo-Nachricht und Thread koexistieren unabhängig voneinander', () => {
    const solo  = msg({ id: 'rtS',  subject: 'Nur ich', sender: 'Eve',   sentAt: '2026-03-07T08:00:00Z' });
    const root  = msg({ id: 'rtR',  subject: 'Thread',  sender: 'Alice', sentAt: '2026-03-07T09:00:00Z' });
    const reply = msg({ id: 'rpR',  subject: 'Antwort', sender: 'Bob',   sentAt: '2026-03-07T10:00:00Z', threadId: 'rtR' });

    render(<MessageListPane {...defaultProps} messages={[solo, root, reply]} />);

    expect(screen.getByTestId('msg-rtS')).toBeInTheDocument();  // solo bleibt eigen
    expect(screen.getByTestId('msg-rpR')).toBeInTheDocument();  // Thread-Eintrag
    expect(screen.queryByTestId('msg-rtR')).not.toBeInTheDocument(); // Root weg
  });

  it('Thread-Eintrag zeigt den Betreff der neuesten Nachricht', () => {
    const root  = msg({ id: 'rt-8', subject: 'Ursprungsthema',              sender: 'Alice', sentAt: '2026-03-08T08:00:00Z' });
    const reply = msg({ id: 'rp-8', subject: 'Re: Ursprungsthema – Update', sender: 'Bob',   sentAt: '2026-03-08T09:00:00Z', threadId: 'rt-8' });

    render(<MessageListPane {...defaultProps} messages={[root, reply]} />);

    expect(screen.getByText('Re: Ursprungsthema – Update')).toBeInTheDocument();
  });
});
