import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TacticsBar } from '../TacticsBar';
import type { TacticEntry } from '../types';

const tactics: TacticEntry[] = [
  { id: 'a', name: 'Pressing', elements: [], opponents: [] },
  { id: 'b', name: 'Konter',   elements: [], opponents: [] },
];

const noop = jest.fn();

const defaultProps = {
  tactics,
  activeTacticId: 'a',
  renamingId: null,
  renameValue: '',
  onSelect: noop,
  onNew: noop,
  onDelete: noop,
  onStartRename: noop,
  onRenameChange: noop,
  onConfirmRename: noop,
  onCancelRename: noop,
};

beforeEach(() => jest.clearAllMocks());

describe('TacticsBar', () => {
  it('renders all tactic pill names', () => {
    render(<TacticsBar {...defaultProps} />);
    expect(screen.getByText('Pressing')).toBeInTheDocument();
    expect(screen.getByText('Konter')).toBeInTheDocument();
  });

  it('clicking a pill calls onSelect with the correct id', () => {
    const onSelect = jest.fn();
    render(<TacticsBar {...defaultProps} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Konter'));
    expect(onSelect).toHaveBeenCalledWith('b');
  });

  it('shows delete buttons when there are multiple tactics', () => {
    render(<TacticsBar {...defaultProps} />);
    const deleteButtons = screen.getAllByText('×');
    expect(deleteButtons).toHaveLength(2);
  });

  it('hides delete buttons when only one tactic remains', () => {
    render(<TacticsBar {...defaultProps} tactics={[tactics[0]]} />);
    expect(screen.queryByText('×')).not.toBeInTheDocument();
  });

  it('clicking × calls onDelete (and not onSelect)', () => {
    const onDelete = jest.fn();
    const onSelect = jest.fn();
    render(<TacticsBar {...defaultProps} onDelete={onDelete} onSelect={onSelect} />);
    const [firstDelete] = screen.getAllByText('×');
    fireEvent.click(firstDelete);
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('"+ Neue Taktik" button calls onNew', () => {
    const onNew = jest.fn();
    render(<TacticsBar {...defaultProps} onNew={onNew} />);
    fireEvent.click(screen.getByText('+ Neue Taktik'));
    expect(onNew).toHaveBeenCalledTimes(1);
  });

  it('double-clicking tactic text calls onStartRename with id and name', () => {
    const onStartRename = jest.fn();
    render(<TacticsBar {...defaultProps} onStartRename={onStartRename} />);
    fireEvent.doubleClick(screen.getByText('Pressing'));
    expect(onStartRename).toHaveBeenCalledWith('a', 'Pressing');
  });

  it('renders an inline input when renamingId matches a tactic', () => {
    render(<TacticsBar {...defaultProps} renamingId="a" renameValue="Neuer Name" />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('Neuer Name');
  });

  it('pressing Enter on the rename input calls onConfirmRename', () => {
    const onConfirmRename = jest.fn();
    render(<TacticsBar {...defaultProps} renamingId="a" renameValue="X" onConfirmRename={onConfirmRename} />);
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    expect(onConfirmRename).toHaveBeenCalledTimes(1);
  });

  it('pressing Escape on the rename input calls onCancelRename', () => {
    const onCancelRename = jest.fn();
    render(<TacticsBar {...defaultProps} renamingId="a" renameValue="X" onCancelRename={onCancelRename} />);
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });
    expect(onCancelRename).toHaveBeenCalledTimes(1);
  });
});
