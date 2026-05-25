import { useEffect } from 'react';
import useHistoryStore from '../store/historyStore';
import useCanvasStore from '../store/canvasStore';
import useObjectsStore from '../store/objectsStore';
import socket from '../socket/socket';

function applyUndo(command) {
  const cs = useCanvasStore.getState();
  const os = useObjectsStore.getState();
  if (command.type === 'stroke-add')
    cs.undoStroke(command.stroke.id);
  else if (command.type === 'stroke-remove')
    cs.addStroke(command.stroke);
  else if (command.type === 'object-add')
    os.removeObject(command.object.id);
  else if (command.type === 'object-remove')
    os.addObject(command.object);
  else if (command.type === 'object-update')
    os.updateObject(command.id, command.before);
}

function applyRedo(command) {
  const cs = useCanvasStore.getState();
  const os = useObjectsStore.getState();
  if (command.type === 'stroke-add')
    cs.addStroke(command.stroke);
  else if (command.type === 'stroke-remove')
    cs.undoStroke(command.stroke.id);
  else if (command.type === 'object-add')
    os.addObject(command.object);
  else if (command.type === 'object-remove')
    os.removeObject(command.object.id);
  else if (command.type === 'object-update')
    os.updateObject(command.id, command.after);
}

export function performUndo() {
  const command = useHistoryStore.getState().popPast();
  if (!command) return;
  applyUndo(command);
  socket.emit('history-undo', { command });
}

export function performRedo() {
  const command = useHistoryStore.getState().popFuture();
  if (!command) return;
  applyRedo(command);
  socket.emit('history-redo', { command });
}

export function useHistory() {
  const past = useHistoryStore(state => state.past);
  const future = useHistoryStore(state => state.future);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); performUndo(); }
      if (e.key === 'y')                { e.preventDefault(); performRedo(); }
      if (e.key === 'z' && e.shiftKey)  { e.preventDefault(); performRedo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Socket listeners for remote undo/redo
  useEffect(() => {
    const onUndo = ({ command }) => applyUndo(command);
    const onRedo = ({ command }) => applyRedo(command);
    socket.on('history-undo', onUndo);
    socket.on('history-redo', onRedo);
    return () => {
      socket.off('history-undo', onUndo);
      socket.off('history-redo', onRedo);
    };
  }, []);

  return {
    undo: performUndo,
    redo: performRedo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}