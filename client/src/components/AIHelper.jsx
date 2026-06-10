import { useState } from 'react';
import axios from 'axios';

export default function AIHelper({ onClose }) {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResponse('');
    setError('');
    try {
      const { data } = await axios.post('/api/ai/search', { query: query.trim() });
      setResponse(data.response);
    } catch (err) {
      setError(err.response?.data?.error || 'AI service unavailable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-panel">
      <div className="ai-panel-header">
        <h3>AI Event Finder</h3>
        <button className="btn-icon-sm" onClick={onClose} aria-label="Close">×</button>
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
      {response && (
        <div className="ai-response">
          {response}
        </div>
      )}
    </div>
  );
}
