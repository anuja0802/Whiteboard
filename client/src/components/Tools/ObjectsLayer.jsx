// ObjectsLayer.jsx — clean version
import { useCallback } from 'react';
import useObjectsStore from '../../store/objectsStore';
import useCanvasStore from '../../store/canvasStore';
import useHistoryStore from '../../store/historyStore';
import socket from '../../socket/socket';
import StickyNote from './StickyNote';
import Shape from './Shape';
import Arrow from './Arrow';

// Debounce for updates
function debounce(fn, delay) {
  const timers = {};
  return (id, ...args) => {
    clearTimeout(timers[id]);
    timers[id] = setTimeout(() => { fn(id, ...args); delete timers[id]; }, delay);
  };
}

const debouncedUpdateEmit = debounce((id, updates) => {
  socket.emit('object-update', { id, updates });
}, 100);

export default function ObjectsLayer() {
  const { objects, clearSelected } = useObjectsStore();
  const tool = useCanvasStore(state => state.tool);

  const updateAndBroadcast = useCallback((id, updates) => {
    useObjectsStore.getState().updateObject(id, updates);
    debouncedUpdateEmit(id, updates);
  }, []);

  const removeAndBroadcast = useCallback((id) => {
    const obj = useObjectsStore.getState().objects[id];
    useObjectsStore.getState().clearSelected();
    useObjectsStore.getState().removeObject(id);
    socket.emit('object-remove', { id });
    if (obj) {
      useHistoryStore.getState().push({ type: 'object-remove', object: obj });
    }
  }, []);

  const handleLayerClick = useCallback(() => {
    clearSelected();
  }, [clearSelected]);

  return (
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