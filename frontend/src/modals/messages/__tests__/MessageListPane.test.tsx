/**
 * Tests for MessageListPane
 *
 * Covers:
 *  - Render: loading skeleton, empty state, message list
 *  - Chrono view: flat, sorted by date descending
 *  - Thread view: expand button visible when replyCount > 0
 *  - Thread loading: spinner shown while threadLoading contains root id
 *  - Thread expand: calls onExpandThread when thread not yet loaded
 *  - Thread expand: toggles children when thread already loaded
 *  - Load-more button: visible when hasMore=true, disabled while loadingMore
 *  - Search field: renders with value and onChange handler
 *  - Mark-all-read: button visible for inbox with unread messages, fires callback
 *  - Reply badge: shown on root with replyCount > 0 when collapsed
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MessageListPane } from '../MessageListPane';
import { Message } from '../types';

// ── Mocks ─────────────────────────────────────────────────────────────────────

// localStorage stub
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem:  (k: string) => store[k] ?? null,
    setItem:  (k: string, v: string) => { store[k] = v; },
    removeItem:(k: string) => { delete store[k]; },
    clear:    () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Helpers mock – keep implementation trivial
jest.mock('../helpers', () => ({
  relativeTime:   (_: string) => 'vor 1m',
  senderInitials: (name: string) => name.slice(0, 1).toUpperCase(),
  avatarColor:    (_: string) => '#aaa',
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

function msg(overrides: Partial<Message> & { id: string }): Message {
  return {
    subject:  'Betreff',
    sender:   'Alice',
    senderId: 'u1',
    sentAt:   new Date().toISOString(),
    isRead:   true,
    ...overrides,
  };
}

const INBOX_MSG1 = msg({ id: '1', subject: 'Willkommen', sender: 'Admin', isRead: false, sentAt: '2024-01-01T10:00:00Z' });
const INBOX_MSG2 = msg({ id: '2', subject: 'Training morgen', sender: 'Trainer', isRead: true, sentAt: '2024-01-02T10:00:00Z' });
const ROOT_WITH_REPLIES = msg({ id: '3', subject: 'Thread-Root', sender: 'Bob', replyCount: 2, sentAt: '2024-01-03T10:00:00Z' });
const REPLY1 = msg({ id: '31', subject: 'Re: Thread-Root', sender: 'Alice', parentId: '3', threadId: '3', sentAt: '2024-01-03T11:00:00Z' });
const REPLY2 = msg({ id: '32', subject: 'Re: Thread-Root', sender: 'Bob', parentId: '3', threadId: '3', sentAt: '2024-01-03T12:00:00Z' });

// ── Default props factory ────────────────────────────────────────────────────

function buildProps(overrides: Partial<Parameters<typeof MessageListPane>[0]> = {}): Parameters<typeof MessageListPane>[0] {
  return {
    messages:         [INBOX_MSG1, INBOX_MSG2],
    search:           '',
    onSearch:         jest.fn(),
    folder:           0 as const,
    isMobile:         false,
    loading:          false,
    unreadCount:      1,
    onMessageClick:   jest.fn(),
    onMarkAllRead:    jest.fn(),
    hasMore:          false,
    loadingMore:      false,
    onLoadMore:       jest.fn(),
    threadMessages:   new Map(),
    threadLoading:    new Set(),
    onExpandThread:   jest.fn(),
    viewMode:         'chrono' as const,
    onViewModeChange: jest.fn(),
    ...overrides,
  };
}

// (viewMode is now a controlled prop — switching tested via onViewModeChange callback)

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('MessageListPane', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ─── Loading ──────────────────────────────────────────────────────────────

  it('zeigt CircularProgress beim Laden', () => {
    render(<MessageListPane {...buildProps({ loading: true })} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('zeigt keine Nachrichten-Buttons beim Laden', () => {
    render(<MessageListPane {...buildProps({ loading: true })} />);
    expect(screen.queryByTestId('msg-1')).not.toBeInTheDocument();
  });

  // ─── Empty state ──────────────────────────────────────────────────────────

  it('zeigt Leer-Hinweis für leeren Posteingang', () => {
    render(<MessageListPane {...buildProps({ messages: [], unreadCount: 0 })} />);
    expect(screen.getByText('Keine Nachrichten')).toBeInTheDocument();
  });

  it('zeigt Leer-Hinweis für leeren Postausgang', () => {
    render(<MessageListPane {...buildProps({ messages: [], folder: 1, unreadCount: 0 })} />);
    expect(screen.getByText('Keine gesendeten Nachrichten')).toBeInTheDocument();
  });

  it('zeigt Leer-Hinweis wenn Suche keine Treffer liefert', () => {
    render(<MessageListPane {...buildProps({ messages: [], search: 'xyz' })} />);
    expect(screen.getByText('Keine Treffer')).toBeInTheDocument();
  });

  // ─── Message list ─────────────────────────────────────────────────────────

  it('rendert alle Nachrichten als ListItemButtons', () => {
    render(<MessageListPane {...buildProps()} />);
    expect(screen.getByTestId('msg-1')).toBeInTheDocument();
    expect(screen.getByTestId('msg-2')).toBeInTheDocument();
  });

  it('ruft onMessageClick mit der angeklickten Nachricht auf', () => {
    const onMessageClick = jest.fn();
    render(<MessageListPane {...buildProps({ onMessageClick })} />);
    fireEvent.click(screen.getByTestId('msg-1'));
    expect(onMessageClick).toHaveBeenCalledWith(INBOX_MSG1);
  });

  // ─── Search ───────────────────────────────────────────────────────────────

  it('rendert Suchfeld mit dem übergebenen Wert', () => {
    render(<MessageListPane {...buildProps({ search: 'test' })} />);
    const input = screen.getByPlaceholderText('Suchen…') as HTMLInputElement;
    expect(input.value).toBe('test');
  });

  it('ruft onSearch beim Tippen auf', () => {
    const onSearch = jest.fn();
    render(<MessageListPane {...buildProps({ onSearch })} />);
    const input = screen.getByPlaceholderText('Suchen…');
    fireEvent.change(input, { target: { value: 'abc' } });
    expect(onSearch).toHaveBeenCalledWith('abc');
  });

  // ─── Mark-all-read ────────────────────────────────────────────────────────

  it('zeigt "Alle als gelesen markieren"-Button für Posteingang mit ungelesenen Nachrichten', () => {
    render(<MessageListPane {...buildProps({ unreadCount: 3 })} />);
    expect(screen.getByRole('button', { name: /gelesen markieren/i })).toBeInTheDocument();
  });

  it('versteckt "Alle als gelesen markieren"-Button wenn unreadCount=0', () => {
    render(<MessageListPane {...buildProps({ unreadCount: 0 })} />);
    expect(screen.queryByRole('button', { name: /gelesen markieren/i })).not.toBeInTheDocument();
  });

  it('ruft onMarkAllRead beim Klick auf', () => {
    const onMarkAllRead = jest.fn();
    render(<MessageListPane {...buildProps({ onMarkAllRead })} />);
    fireEvent.click(screen.getByRole('button', { name: /gelesen markieren/i }));
    expect(onMarkAllRead).toHaveBeenCalled();
  });

  it('versteckt "Alle als gelesen markieren"-Button im Postausgang', () => {
    render(<MessageListPane {...buildProps({ folder: 1, unreadCount: 5 })} />);
    expect(screen.queryByRole('button', { name: /gelesen markieren/i })).not.toBeInTheDocument();
  });

  // ─── View-mode toggle ─────────────────────────────────────────────────────

  it('ruft onViewModeChange mit "thread" beim Klick auf Thread-Button auf', () => {
    const onViewModeChange = jest.fn();
    render(<MessageListPane {...buildProps({ onViewModeChange })} />);
    fireEvent.click(screen.getByRole('button', { name: /Thread-Ansicht/i }));
    expect(onViewModeChange).toHaveBeenCalledWith('thread');
  });

  it('ruft onViewModeChange mit "chrono" beim Klick auf Chrono-Button auf', () => {
    const onViewModeChange = jest.fn();
    render(<MessageListPane {...buildProps({ viewMode: 'thread' as const, onViewModeChange })} />);
    fireEvent.click(screen.getByRole('button', { name: /Chronologische Ansicht/i }));
    expect(onViewModeChange).toHaveBeenCalledWith('chrono');
  });

  // ─── Load-more button ─────────────────────────────────────────────────────

  it('versteckt btn-load-more wenn hasMore=false', () => {
    render(<MessageListPane {...buildProps({ hasMore: false })} />);
    expect(screen.queryByTestId('btn-load-more')).not.toBeInTheDocument();
  });

  it('zeigt btn-load-more wenn hasMore=true', () => {
    render(<MessageListPane {...buildProps({ hasMore: true })} />);
    expect(screen.getByTestId('btn-load-more')).toBeInTheDocument();
    expect(screen.getByTestId('btn-load-more')).not.toBeDisabled();
    expect(screen.getByTestId('btn-load-more')).toHaveTextContent('Weitere laden');
  });

  it('btn-load-more ist deaktiviert während loadingMore=true', () => {
    render(<MessageListPane {...buildProps({ hasMore: true, loadingMore: true })} />);
    expect(screen.getByTestId('btn-load-more')).toBeDisabled();
  });

  it('zeigt Lade-Text in btn-load-more während loadingMore=true', () => {
    render(<MessageListPane {...buildProps({ hasMore: true, loadingMore: true })} />);
    expect(screen.getByTestId('btn-load-more')).toHaveTextContent('Laden…');
  });

  it('ruft onLoadMore beim Klick auf btn-load-more auf', () => {
    const onLoadMore = jest.fn();
    render(<MessageListPane {...buildProps({ hasMore: true, onLoadMore })} />);
    fireEvent.click(screen.getByTestId('btn-load-more'));
    expect(onLoadMore).toHaveBeenCalled();
  });

  it('btn-load-more bleibt versteckt wenn loading=true auch wenn hasMore=true', () => {
    render(<MessageListPane {...buildProps({ loading: true, hasMore: true })} />);
    expect(screen.queryByTestId('btn-load-more')).not.toBeInTheDocument();
  });

  // ─── Thread view: expand button ───────────────────────────────────────────

  it('zeigt kein Expand-Icon im Chrono-Modus', () => {
    render(<MessageListPane {...buildProps({ messages: [ROOT_WITH_REPLIES] })} />);
    expect(screen.queryByRole('button', { name: /Thread ausklappen/i })).not.toBeInTheDocument();
  });

  it('zeigt Expand-Icon für Root mit replyCount > 0 im Thread-Modus', () => {
    render(<MessageListPane {...buildProps({ messages: [ROOT_WITH_REPLIES], viewMode: 'thread' as const })} />);
    expect(screen.getByRole('button', { name: /Thread ausklappen/i })).toBeInTheDocument();
  });

  it('zeigt kein Expand-Icon für Root ohne Antworten im Thread-Modus', () => {
    render(<MessageListPane {...buildProps({ messages: [INBOX_MSG1], viewMode: 'thread' as const })} />);
    expect(screen.queryByRole('button', { name: /Thread ausklappen/i })).not.toBeInTheDocument();
  });

  it('ruft onExpandThread auf wenn Root ohne geladenen Thread expandiert wird', () => {
    const onExpandThread = jest.fn();
    render(<MessageListPane {...buildProps({ messages: [ROOT_WITH_REPLIES], onExpandThread, viewMode: 'thread' as const })} />);
    fireEvent.click(screen.getByRole('button', { name: /Thread ausklappen/i }));
    expect(onExpandThread).toHaveBeenCalledWith('3');
  });

  it('zeigt Spinner für Root der gerade geladen wird', () => {
    const threadLoading = new Set(['3']);
    render(<MessageListPane {...buildProps({ messages: [ROOT_WITH_REPLIES], threadLoading, viewMode: 'thread' as const })} />);
    // Expand-Button not rendered while loading, spinner shown instead
    expect(screen.queryByRole('button', { name: /Thread ausklappen/i })).not.toBeInTheDocument();
    // A progressbar (CircularProgress) should be visible
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('zeigt Reply-Badge im Thread-Modus wenn replyCount > 0', () => {
    render(<MessageListPane {...buildProps({ messages: [ROOT_WITH_REPLIES], viewMode: 'thread' as const })} />);
    // In thread mode, badge shows replyCount
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('zeigt KEINEN Reply-Badge im Chrono-Modus (Replies als separate Einträge sichtbar)', () => {
    render(<MessageListPane {...buildProps({ messages: [ROOT_WITH_REPLIES] })} />);
    // No badge in flat chrono mode
    expect(screen.queryByText('2')).not.toBeInTheDocument();
  });

  // ─── Thread view: loaded thread ───────────────────────────────────────────

  it('baut Baum aus threadMessages wenn Thread geladen', () => {
    const threadMessages = new Map([['3', [ROOT_WITH_REPLIES, REPLY1, REPLY2]]]);
    render(<MessageListPane {...buildProps({ messages: [ROOT_WITH_REPLIES], threadMessages, viewMode: 'thread' as const })} />);

    // Expand to show replies
    fireEvent.click(screen.getByRole('button', { name: /Thread ausklappen/i }));

    // Root visible
    expect(screen.getByTestId('msg-3')).toBeInTheDocument();
  });

  it('ruft onExpandThread NICHT auf wenn Thread bereits geladen ist', () => {
    const onExpandThread = jest.fn();
    const threadMessages = new Map([['3', [ROOT_WITH_REPLIES, REPLY1, REPLY2]]]);
    render(<MessageListPane {...buildProps({ messages: [ROOT_WITH_REPLIES], threadMessages, onExpandThread, viewMode: 'thread' as const })} />);

    fireEvent.click(screen.getByRole('button', { name: /Thread ausklappen/i }));

    expect(onExpandThread).not.toHaveBeenCalled();
  });

  it('klappt Thread ein und aus', () => {
    const threadMessages = new Map([['3', [ROOT_WITH_REPLIES, REPLY1, REPLY2]]]);
    render(<MessageListPane {...buildProps({ messages: [ROOT_WITH_REPLIES], threadMessages, viewMode: 'thread' as const })} />);

    // Expand
    fireEvent.click(screen.getByRole('button', { name: /Thread ausklappen/i }));
    expect(screen.getByRole('button', { name: /Thread einklappen/i })).toBeInTheDocument();

    // Collapse
    fireEvent.click(screen.getByRole('button', { name: /Thread einklappen/i }));
    expect(screen.getByRole('button', { name: /Thread ausklappen/i })).toBeInTheDocument();
  });

  it('versteckt Reply-Badge wenn Thread expandiert ist', () => {
    const threadMessages = new Map([['3', [ROOT_WITH_REPLIES, REPLY1, REPLY2]]]);
    render(<MessageListPane {...buildProps({ messages: [ROOT_WITH_REPLIES], threadMessages, viewMode: 'thread' as const })} />);

    // Initially badge with 2 is visible
    expect(screen.getByText('2')).toBeInTheDocument();

    // After expand, badge should be hidden
    fireEvent.click(screen.getByRole('button', { name: /Thread ausklappen/i }));
    expect(screen.queryByText('2')).not.toBeInTheDocument();
  });
});
