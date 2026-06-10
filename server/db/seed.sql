-- EventMap full database seed
-- Run with: npm run seed  (from the server/ directory)
-- This drops and fully recreates the database + all mock data.
-- Safe to run multiple times — each run starts clean.

DROP DATABASE IF EXISTS event_map;
CREATE DATABASE event_map CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE event_map;

-- ── Tables ────────────────────────────────────────────────────────────────────

CREATE TABLE users (
  id           INT PRIMARY KEY AUTO_INCREMENT,
  username     VARCHAR(100) UNIQUE NOT NULL,
  email        VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE events (
  id           INT PRIMARY KEY AUTO_INCREMENT,
  title        VARCHAR(255) NOT NULL,
  description  TEXT,
  lat          DECIMAL(10, 8) NOT NULL,
  lng          DECIMAL(11, 8) NOT NULL,
  event_date   DATETIME NOT NULL,
  category     VARCHAR(100) DEFAULT 'general',
  creator_id   INT NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE comments (
  id         INT PRIMARY KEY AUTO_INCREMENT,
  event_id   INT NOT NULL,
  user_id    INT NOT NULL,
  content    TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE
);

CREATE TABLE chat_messages (
  id         INT PRIMARY KEY AUTO_INCREMENT,
  event_id   INT NOT NULL,
  user_id    INT NOT NULL,
  message    TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE
);

-- ── Users (password for all accounts: password123) ────────────────────────────

INSERT INTO users (username, email, password_hash) VALUES
  ('alice',   'alice@example.com',   '$2a$10$wtPH13Gw20auep8qj.HO0u533CZxz.xtJzxJBaeVVGHHUKBOyFjJ2'),
  ('bob',     'bob@example.com',     '$2a$10$Pv/n3NApLZGdRxnWKMPStuSQMjsfYTpM1SdNKp5l2x2EnEl8auI8a'),
  ('charlie', 'charlie@example.com', '$2a$10$mZMBAVAXrGGaH5XFKIj5VeafKEgfovnxO1vyK4mq2ygpc51ERrMly');

-- ── Events ────────────────────────────────────────────────────────────────────

INSERT INTO events (title, description, lat, lng, event_date, category, creator_id) VALUES
  ('Tel Aviv Beach Yoga',     'Morning yoga session on the beach. All levels welcome.',        32.06820000, 34.76330000, '2026-06-15 07:00:00', 'outdoor', 1),
  ('Indie Rock Night',        'Local bands performing live at the port amphitheater.',          32.09230000, 34.78030000, '2026-06-16 20:00:00', 'music',   2),
  ('Startup Pitch Night',     'Founders pitch ideas to investors. Networking afterwards.',      32.07500000, 34.79080000, '2026-06-18 18:30:00', 'tech',    1),
  ('Food Truck Festival',     'Over 30 food trucks from across the country. Family friendly.',  32.06060000, 34.77360000, '2026-06-20 12:00:00', 'food',    3),
  ('Street Art Walking Tour', 'Guided tour through Florentin neighbourhood murals.',            32.05540000, 34.77170000, '2026-06-21 10:00:00', 'art',     2),
  ('5K Fun Run — Old Jaffa',  'Scenic run through Old Jaffa and back along the promenade.',    32.05360000, 34.75190000, '2026-06-22 07:30:00', 'sports',  3),
  ('JavaScript Meetup TLV',   'Monthly JS community meetup. Talks on React 19 and Node.',      32.07210000, 34.78780000, '2026-06-25 19:00:00', 'tech',    1),
  ('Rooftop Jazz Evening',    'Smooth jazz under the stars. BYO snacks, drinks provided.',     32.08020000, 34.78110000, '2026-06-27 21:00:00', 'music',   2),
  ('Urban Farmers Market',    'Fresh produce, artisan goods, and live acoustic music.',         32.08690000, 34.77000000, '2026-06-28 09:00:00', 'food',    3),
  ('Photography Workshop',    'Hands-on urban photography workshop for beginners.',             32.06480000, 34.77530000, '2026-07-02 15:00:00', 'art',     1);

-- ── Comments ──────────────────────────────────────────────────────────────────

INSERT INTO comments (event_id, user_id, content) VALUES
  (1, 2, 'Can''t wait for this! Do we need to bring our own mats?'),
  (1, 3, 'Mats are provided but you can bring yours if you prefer.'),
  (2, 1, 'Which bands are playing? Saw the lineup was updated.'),
  (2, 3, 'Three local bands confirmed so far — details on their page.'),
  (3, 2, 'Is there a registration fee to attend?'),
  (3, 3, 'Free entry for the first 100 people, then 50 NIS at the door.'),
  (4, 1, 'Amazing event last year, already marking my calendar!'),
  (5, 1, 'I did this last month, highly recommend it.'),
  (5, 3, 'Is it suitable for kids?'),
  (6, 2, 'What''s the pace for the run? Is there a time limit?');

-- ── Chat messages ─────────────────────────────────────────────────────────────

INSERT INTO chat_messages (event_id, user_id, message) VALUES
  (1, 1, 'Hey everyone, excited for tomorrow!'),
  (1, 2, 'Same here, is parking nearby?'),
  (1, 3, 'There''s a lot on HaYarkon St, about 5 min walk.'),
  (2, 2, 'Doors open at 19:30, show starts at 20:00.'),
  (2, 1, 'Is there a bar at the venue?'),
  (2, 3, 'Yes, full bar and some food stalls outside.'),
  (3, 1, 'Remember to bring business cards!'),
  (3, 2, 'Will slides be shared afterwards?');
