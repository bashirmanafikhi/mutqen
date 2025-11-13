// src/db/schema.ts
import { relations, sql } from 'drizzle-orm';
import { integer, primaryKey, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// --- CORE QURAN TABLES ---

export const quran_pages = sqliteTable('quran_pages', {
  id: integer('id').primaryKey(),
});

export const quran_words = sqliteTable('quran_words', {
  id: integer('id').primaryKey(),
  sura_id: integer('sura_id').notNull(),
  aya_number: integer('aya_number').notNull(),
  page_id: integer('page_id').notNull(),
  text: text('text').notNull(),
  
  // FIX: Using integer with mode: 'boolean' for SQLite
  is_end_of_aya: integer('is_end_of_aya', { mode: 'boolean' }).notNull(), 
  can_stop: integer('can_stop', { mode: 'boolean' }),
});

export const quran_suras = sqliteTable('quran_suras', {
  id: integer('id').primaryKey(),
  name: text('name'),
  name_without_tashkeel: text('name_without_tashkeel'),
  page_id: integer('page_id'),
  first_word_id: integer('first_word_id'),
  last_word_id: integer('last_word_id'),
  aya_count: integer('aya_count'),
  revelation_place: text('revelation_place'),
});

export const quran_juzs = sqliteTable('quran_juzs', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  first_word_id: integer('first_word_id').notNull(),
  last_word_id: integer('last_word_id').notNull(),
});

export const quran_divisions = sqliteTable('quran_divisions', {
  id: integer('id').primaryKey(),
  type: text('type').notNull(), // e.g., 'Hizb'
  name: text('name').notNull(),
  first_word_id: integer('first_word_id').notNull(),
  last_word_id: integer('last_word_id').notNull(),
});

export const aya_tafseers = sqliteTable('aya_tafseers', {
  sura_id: integer('sura_id').notNull(),
  aya_number: integer('aya_number').notNull(),
  text: text('text'),
}, (t) => ({
    // Composite Primary Key based on your schema's unique nature
    pk: primaryKey({ columns: [t.sura_id, t.aya_number] }), 
}));


// --- USER DATA TABLES ---

export const user_progress = sqliteTable('user_progress', {
  word_id: integer('word_id').primaryKey(),
  current_interval: real('current_interval').notNull().default(0),
  review_count: integer('review_count').notNull().default(0),
  lapses: integer('lapses').notNull().default(0),
  ease_factor: real('ease_factor').notNull().default(2.5),
  next_review_date: text('next_review_date').notNull(),
  last_review_date: text('last_review_date').notNull(),
  last_successful_date: text('last_successful_date'),
  // FIX: Using sql template tag for default function call
  created_at: text('created_at').notNull().default(sql`datetime('now')`), 
  memory_tier: integer('memory_tier').notNull().default(0),
  notes: text('notes'),
});

export const user_learnings = sqliteTable('user_learnings', {
  // Use .notNull() if you rely on AUTOINCREMENT, but keep it nullable if you pre-fill data.
  // Assuming AUTOINCREMENT from your schema:
  id: integer('id').primaryKey({ autoIncrement: true }), 
  title: text('title').notNull(),
  first_word_id: integer('first_word_id').notNull(),
  last_word_id: integer('last_word_id').notNull(),
  // FIX: Using sql template tag for default function call
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`), 
});

export const prizes = sqliteTable('prizes', {
  id: integer('id').primaryKey(),
  name: text('name'),
  division_type: text('division_type').notNull(),
  division_id: integer('division_id').notNull(),
  prize_type: text('prize_type').notNull(),
  prize_value: real('prize_value'), // NUMERIC maps best to real in SQLite
  earned_at: text('earned_at'),
}, (t) => ({
  // UNIQUE("division_type","division_id")
  unique_division: primaryKey({ columns: [t.division_type, t.division_id] }),
}));


// --- RELATIONS (for Eager Loading) ---

export const quranWordRelations = relations(quran_words, ({ one, many }) => ({
    sura: one(quran_suras, {
        fields: [quran_words.sura_id],
        references: [quran_suras.id],
    }),
    page: one(quran_pages, {
        fields: [quran_words.page_id],
        references: [quran_pages.id],
    }),
    progress: one(user_progress, {
        fields: [quran_words.id],
        references: [user_progress.word_id],
    }),
    // Other relations (divisions, juzs, learnings) can be defined here if needed for queries
}));

export const quranSuraRelations = relations(quran_suras, ({ many, one }) => ({
    words: many(quran_words),
    page: one(quran_pages, {
        fields: [quran_suras.page_id],
        references: [quran_pages.id],
    }),
    // Add relation to first/last word if needed
}));

export const userProgressRelations = relations(user_progress, ({ one }) => ({
    word: one(quran_words, {
        fields: [user_progress.word_id],
        references: [quran_words.id],
    }),
}));

export const quranDivisionRelations = relations(quran_divisions, ({ one }) => ({
    firstWord: one(quran_words, {
        fields: [quran_divisions.first_word_id],
        references: [quran_words.id],
        relationName: 'divisionFirstWord',
    }),
    lastWord: one(quran_words, {
        fields: [quran_divisions.last_word_id],
        references: [quran_words.id],
        relationName: 'divisionLastWord',
    }),
}));

export const userLearningsRelations = relations(user_learnings, ({ one }) => ({
    firstWord: one(quran_words, {
        fields: [user_learnings.first_word_id],
        references: [quran_words.id],
        relationName: 'learningFirstWord',
    }),
    lastWord: one(quran_words, {
        fields: [user_learnings.last_word_id],
        references: [quran_words.id],
        relationName: 'learningLastWord',
    }),
}));