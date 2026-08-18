import { useCallback, useRef, useState } from 'react';

let idCounter = 0;

export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const pushToast = useCallback((message, variant = 'success') => {
    const id = ++idCounter;
    setToasts((current) => [...current, { id, message, variant }]);
    timers.current[id] = setTimeout(() => removeToast(id), 4000);
  }, [removeToast]);

  return { toasts, pushToast, removeToast };
}
