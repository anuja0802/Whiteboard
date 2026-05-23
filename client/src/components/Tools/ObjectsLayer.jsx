// ObjectsLayer.jsx — full rewrite
import { useCallback } from 'react';
import useObjectsStore from '../../store/objectsStore';
import useCanvasStore from '../../store/canvasStore';
import { useObjects } from '../../hooks/useObjects';
import StickyNote from './StickyNote';
import Shape from './Shape';
import Arrow from './Arrow';

export default function ObjectsLayer() {
  const { objects, clearSelected } = useObjectsStore();
  const { tool } = useCanvasStore();
  const { updateAndBroadcast, removeAndBroadcast } = useObjects();

  const handleLayerClick = useCallback(() => {
    clearSelected();
  }, [clearSelected]);

  return (
    // The container div is always pointer-events: none
    // Individual objects control their OWN pointer events
    // This way delete buttons always work regardless of tool
    <div
      className="absolute inset-0"
      style={{ zIndex: 20, pointerEvents: 'none' }}
      onClick={handleLayerClick}
    >
      {Object.values(objects).map((obj) => {
        const props = {
          key: obj.id,
          obj,
          onUpdate: updateAndBroadcast,
          onRemove: removeAndBroadcast,
          // Pass current tool so each object decides its own behavior
          currentTool: tool,
        };

        if (obj.type === 'sticky') return <StickyNote {...props} />;
        if (obj.type === 'rect' || obj.type === 'circle') return <Shape {...props} />;
        if (obj.type === 'arrow') return <Arrow {...props} />;
        return null;
      })}
    </div>
  );
}