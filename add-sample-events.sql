-- Add Sample Events to Database
-- Run this after running fix-setup.sql

-- First, let's add some sample events for each category

-- Tech Events
INSERT INTO events (name, description, photo_url, category, max_participants, is_active) VALUES
('Tech Carnival', 'Dive into a quirky tech showdown where coding meets creativity in lightning-fast games and geeky banter. From code riddles and dev debates to emoji storytelling and CS charades — it''s tech like you''ve never played before!', 'https://i.ibb.co/7d7WB7bY/6d641e5b8c6c.webp', 'tech', 200, true),
('AI & Robotics', 'Explore the future of artificial intelligence and automation. Get hands-on experience with the latest AI and robotics technologies.', 'https://i.ibb.co/7d7WB7bY/6d641e5b8c6c.webp', 'tech', 60, true),
('Neuronex', 'Explore the neural networks of innovation in this AI and machine learning extravaganza. Experience cutting-edge technologies that are shaping the future of computing.', 'https://i.ibb.co/7d7WB7bY/6d641e5b8c6c.webp', 'tech', 100, true);

-- Workshop Events
INSERT INTO events (name, description, photo_url, category, max_participants, is_active) VALUES
('Creative Workshops', 'Hands-on sessions where creativity meets cutting-edge technology. Learn digital art, 3D modeling, and creative coding in interactive workshops.', 'https://i.ibb.co/7d7WB7bY/6d641e5b8c6c.webp', 'workshop', 50, true),
('Innovation Labs', 'Collaborative spaces where ideas transform into reality. Work on real-world problems with industry mentors and experts.', 'https://i.ibb.co/7d7WB7bY/6d641e5b8c6c.webp', 'workshop', 75, true),
('Web Development Workshop', 'Master the art of web development from basics to advanced concepts. Build responsive websites and web applications.', 'https://i.ibb.co/7d7WB7bY/6d641e5b8c6c.webp', 'workshop', 40, true),
('Mobile App Development', 'Learn to create mobile applications for iOS and Android platforms using modern development tools and frameworks.', 'https://i.ibb.co/7d7WB7bY/6d641e5b8c6c.webp', 'workshop', 35, true);

-- Non-Tech Events
INSERT INTO events (name, description, photo_url, category, max_participants, is_active) VALUES
('Pitchverse', 'A dynamic platform where innovative ideas take flight. Present your groundbreaking concepts to industry experts and potential investors in this high-energy pitch competition.', 'https://i.ibb.co/7d7WB7bY/6d641e5b8c6c.webp', 'non-tech', 50, true),
('Digital Art Gallery', 'Showcase of digital creativity and artistic innovation. Experience the intersection of art and technology through immersive exhibitions.', 'https://i.ibb.co/7d7WB7bY/6d641e5b8c6c.webp', 'non-tech', NULL, true);

-- Verify the events were added
SELECT 
    name, 
    category, 
    max_participants,
    is_active,
    created_at
FROM events 
ORDER BY category, name;
