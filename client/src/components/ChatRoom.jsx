import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export default function ChatRoom({ eventId, token, user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    const socket = io('/', { auth: { token } });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_event', eventId);
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('chat_history', (history) => setMessages(history));

    socket.on('new_message', (msg) => setMessages(prev => [...prev, msg]));

    socket.on('connect_error', (err) => console.error('socket error:', err.message));

    return () => {
      socket.emit('leave_event', eventId);
      socket.disconnect();
    };
  }, [eventId, token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !socketRef.current?.connected) return;
    socketRef.current.emit('send_message', { eventId, message: input.trim() });
    setInput('');
  };

  if (!token) {
    return <p className="empty-msg">Log in to join the chat</p>;
  }

  return (
    <div className="chatroom">
      <div className="chat-status">
        <span className={`status-dot ${connected ? 'online' : 'offline'}`} />
        {connected ? 'Live' : 'Connecting...'}
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <p className="empty-msg">No messages yet. Say hello!</p>
        )}
        {messages.map(m => (
          <div key={m.id} className={`chat-msg${m.user_id === user?.id ? ' own' : ''}`}>
            {m.user_id !== user?.id && (
              <span className="chat-username">{m.username}</span>
            )}
            <div className="chat-bubble">{m.message}</div>
            <span className="chat-time">
              {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form className="chat-input-row" onSubmit={sendMessage}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={!connected}
        />
        <button type="submit" className="btn btn-primary" disabled={!connected}>
          Send
        </button>
      </form>
    </div>
  );
}
