import { useEffect, useRef, useState } from "react";
import { HiX, HiOutlinePaperAirplane } from "react-icons/hi";
import { createRideSocket } from "../../lib/socket";
import { getMessages } from "../../services/chatService";
import { useAuth } from "../../context/AuthContext";

/** Slide-over chat panel for a single ride, backed by Socket.io in real time. */
export default function ChatPanel({ rideId, onClose }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const history = await getMessages(rideId);
        if (!cancelled) setMessages(history);
      } catch {
        if (!cancelled) setError("Couldn't load chat history.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    const socket = createRideSocket();
    socketRef.current = socket;
    socket.connect();

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("ride:join", { rideId }, (ack) => {
        if (!ack?.success) setError(ack?.message || "Couldn't join this ride's chat.");
      });
    });

    socket.on("connect_error", () => {
      setConnected(false);
      setError("Couldn't connect to chat. Please try again.");
    });

    socket.on("chat:message", (message) => {
      setMessages((cur) => [...cur, message]);
    });

    socket.on("chat:typing", ({ userId, name }) => {
      if (userId === user?._id) return;
      setTypingUser(name);
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => setTypingUser(null), 2000);
    });

    return () => {
      cancelled = true;
      socket.emit("ride:leave", { rideId });
      socket.disconnect();
      clearTimeout(typingTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rideId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = (e) => {
    e.preventDefault();
    if (!text.trim() || !socketRef.current) return;
    socketRef.current.emit("chat:send", { rideId, text: text.trim() }, (ack) => {
      if (!ack?.success) setError(ack?.message || "Message failed to send.");
    });
    setText("");
  };

  const handleTyping = () => {
    socketRef.current?.emit("chat:typing", { rideId });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div className="flex h-full w-full max-w-sm flex-col bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[var(--color-line)]/10 px-5 py-4">
          <div>
            <p className="font-display text-lg font-semibold text-[var(--color-ink)]">Ride chat</p>
            <p className="text-xs text-[var(--color-line)]">{connected ? "Connected" : "Connecting…"}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-[var(--color-paper-dim)]">
            <HiX className="h-5 w-5 text-[var(--color-line)]" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-route)] border-t-transparent" />
            </div>
          ) : messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--color-line)]">No messages yet. Say hello!</p>
          ) : (
            messages.map((m) => {
              const mine = m.sender?._id === user?._id;
              return (
                <div key={m._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${mine ? "bg-[var(--color-ink)] text-[var(--color-paper)]" : "bg-[var(--color-paper-dim)] text-[var(--color-ink)]"}`}>
                    {!mine && <p className="mb-0.5 text-xs font-semibold opacity-70">{m.sender?.name}</p>}
                    <p>{m.text}</p>
                  </div>
                </div>
              );
            })
          )}
          {typingUser && <p className="text-xs italic text-[var(--color-line)]">{typingUser} is typing…</p>}
          <div ref={bottomRef} />
        </div>

        {error && <p className="px-5 pb-2 text-xs text-[var(--color-alert)]">{error}</p>}

        <form onSubmit={send} className="flex items-center gap-2 border-t border-[var(--color-line)]/10 p-4">
          <input
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              handleTyping();
            }}
            placeholder="Type a message…"
            className="flex-1 rounded-full border border-[var(--color-line)]/25 px-4 py-2 text-sm outline-none focus:border-[var(--color-route)]"
          />
          <button type="submit" disabled={!text.trim()} className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-route)] text-white disabled:opacity-40">
            <HiOutlinePaperAirplane className="h-4 w-4 rotate-90" />
          </button>
        </form>
      </div>
    </div>
  );
}
