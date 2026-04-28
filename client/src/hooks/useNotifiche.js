import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "../components/api";

const NOTIFICHE_EVENT = "notifiche-changed";

export function broadcastNotificheChanged() {
  window.dispatchEvent(new CustomEvent(NOTIFICHE_EVENT));
}

/**
 * Polling delle notifiche non lette.
 * Admin: conta rapporti in_attesa.
 * Operatore: conta notifiche non lette (approvazioni/rifiuti).
 * Si aggiorna anche quando viene emesso l'evento notifiche-changed.
 */
export default function useNotifiche(auth, intervalMs = 10000) {
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(() => {
    if (!auth?.token) {
      setCount(0);
      return;
    }
    apiFetch("/notifiche/count")
      .then((data) => setCount(data.count || 0))
      .catch(() => {});
  }, [auth?.token]);

  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, intervalMs);
    window.addEventListener(NOTIFICHE_EVENT, fetchCount);
    return () => {
      clearInterval(id);
      window.removeEventListener(NOTIFICHE_EVENT, fetchCount);
    };
  }, [fetchCount, intervalMs]);

  return { count, refresh: fetchCount };
}
