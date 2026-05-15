// WebSocket hook for NammaRoad live updates
import { useCallback, useEffect, useRef, useState } from "react";

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL || "";

export type WSEvent =
  | { type: "hello"; message: string }
  | { type: "pothole_created"; pothole_id: string; zone: string; status: string; severity: string }
  | { type: "status_updated"; pothole_id: string; old_status: string; new_status: string; updated_by: string }
  | { type: "upvoted"; pothole_id: string; upvotes: number };

/**
 * Subscribe to backend WebSocket. Calls `onEvent` whenever a relevant event arrives.
 * Returns { connected } for showing a "Live" indicator.
 */
export function useLiveUpdates(onEvent?: (e: WSEvent) => void) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handlerRef = useRef(onEvent);

  // Keep the latest handler without re-opening the socket
  useEffect(() => {
    handlerRef.current = onEvent;
  }, [onEvent]);

  const connect = useCallback(() => {
    if (!BASE) return;
    // Convert https://...  -> wss://.../api/ws
    const wsUrl = BASE.replace(/^http/, "ws") + "/api/ws";
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        // Auto-reconnect after 3s
        if (reconnectRef.current) clearTimeout(reconnectRef.current);
        reconnectRef.current = setTimeout(connect, 3000);
      };
      ws.onerror = () => {
        // onclose will also fire and trigger reconnect
      };
      ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data) as WSEvent;
          handlerRef.current?.(data);
        } catch {}
      };
    } catch {
      // schedule retry
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      reconnectRef.current = setTimeout(connect, 3000);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect]);

  return { connected };
}
