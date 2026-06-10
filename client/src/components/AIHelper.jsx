import { useState } from 'react';
import axios from 'axios';

export default function AIHelper({ onClose, onHighlight }) {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [matchCount, setMatchCount] = useState(0);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResponse('');
    setError('');
    setMatchCount(0);
    onHighlight?.([]);
    try {
      const { data } = await axios.post('/api/ai/search', { query: query.trim() });
      setResponse(data.response);
      // Extract all event IDs mentioned as [ID:X] or "ID:X" or "IDs 2, 4, and 8" patterns
      const ids = [...data.response.matchAll(/\bID[:\s]+(\d+)\b/gi)]
        .map(m => parseInt(m[1]))
        .filter((id, i, arr) => arr.indexOf(id) === i); // deduplicate
      setMatchCount(ids.length);
      if (ids.length > 0) onHighlight?.(ids);
    } catch (err) {
      setError(err.response?.data?.error || 'AI service unavailable');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onHighlight?.([]);
    onClose();
  };

  return (
    <div className="ai-panel">
      <div className="ai-panel-header">
        <h3>AI Event Finder</h3>
        <button className="btn-icon-sm" onClick={handleClose} aria-label="Close">×</button>
      </div>
      <p className="ai-hint">
        Ask anything — "outdoor music events this weekend", "tech meetups", "food near the park"...
      </p>
      <form className="ai-form" onSubmit={handleSearch}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="What are you looking for?"
          autoFocus
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? '...' : 'Search'}
        </button>
      </form>

      {loading && <div className="ai-thinking">AI is searching...</div>}
      {error && <div className="error-msg">{error}</div>}
      {matchCount > 0 && (
        <div className="ai-match-badge">
          {matchCount} event{matchCount !== 1 ? 's' : ''} highlighted on the map
        </div>
      )}
      {response && (
        <div className="ai-response">{response}</div>
      )}
    </div>
  );
}
