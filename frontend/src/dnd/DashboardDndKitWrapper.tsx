import React from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
  MeasuringStrategy,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { SortableWidget, useDragHandle } from './SortableWidget';
import { Box, useTheme } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import type { WidgetData } from '../services/dashboardWidgets';

interface DashboardDndKitWrapperProps {
  widgets: WidgetData[];
  onReorder: (widgets: WidgetData[]) => void;
  /** Render a widget. dragHandle must be placed in the widget header. */
  renderWidget: (
    widget: WidgetData,
    idx: number,
    isDragging: boolean,
    dragHandle: React.ReactNode,
  ) => React.ReactNode;
}

const measuring = {
  droppable: { strategy: MeasuringStrategy.Always },
};

/**
 * Bridge component: reads drag handle from SortableWidget's React context
 * and forwards it to the renderWidget callback.
 */
function SortedWidgetContent({
  widget,
  idx,
  renderWidget,
}: {
  widget: WidgetData;
  idx: number;
  renderWidget: DashboardDndKitWrapperProps['renderWidget'];
}) {
  const dragHandle = useDragHandle();
  return <>{renderWidget(widget, idx, false, dragHandle)}</>;
}

export const DashboardDndKitWrapper: React.FC<DashboardDndKitWrapperProps> = ({
  widgets,
  onReorder,
  renderWidget,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const gapPx = 16;

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 8 },
  });
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(pointerSensor, touchSensor, keyboardSensor);

  // Store activeId as the raw dnd-kit UniqueIdentifier (string | number)
  // to avoid type coercion mismatches with widget.id (which may be number at runtime).
  const [activeId, setActiveId] = React.useState<string | number | null>(null);
  const [overlaySize, setOverlaySize] = React.useState({ w: 300, h: 200 });

  // Ensure all widget IDs are strings for consistent comparison.
  // The API may return numeric IDs even though the TS type says string.
  const widgetIds = React.useMemo(() => widgets.map(w => String(w.id)), [widgets]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);

    // Measure the actual rendered size of the widget being dragged.
    // On the first render cycle this may still be null; we'll also
    // pick it up from the DOM below as a fallback.
    const rect = event.active.rect.current.initial;
    if (rect) {
      setOverlaySize({ w: rect.width, h: rect.height });
    } else {
      // Fallback: find the DOM node registered by useSortable and measure it directly
      const node = document.querySelector(`[data-sortable-id="${event.active.id}"]`);
      if (node) {
        const r = node.getBoundingClientRect();
        setOverlaySize({ w: r.width, h: r.height });
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      // Use loose string comparison to handle number/string ID mismatch
      const activeStr = String(active.id);
      const overStr = String(over.id);
      const oldIndex = widgets.findIndex(w => String(w.id) === activeStr);
      const newIndex = widgets.findIndex(w => String(w.id) === overStr);
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(arrayMove(widgets, oldIndex, newIndex));
      }
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  // Use String() on both sides for safe comparison
  const activeStr = activeId != null ? String(activeId) : null;
  const activeWidget = activeStr ? widgets.find(w => String(w.id) === activeStr) : null;
  const activeIndex = activeStr ? widgets.findIndex(w => String(w.id) === activeStr) : -1;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      measuring={measuring}
    >
      <SortableContext items={widgetIds} strategy={rectSortingStrategy}>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: `${gapPx}px`,
            width: '100%',
            alignItems: 'stretch',
          }}
        >
          {widgets.map((widget, idx) => {
            const cols = Math.min(12, Math.max(1, widget.width ?? 6));
            const percent = (cols / 12) * 100;
            const widgetWidth = isMobile
              ? '100%'
              : `calc(${percent}% - ${gapPx}px * ${1 - cols / 12})`;

            return (
              <Box
                key={widget.id}
                sx={{
                  width: { xs: '100%', sm: widgetWidth },
                  minWidth: 0,
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <SortableWidget id={String(widget.id)}>
                  <SortedWidgetContent
                    widget={widget}
                    idx={idx}
                    renderWidget={renderWidget}
                  />
                </SortableWidget>
              </Box>
            );
          })}
        </Box>
      </SortableContext>

      <DragOverlay
        adjustScale={false}
        zIndex={1400}
        dropAnimation={{
          duration: 250,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}
      >
        {activeWidget ? (
          <Box
            sx={{
              width: overlaySize.w,
              height: overlaySize.h,
              opacity: 0.92,
              transform: 'rotate(1.5deg)',
              boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
              borderRadius: 2,
              overflow: 'hidden',
              cursor: 'grabbing',
              pointerEvents: 'none',
            }}
          >
            {renderWidget(activeWidget, activeIndex, true, null)}
          </Box>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
