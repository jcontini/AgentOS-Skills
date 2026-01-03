-- Books App Schema
-- Location: ~/.agentos/data/books.db

-- =============================================================================
-- Core Tables
-- =============================================================================

CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY,                -- AgentOS internal UUID
  
  -- Identifiers (for matching across sources)
  isbn TEXT,                          -- ISBN-10
  isbn13 TEXT,                        -- ISBN-13
  goodreads_id TEXT,                  -- Goodreads Book ID
  openlibrary_id TEXT,                -- e.g., "OL123456W"
  google_books_id TEXT,               -- e.g., "_LettPDhwR0C"
  hardcover_id TEXT,                  -- Hardcover.app ID
  
  -- Metadata
  title TEXT NOT NULL,
  authors JSON,                       -- ["Author One", "Author Two"]
  publisher TEXT,
  published_year INTEGER,
  page_count INTEGER,
  description TEXT,
  cover_url TEXT,
  genres JSON,                        -- ["Fiction", "Sci-Fi"]
  language TEXT DEFAULT 'en',
  
  -- Personal Data
  status TEXT DEFAULT 'none',         -- want_to_read, reading, read, dnf, none
  rating INTEGER,                     -- 1-5
  review TEXT,
  notes TEXT,                         -- Private notes
  read_count INTEGER DEFAULT 0,       -- For re-reads
  
  -- Dates
  date_added TEXT,                    -- When added to library (ISO date)
  date_started TEXT,                  -- When started reading
  date_finished TEXT,                 -- When finished reading
  
  -- Source tracking
  source_connector TEXT,              -- Which connector imported this
  source_id TEXT,                     -- ID in the source system
  imported_at TEXT,                   -- When imported into AgentOS
  source_updated_at TEXT,             -- Last modified in source
  
  -- Timestamps
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  
  -- Prevent duplicate imports
  UNIQUE(source_connector, source_id)
);

-- Shelves (custom collections)
CREATE TABLE IF NOT EXISTS shelves (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Book-Shelf relationship (many-to-many)
CREATE TABLE IF NOT EXISTS book_shelves (
  book_id TEXT NOT NULL,
  shelf_id TEXT NOT NULL,
  added_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (book_id, shelf_id),
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  FOREIGN KEY (shelf_id) REFERENCES shelves(id) ON DELETE CASCADE
);

-- Reading sessions (for tracking multiple reads, start/stop dates)
CREATE TABLE IF NOT EXISTS reading_sessions (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL,
  started_at TEXT,
  finished_at TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- Import history (track what was imported from where)
CREATE TABLE IF NOT EXISTS imports (
  id TEXT PRIMARY KEY,
  connector TEXT NOT NULL,
  source_path TEXT,                   -- File path for CSV imports
  imported_at TEXT DEFAULT (datetime('now')),
  books_imported INTEGER DEFAULT 0,
  books_skipped INTEGER DEFAULT 0,
  errors JSON                         -- [{row: 5, error: "..."}]
);

-- =============================================================================
-- Indexes
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
CREATE INDEX IF NOT EXISTS idx_books_rating ON books(rating);
CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);
CREATE INDEX IF NOT EXISTS idx_books_isbn13 ON books(isbn13);
CREATE INDEX IF NOT EXISTS idx_books_goodreads ON books(goodreads_id);
CREATE INDEX IF NOT EXISTS idx_books_source ON books(source_connector, source_id);
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_book ON reading_sessions(book_id);

-- =============================================================================
-- Default Shelves
-- =============================================================================

INSERT OR IGNORE INTO shelves (id, name, description) VALUES 
  ('favorites', 'Favorites', 'Books I loved'),
  ('currently-reading', 'Currently Reading', 'Books in progress'),
  ('want-to-read', 'Want to Read', 'Books on my list'),
  ('did-not-finish', 'Did Not Finish', 'DNF books');
