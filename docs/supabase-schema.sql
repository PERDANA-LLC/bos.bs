-- Bible Books Table
CREATE TABLE bible_books (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  testament VARCHAR(10) NOT NULL CHECK (testament IN ('Old', 'New')),
  book_order INTEGER NOT NULL,
  chapters INTEGER NOT NULL,
  abbreviation VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bible Verses Table
CREATE TABLE bible_verses (
  id SERIAL PRIMARY KEY,
  book_id INTEGER REFERENCES bible_books(id) ON DELETE CASCADE,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  text TEXT NOT NULL,
  book_name VARCHAR(50) NOT NULL,
  reference VARCHAR(20) NOT NULL, -- e.g., "Genesis 1:1"
  testament VARCHAR(10) NOT NULL CHECK (testament IN ('Old', 'New')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(book_id, chapter, verse)
);

-- Strong's Concordance
CREATE TABLE strongs_concordance (
  id SERIAL PRIMARY KEY,
  strong_number VARCHAR(10) NOT NULL UNIQUE, -- e.g., "H7225", "G26"
  original_word TEXT NOT NULL,
  transliteration VARCHAR(100),
  pronunciation VARCHAR(100),
  definition TEXT NOT NULL,
  language VARCHAR(10) NOT NULL CHECK (language IN ('Hebrew', 'Greek')),
  kjv_occurrences INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verse-Strong's Relationships
CREATE TABLE verse_strong_relationships (
  id SERIAL PRIMARY KEY,
  verse_id INTEGER REFERENCES bible_verses(id) ON DELETE CASCADE,
  strong_id INTEGER REFERENCES strongs_concordance(id) ON DELETE CASCADE,
  position_in_verse INTEGER NOT NULL, -- Position of the word in the verse
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(verse_id, strong_id, position_in_verse)
);

-- Cross References
CREATE TABLE cross_references (
  id SERIAL PRIMARY KEY,
  from_verse_id INTEGER REFERENCES bible_verses(id) ON DELETE CASCADE,
  to_verse_id INTEGER REFERENCES bible_verses(id) ON DELETE CASCADE,
  reference_type VARCHAR(50) NOT NULL CHECK (reference_type IN ('direct_quote', 'allusion', 'thematic', 'parallel', 'prophetic')),
  confidence_score DECIMAL(2,2) DEFAULT 1.0, -- 0.0 to 1.0
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(from_verse_id, to_verse_id, reference_type)
);

-- Topics/Categories
CREATE TABLE bible_topics (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(50), -- e.g., 'Theology', 'History', 'Prophecy'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verse-Topic Relationships
CREATE TABLE verse_topic_relationships (
  id SERIAL PRIMARY KEY,
  verse_id INTEGER REFERENCES bible_verses(id) ON DELETE CASCADE,
  topic_id INTEGER REFERENCES bible_topics(id) ON DELETE CASCADE,
  relevance_score DECIMAL(2,2) DEFAULT 1.0, -- 0.0 to 1.0
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(verse_id, topic_id)
);

-- Users Table (for authentication and personalization)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sign_in_at TIMESTAMP WITH TIME ZONE
);

-- User Study Sessions
CREATE TABLE study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  verses_read INTEGER DEFAULT 0,
  ai_queries INTEGER DEFAULT 0
);

-- User Notes and Highlights
CREATE TABLE user_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  verse_id INTEGER REFERENCES bible_verses(id) ON DELETE CASCADE,
  annotation_type VARCHAR(20) NOT NULL CHECK (annotation_type IN ('note', 'highlight', 'bookmark')),
  content TEXT, -- For notes
  color VARCHAR(20), -- For highlights (e.g., 'yellow', 'blue', 'green')
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, verse_id, annotation_type)
);

-- AI Query History
CREATE TABLE ai_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  response TEXT,
  context_verses INTEGER[] DEFAULT '{}', -- Array of verse IDs used as context
  response_time_ms INTEGER, -- Time taken to generate response
  rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- User rating of response
  feedback TEXT, -- User feedback
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Study Plans
CREATE TABLE study_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  plan_type VARCHAR(50) NOT NULL CHECK (plan_type IN ('book_study', 'topical', 'chronological', 'character_study')),
  duration_days INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Study Plan Items
CREATE TABLE study_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_plan_id UUID REFERENCES study_plans(id) ON DELETE CASCADE,
  verse_id INTEGER REFERENCES bible_verses(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vector Embeddings for RAG
CREATE TABLE verse_embeddings (
  id SERIAL PRIMARY KEY,
  verse_id INTEGER REFERENCES bible_verses(id) ON DELETE CASCADE,
  embedding_vector VECTOR(768), -- Adjust dimension based on your embedding model
  embedding_model VARCHAR(50) NOT NULL, -- e.g., 'text-embedding-004'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(verse_id, embedding_model)
);

-- Indexes for Performance
CREATE INDEX idx_bible_verses_reference ON bible_verses(reference);
CREATE INDEX idx_bible_verses_book_chapter ON bible_verses(book_id, chapter);
CREATE INDEX idx_bible_verses_text_search ON bible_verses USING gin(to_tsvector('english', text));
CREATE INDEX idx_cross_references_from_verse ON cross_references(from_verse_id);
CREATE INDEX idx_cross_references_to_verse ON cross_references(to_verse_id);
CREATE INDEX idx_user_annotations_user_verse ON user_annotations(user_id, verse_id);
CREATE INDEX idx_ai_queries_user_created ON ai_queries(user_id, created_at);
CREATE INDEX idx_verse_embeddings_vector ON verse_embeddings USING ivfflat (embedding_vector vector_cosine_ops);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bible_books_updated_at BEFORE UPDATE ON bible_books FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_annotations_updated_at BEFORE UPDATE ON user_annotations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_study_plans_updated_at BEFORE UPDATE ON study_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable pgvector extension for vector operations
CREATE EXTENSION IF NOT EXISTS vector;

-- Insert Bible Books Data
INSERT INTO bible_books (name, testament, book_order, chapters, abbreviation) VALUES
('Genesis', 'Old', 1, 50, 'Gen'),
('Exodus', 'Old', 2, 40, 'Exod'),
('Leviticus', 'Old', 3, 27, 'Lev'),
('Numbers', 'Old', 4, 36, 'Num'),
('Deuteronomy', 'Old', 5, 34, 'Deut'),
('Joshua', 'Old', 6, 24, 'Josh'),
('Judges', 'Old', 7, 21, 'Judg'),
('Ruth', 'Old', 8, 4, 'Ruth'),
('1 Samuel', 'Old', 9, 31, '1 Sam'),
('2 Samuel', 'Old', 10, 24, '2 Sam'),
('1 Kings', 'Old', 11, 22, '1 Kgs'),
('2 Kings', 'Old', 12, 25, '2 Kgs'),
('1 Chronicles', 'Old', 13, 29, '1 Chr'),
('2 Chronicles', 'Old', 14, 36, '2 Chr'),
('Ezra', 'Old', 15, 10, 'Ezra'),
('Nehemiah', 'Old', 16, 13, 'Neh'),
('Esther', 'Old', 17, 10, 'Esth'),
('Job', 'Old', 18, 42, 'Job'),
('Psalms', 'Old', 19, 150, 'Ps'),
('Proverbs', 'Old', 20, 31, 'Prov'),
('Ecclesiastes', 'Old', 21, 12, 'Eccl'),
('Song of Solomon', 'Old', 22, 8, 'Song'),
('Isaiah', 'Old', 23, 66, 'Isa'),
('Jeremiah', 'Old', 24, 52, 'Jer'),
('Lamentations', 'Old', 25, 5, 'Lam'),
('Ezekiel', 'Old', 26, 48, 'Ezek'),
('Daniel', 'Old', 27, 12, 'Dan'),
('Hosea', 'Old', 28, 14, 'Hos'),
('Joel', 'Old', 29, 3, 'Joel'),
('Amos', 'Old', 30, 9, 'Amos'),
('Obadiah', 'Old', 31, 1, 'Obad'),
('Jonah', 'Old', 32, 4, 'Jonah'),
('Micah', 'Old', 33, 7, 'Mic'),
('Nahum', 'Old', 34, 3, 'Nah'),
('Habakkuk', 'Old', 35, 3, 'Hab'),
('Zephaniah', 'Old', 36, 3, 'Zeph'),
('Haggai', 'Old', 37, 2, 'Hag'),
('Zechariah', 'Old', 38, 14, 'Zech'),
('Malachi', 'Old', 39, 4, 'Mal'),
('Matthew', 'New', 40, 28, 'Matt'),
('Mark', 'New', 41, 16, 'Mark'),
('Luke', 'New', 42, 24, 'Luke'),
('John', 'New', 43, 21, 'John'),
('Acts', 'New', 44, 28, 'Acts'),
('Romans', 'New', 45, 16, 'Rom'),
('1 Corinthians', 'New', 46, 16, '1 Cor'),
('2 Corinthians', 'New', 47, 13, '2 Cor'),
('Galatians', 'New', 48, 6, 'Gal'),
('Ephesians', 'New', 49, 6, 'Eph'),
('Philippians', 'New', 50, 4, 'Phil'),
('Colossians', 'New', 51, 4, 'Col'),
('1 Thessalonians', 'New', 52, 5, '1 Thess'),
('2 Thessalonians', 'New', 53, 3, '2 Thess'),
('1 Timothy', 'New', 54, 6, '1 Tim'),
('2 Timothy', 'New', 55, 4, '2 Tim'),
('Titus', 'New', 56, 3, 'Titus'),
('Philemon', 'New', 57, 1, 'Phlm'),
('Hebrews', 'New', 58, 13, 'Heb'),
('James', 'New', 59, 5, 'Jas'),
('1 Peter', 'New', 60, 5, '1 Pet'),
('2 Peter', 'New', 61, 3, '2 Pet'),
('1 John', 'New', 62, 5, '1 John'),
('2 John', 'New', 63, 1, '2 John'),
('3 John', 'New', 64, 1, '3 John'),
('Jude', 'New', 65, 1, 'Jude'),
('Revelation', 'New', 66, 22, 'Rev');

-- Row Level Security (RLS) for user data
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_plan_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own study sessions" ON study_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own study sessions" ON study_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own study sessions" ON study_sessions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own annotations" ON user_annotations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own annotations" ON user_annotations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own annotations" ON user_annotations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own annotations" ON user_annotations FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own AI queries" ON ai_queries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own AI queries" ON ai_queries FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own study plans" ON study_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own study plans" ON study_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own study plans" ON study_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own study plans" ON study_plans FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own study plan items" ON study_plan_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own study plan items" ON study_plan_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own study plan items" ON study_plan_items FOR UPDATE USING (auth.uid() = user_id);

-- Function to handle user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to handle new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();