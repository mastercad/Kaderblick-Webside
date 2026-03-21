import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import IconButton from '@mui/material/IconButton';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

interface SortableWidgetProps {
  id: string;
  children: React.ReactNode;
}

/** Context that provides the drag handle to any descendant */
const SortableDragHandleCtx = React.createContext<React.ReactNode>(null);

/** Hook for children (e.g. DashboardWidget) to get the drag handle */
export function useDragHandle(): React.ReactNode {
  return React.useContext(SortableDragHandleCtx);
}

/**
 * Wraps children in a sortable div. This div owns the setNodeRef + transform.
 * Drag listeners are placed on a drag-handle icon rendered in the header.
 * The drag handle is exposed via React context so DashboardWidget can read it.
 */
export function SortableWidget({ id, children }: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const style: React.CSSProperties = {
    // All items (including active) get the list-reorder transform.
    // DragOverlay separately renders a cursor-following ghost.
    transform: CSS.Translate.toString(transform),
    transition: transition ?? undefined,
    // Fade the in-place original while DragOverlay shows the ghost
    opacity: isDragging ? 0.25 : 1,
    height: '100%',
  };

  const dragHandle = (
    <IconButton
      {...listeners}
      {...attributes}
      size={isMobile ? 'small' : 'medium'}
      sx={{
        cursor: isDragging ? 'grabbing' : 'grab',
        color: 'text.secondary',
        '&:hover': { color: 'primary.main', backgroundColor: 'action.hover' },
        touchAction: 'none',
        minWidth: { xs: 32, sm: 40 },
        height: { xs: 32, sm: 40 },
        padding: { xs: 0.5, sm: 1 },
      }}
      title="Widget verschieben"
    >
      <DragIndicatorIcon fontSize={isMobile ? 'small' : 'medium'} />
    </IconButton>
  );

  return (
    <div ref={setNodeRef} style={style} data-sortable-id={id}>
      <SortableDragHandleCtx.Provider value={dragHandle}>
        {children}
      </SortableDragHandleCtx.Provider>
    </div>
  );
}
