/**
 * Unit-Tests für eventHelpers.ts
 *
 * getUserLabel:
 *  – gibt fullName zurück wenn kein context
 *  – hängt context in Klammern an fullName
 *  – baut Namen aus firstName + lastName wenn kein fullName
 *  – hängt context auch an firstName-lastName-Kombination
 *  – gibt "User #<id>" zurück wenn kein Name vorhanden
 *  – hängt context auch an "User #<id>"
 *  – firstName allein (kein lastName)
 *  – lastName allein (kein firstName)
 */

import { getUserLabel } from '../eventHelpers';
import { User } from '../../types/event';

describe('getUserLabel', () => {
  // ──────────────────────────────────────────────────────────────────────────
  //  Nur Name, kein context
  // ──────────────────────────────────────────────────────────────────────────

  it('gibt fullName zurück wenn kein context gesetzt', () => {
    const user: User = { id: 1, fullName: 'Max Mustermann' };
    expect(getUserLabel(user)).toBe('Max Mustermann');
  });

  it('gibt firstName + lastName zurück wenn kein fullName und kein context', () => {
    const user: User = { id: 2, firstName: 'Anna', lastName: 'Schmidt' };
    expect(getUserLabel(user)).toBe('Anna Schmidt');
  });

  it('gibt nur firstName zurück wenn kein lastName und kein fullName', () => {
    const user: User = { id: 3, firstName: 'Peter' };
    expect(getUserLabel(user)).toBe('Peter');
  });

  it('gibt nur lastName zurück wenn kein firstName und kein fullName', () => {
    const user: User = { id: 4, lastName: 'Müller' };
    expect(getUserLabel(user)).toBe('Müller');
  });

  it('gibt "User #<id>" zurück wenn kein Name gesetzt', () => {
    const user: User = { id: 99 };
    expect(getUserLabel(user)).toBe('User #99');
  });

  // ──────────────────────────────────────────────────────────────────────────
  //  Mit context
  // ──────────────────────────────────────────────────────────────────────────

  it('hängt context in Klammern an fullName', () => {
    const user: User = { id: 1, fullName: 'Max Mustermann', context: 'Spieler · U17' };
    expect(getUserLabel(user)).toBe('Max Mustermann (Spieler · U17)');
  });

  it('hängt context an firstName-lastName-Kombination', () => {
    const user: User = { id: 2, firstName: 'Anna', lastName: 'Schmidt', context: 'Trainer · 1. Mannschaft' };
    expect(getUserLabel(user)).toBe('Anna Schmidt (Trainer · 1. Mannschaft)');
  });

  it('hängt context auch an User-#id-Fallback', () => {
    const user: User = { id: 5, context: 'Spieler · Reserve' };
    expect(getUserLabel(user)).toBe('User #5 (Spieler · Reserve)');
  });

  it('hängt context mit Pipe-Trenner an wenn mehrere Kontexte', () => {
    const user: User = {
      id: 10,
      fullName: 'Lisa Muster',
      context: 'Spieler · U17 | Spieler · Reserve',
    };
    expect(getUserLabel(user)).toBe('Lisa Muster (Spieler · U17 | Spieler · Reserve)');
  });

  // ──────────────────────────────────────────────────────────────────────────
  //  Grenzfälle
  // ──────────────────────────────────────────────────────────────────────────

  it('ignoriert leeren context-String – zeigt keinen Klammer-Anhang', () => {
    const user: User = { id: 1, fullName: 'Hans Groß', context: '' };
    // Empty string is falsy → no parentheses
    expect(getUserLabel(user)).toBe('Hans Groß');
  });
});
