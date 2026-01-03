/**
 * Books App Tests
 * 
 * Tests for the Books app CRUD operations and schema validation.
 * Uses the test database at ~/.agentos/data/test/books.db
 */

import { describe, it, expect, afterAll } from 'vitest';
import { aos, testContent, cleanupTestData, TEST_PREFIX } from '../../../tests/utils/fixtures';

describe('Books App', () => {
  // Clean up test data after all tests
  afterAll(async () => {
    const deleted = await cleanupTestData('Books');
    if (deleted > 0) {
      console.log(`  Cleaned up ${deleted} test books`);
    }
  });

  describe('List', () => {
    it('can list all books', async () => {
      const books = await aos().books.list();
      
      expect(books).toBeDefined();
      expect(Array.isArray(books)).toBe(true);
    });

    it('can filter by status', async () => {
      const books = await aos().books.list({ status: 'read' });
      
      expect(Array.isArray(books)).toBe(true);
      for (const book of books) {
        expect(book.status).toBe('read');
      }
    });

    it('can filter by rating', async () => {
      const books = await aos().books.list({ rating: 5 });
      
      expect(Array.isArray(books)).toBe(true);
      for (const book of books) {
        expect(book.rating).toBe(5);
      }
    });

    it('respects limit parameter', async () => {
      const books = await aos().books.list({ limit: 5 });
      
      expect(Array.isArray(books)).toBe(true);
      expect(books.length).toBeLessThanOrEqual(5);
    });
  });

  describe('CRUD', () => {
    it('can create a book', async () => {
      const title = testContent('Create Test');
      
      const book = await aos().books.create({
        title,
        authors: ['Test Author'],
        status: 'want_to_read',
      });

      expect(book).toBeDefined();
      expect(book.id).toBeDefined();
      expect(book.title).toBe(title);
      expect(book.status).toBe('want_to_read');
    });

    it('can get a book by ID', async () => {
      // Create a book first
      const title = testContent('Get Test');
      const created = await aos().books.create({
        title,
        status: 'reading',
      });

      // Get it by ID
      const book = await aos().books.get(created.id);

      expect(book).toBeDefined();
      expect(book.id).toBe(created.id);
      expect(book.title).toBe(title);
    });

    it('can update a book', async () => {
      // Create a book
      const title = testContent('Update Test');
      const created = await aos().books.create({
        title,
        status: 'want_to_read',
      });

      // Update it
      const updated = await aos().books.update(created.id, {
        status: 'reading',
        rating: 4,
      });

      expect(updated).toBeDefined();
      expect(updated.status).toBe('reading');
      expect(updated.rating).toBe(4);
    });

    it('can delete a book', async () => {
      // Create a book
      const title = testContent('Delete Test');
      const created = await aos().books.create({
        title,
        status: 'want_to_read',
      });

      // Delete it
      const result = await aos().books.delete(created.id);
      expect(result).toBeDefined();

      // Verify it's gone
      const deleted = await aos().books.get(created.id);
      expect(deleted).toBeNull();
    });
  });

  describe('Data Integrity', () => {
    it('books have required fields', async () => {
      const books = await aos().books.list({ limit: 10 });

      for (const book of books) {
        // Required fields
        expect(book.id).toBeDefined();
        expect(book.title).toBeDefined();
        expect(book.status).toBeDefined();
        expect(book.source_connector).toBeDefined();
        expect(book.source_id).toBeDefined();

        // Status should be valid
        expect(['want_to_read', 'reading', 'read', 'dnf', 'none']).toContain(book.status);

        // Rating should be 1-5 or null
        if (book.rating != null) {
          expect(book.rating).toBeGreaterThanOrEqual(1);
          expect(book.rating).toBeLessThanOrEqual(5);
        }
      }
    });

    it('books have source tracking', async () => {
      const books = await aos().books.list({ limit: 10 });

      for (const book of books) {
        expect(typeof book.source_connector).toBe('string');
        expect(typeof book.source_id).toBe('string');
        expect(book.source_connector.length).toBeGreaterThan(0);
        expect(book.source_id.length).toBeGreaterThan(0);
      }
    });
  });
});
