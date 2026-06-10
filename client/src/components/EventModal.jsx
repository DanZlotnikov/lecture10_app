import { useState, useEffect } from 'react';
import axios from 'axios';
import ChatRoom from './ChatRoom';

const CATEGORIES = ['general', 'music', 'sports', 'food', 'art', 'tech', 'outdoor'];

function toDatetimeLocal(val) {
  if (!val) return '';
  return new Date(val).toISOString().slice(0, 16);
}

export default function EventModal({ event, position, token, user, onClose, onCreated, onUpdated, onDeleted }) {
  const isNew = !event;
  const [mode, setMode] = useState(isNew ? 'create' : 'view');
  const [form, setForm] = useState({
    title: event?.title || '',
    description: event?.description || '',
    event_date: toDatetimeLocal(event?.event_date),
    category: event?.category || 'general',
  });
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState('comments');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (event) fetchComments();
  }, [event]);

  const fetchComments = async () => {
    try {
      const { data } = await axios.get(`/api/comments/${event.id}`);
      setComments(data);
    } catch {}
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post(
        '/api/events',
        { ...form, lat: position.lat, lng: position.lng },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onCreated();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.put(`/api/events/${event.id}`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onUpdated();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update event');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${event.title}"?`)) return;
    try {
      await axios.delete(`/api/events/${event.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onDeleted();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete event');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await axios.post(
        `/api/comments/${event.id}`,
        { content: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewComment('');
      fetchComments();
    } catch {}
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await axios.delete(`/api/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchComments();
    } catch {}
  };

  const isOwner = event && user && event.creator_id === user.id;

  const EventForm = ({ onSubmit, submitLabel }) => (
    <form onSubmit={onSubmit} className="event-form">
      {error && <div className="error-msg">{error}</div>}
      <input
        placeholder="Event title *"
        value={form.title}
        onChange={e => setForm({ ...form, title: e.target.value })}
        required
      />
      <textarea
        placeholder="Description (optional)"
        value={form.description}
        onChange={e => setForm({ ...form, description: e.target.value })}
        rows={3}
      />
      <input
        type="datetime-local"
        value={form.event_date}
        onChange={e => setForm({ ...form, event_date: e.target.value })}
        required
      />
      <select
        value={form.category}
        onChange={e => setForm({ ...form, category: e.target.value })}
      >
        {CATEGORIES.map(c => (
          <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
        ))}
      </select>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving...' : submitLabel}
        </button>
        {mode === 'edit' && (
          <button type="button" className="btn btn-outline" onClick={() => setMode('view')}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>

        {mode === 'create' && (
          <>
            <h2>New Event</h2>
            <p className="location-hint">
              {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
            </p>
            <EventForm onSubmit={handleCreate} submitLabel="Create Event" />
          </>
        )}

        {mode === 'view' && event && (
          <>
            <div className="event-view-header">
              <div>
                <span className={`category-badge cat-${event.category}`}>{event.category}</span>
                <h2>{event.title}</h2>
                <p className="event-meta">
                  {new Date(event.event_date).toLocaleString()} &middot; by {event.creator_name}
                </p>
              </div>
              {isOwner && (
                <div className="event-owner-actions">
                  <button className="btn btn-outline" onClick={() => setMode('edit')}>Edit</button>
                  <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
                </div>
              )}
            </div>

            {event.description && <p className="event-desc">{event.description}</p>}
            {error && <div className="error-msg">{error}</div>}

            <div className="tabs">
              <button
                className={`tab${activeTab === 'comments' ? ' active' : ''}`}
                onClick={() => setActiveTab('comments')}
              >
                Comments ({comments.length})
              </button>
              <button
                className={`tab${activeTab === 'chat' ? ' active' : ''}`}
                onClick={() => setActiveTab('chat')}
              >
                Live Chat
              </button>
            </div>

            {activeTab === 'comments' ? (
              <div className="comments-section">
                <div className="comments-list">
                  {comments.length === 0 && <p className="empty-msg">No comments yet. Be the first!</p>}
                  {comments.map(c => (
                    <div key={c.id} className="comment">
                      <div className="comment-header">
                        <strong>{c.username}</strong>
                        <span className="comment-time">{new Date(c.created_at).toLocaleString()}</span>
                        {user && c.user_id === user.id && (
                          <button className="btn-icon-sm" onClick={() => handleDeleteComment(c.id)} title="Delete">×</button>
                        )}
                      </div>
                      <p>{c.content}</p>
                    </div>
                  ))}
                </div>
                {token ? (
                  <form className="comment-form" onSubmit={handleAddComment}>
                    <input
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary">Post</button>
                  </form>
                ) : (
                  <p className="empty-msg">Log in to comment</p>
                )}
              </div>
            ) : (
              <ChatRoom eventId={event.id} token={token} user={user} />
            )}
          </>
        )}

        {mode === 'edit' && event && (
          <>
            <h2>Edit Event</h2>
            <EventForm onSubmit={handleUpdate} submitLabel="Save Changes" />
          </>
        )}
      </div>
    </div>
  );
}
