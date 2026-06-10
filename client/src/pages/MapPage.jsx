import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import EventModal from '../components/EventModal';
import AIHelper from '../components/AIHelper';

// Fix Leaflet's broken default icon paths under Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

export default function MapPage() {
  const { token, user } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newEventPos, setNewEventPos] = useState(null);
  const [showAI, setShowAI] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  };

  const fetchEvents = async () => {
    try {
      const { data } = await axios.get('/api/events');
      setEvents(data);
    } catch (err) {
      console.error('Failed to fetch events', err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Real-time: listen for new events added by other users
  useEffect(() => {
    const socket = io('/', token ? { auth: { token } } : {});
    socket.on('new_event', (event) => {
      setEvents(prev => prev.find(e => e.id === event.id) ? prev : [...prev, event]);
      showToast(`New event added: "${event.title}"`);
    });
    return () => socket.disconnect();
  }, [token]);

  const handleMapClick = (latlng) => {
    if (!token) return;
    setSelectedEvent(null);
    setNewEventPos(latlng);
  };

  const handleMarkerClick = (event) => {
    setNewEventPos(null);
    setSelectedEvent(event);
  };

  const closeModal = () => {
    setSelectedEvent(null);
    setNewEventPos(null);
  };

  return (
    <div className="map-page">
      <div className="map-controls">
        <button className="btn btn-primary" onClick={() => setShowAI(!showAI)}>
          {showAI ? 'Close AI Helper' : 'AI Event Finder'}
        </button>
        {token
          ? <span className="hint">Click anywhere on the map to add an event</span>
          : <span className="hint">Log in to add events</span>
        }
      </div>

      {showAI && <AIHelper onClose={() => setShowAI(false)} />}

      {toast && <div className="toast">{toast}</div>}

      <MapContainer
        center={[32.0853, 34.7818]}
        zoom={13}
        className="map-container"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onMapClick={handleMapClick} />

        {events.map(event => (
          <Marker
            key={event.id}
            position={[parseFloat(event.lat), parseFloat(event.lng)]}
            eventHandlers={{ click: () => handleMarkerClick(event) }}
          >
            <Popup>
              <strong>{event.title}</strong>
              <br />
              <small>{event.category} · {new Date(event.event_date).toLocaleDateString()}</small>
            </Popup>
          </Marker>
        ))}

        {newEventPos && (
          <Marker position={[newEventPos.lat, newEventPos.lng]}>
            <Popup>New event here</Popup>
          </Marker>
        )}
      </MapContainer>

      {(selectedEvent || newEventPos) && (
        <EventModal
          event={selectedEvent}
          position={newEventPos}
          token={token}
          user={user}
          onClose={closeModal}
          onCreated={() => { closeModal(); fetchEvents(); }}
          onUpdated={() => { closeModal(); fetchEvents(); }}
          onDeleted={() => { closeModal(); fetchEvents(); }}
        />
      )}
    </div>
  );
}
