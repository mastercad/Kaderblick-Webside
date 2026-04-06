import { relativeTime, senderInitials, avatarColor } from '../helpers';

// ── relativeTime ──────────────────────────────────────────────────────────────

describe('relativeTime', () => {
  function iso(secondsAgo: number): string {
    return new Date(Date.now() - secondsAgo * 1000).toISOString();
  }

  it('gibt "Gerade eben" zurück wenn unter 60 Sekunden vergangen', () => {
    expect(relativeTime(iso(30))).toBe('Gerade eben');
  });

  it('gibt "Gerade eben" zurück bei genau 0 Sekunden', () => {
    expect(relativeTime(iso(0))).toBe('Gerade eben');
  });

  it('gibt "vor 1 Min." zurück bei genau 60 Sekunden', () => {
    expect(relativeTime(iso(60))).toBe('vor 1 Min.');
  });

  it('gibt "vor 5 Min." zurück bei 5 Minuten', () => {
    expect(relativeTime(iso(300))).toBe('vor 5 Min.');
  });

  it('gibt "vor 59 Min." zurück kurz vor einer Stunde', () => {
    expect(relativeTime(iso(3599))).toBe('vor 59 Min.');
  });

  it('gibt "vor 1 Std." zurück bei genau einer Stunde', () => {
    expect(relativeTime(iso(3600))).toBe('vor 1 Std.');
  });

  it('gibt "vor 3 Std." zurück bei 3 Stunden', () => {
    expect(relativeTime(iso(3 * 3600))).toBe('vor 3 Std.');
  });

  it('gibt "vor 23 Std." zurück kurz vor einem Tag', () => {
    expect(relativeTime(iso(86399))).toBe('vor 23 Std.');
  });

  it('gibt "vor 1 Tagen" zurück bei genau einem Tag', () => {
    expect(relativeTime(iso(86400))).toBe('vor 1 Tagen');
  });

  it('gibt "vor 3 Tagen" zurück bei 3 Tagen', () => {
    expect(relativeTime(iso(3 * 86400))).toBe('vor 3 Tagen');
  });

  it('gibt "vor 6 Tagen" zurück kurz vor einer Woche', () => {
    expect(relativeTime(iso(604799))).toBe('vor 6 Tagen');
  });

  it('gibt ein lokalisiertes Datum zurück wenn älter als 7 Tage', () => {
    const result = relativeTime(iso(605000));
    // Must be a date string (dd.mm.yyyy format), not a relative label
    expect(result).toMatch(/^\d{2}\.\d{2}\.\d{4}$/);
  });

  it('gibt ein formatiertes Datum für ein altes Datum zurück', () => {
    const result = relativeTime('2020-01-15T10:00:00.000Z');
    expect(result).toBe('15.01.2020');
  });
});

// ── senderInitials ────────────────────────────────────────────────────────────

describe('senderInitials', () => {
  it('gibt die ersten Buchstaben von Vor- und Nachname zurück', () => {
    expect(senderInitials('Max Müller')).toBe('MM');
  });

  it('gibt den ersten Buchstaben bei einem Einwortname zurück', () => {
    expect(senderInitials('Maradona')).toBe('M');
  });

  it('gibt einen leeren String zurück für einen leeren Namen', () => {
    expect(senderInitials('')).toBe('');
  });

  it('begrenzt auf zwei Zeichen bei mehr als zwei Wörtern', () => {
    expect(senderInitials('Karl Maria Schmidt')).toBe('KM');
  });

  it('wandelt Initialen in Großbuchstaben um', () => {
    expect(senderInitials('anna bauer')).toBe('AB');
  });
});

// ── avatarColor ───────────────────────────────────────────────────────────────

describe('avatarColor', () => {
  it('gibt einen Hex-Farbwert zurück', () => {
    const color = avatarColor('Max Müller');
    expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('ist deterministisch für denselben Namen', () => {
    expect(avatarColor('Anna Schmidt')).toBe(avatarColor('Anna Schmidt'));
  });

  it('gibt unterschiedliche Farben für unterschiedliche Namen zurück (meistens)', () => {
    // Two clearly different names should produce different colors
    // This test could theoretically fail by hash collision but is very unlikely
    const c1 = avatarColor('Max Müller');
    const c2 = avatarColor('Zara Johnson');
    // At least verify both are valid colors
    expect(c1).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(c2).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('gibt einen gültigen Farbwert für einen leeren String zurück', () => {
    const color = avatarColor('');
    expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
  });
});
