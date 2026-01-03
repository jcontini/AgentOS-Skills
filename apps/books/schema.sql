-- Books App Schema
-- Location: ~/.agentos/data/books.db

CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY,
  
  -- Universal identifiers (for matching across sources)
  isbn TEXT,
  isbn13 TEXT,
  
  -- Core metadata
  title TEXT NOT NULL,
  authors JSON,               -- ["Author One", "Author Two"]
  cover_url TEXT,
  
  -- Personal data (what users care about)
  status TEXT DEFAULT 'none', -- want_to_read, reading, read, dnf, none
  rating INTEGER,             -- 1-5 (normalized from source)
  review TEXT,
  tags JSON,                  -- ["sci-fi", "favorites"] - user organization
  
  -- Key dates
  date_added TEXT,            -- When added to library
  date_started TEXT,          -- When started reading
  date_finished TEXT,         -- When finished
  
  -- Source tracking
  source_connector TEXT NOT NULL,  -- "goodreads", "hardcover", etc.
  source_id TEXT NOT NULL,         -- ID in source system
  
  -- Connector-specific extras (see CONTRIBUTING.md for pattern)
  metadata JSON,
  
  -- Timestamps
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  
  UNIQUE(source_connector, source_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
CREATE INDEX IF NOT EXISTS idx_books_rating ON books(rating);
CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);
CREATE INDEX IF NOT EXISTS idx_books_isbn13 ON books(isbn13);
CREATE INDEX IF NOT EXISTS idx_books_source ON books(source_connector, source_id);
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
