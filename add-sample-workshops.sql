-- Add Sample Workshops to Database
-- Run this after running fix-setup.sql

-- Add sample workshops to the workshops table
INSERT INTO workshops (title, description, photo_url, fee, capacity, start_time, end_time, speakers, is_active) VALUES
('Web Development Workshop', 'Master the art of web development from basics to advanced concepts. Build responsive websites and web applications using modern technologies.', 'https://i.ibb.co/7d7WB7bY/6d641e5b8c6c.webp', 500, 40, NOW() + INTERVAL '2 hours', NOW() + INTERVAL '6 hours', '["James Wilson", "Maria Garcia"]', true),
('Mobile App Development', 'Learn to create mobile applications for iOS and Android platforms using React Native and Flutter frameworks.', 'https://i.ibb.co/7d7WB7bY/6d641e5b8c6c.webp', 750, 35, NOW() + INTERVAL '3 hours', NOW() + INTERVAL '7 hours', '["Ryan Patel", "Sophie Lee"]', true),
('AI & Machine Learning', 'Explore artificial intelligence and machine learning concepts with hands-on projects and real-world applications.', 'https://i.ibb.co/7d7WB7bY/6d641e5b8c6c.webp', 1000, 30, NOW() + INTERVAL '4 hours', NOW() + INTERVAL '8 hours', '["Dr. Sarah Johnson", "Prof. Michael Chen"]', true),
('Creative Design Workshop', 'Learn digital art, UI/UX design, and creative coding techniques for modern web applications.', 'https://i.ibb.co/7d7WB7bY/6d641e5b8c6c.webp', 400, 50, NOW() + INTERVAL '1 hour', NOW() + INTERVAL '5 hours', '["Sarah Johnson", "Mike Chen", "Dr. Emily Rodriguez"]', true),
('Data Science Fundamentals', 'Introduction to data science, statistics, and data visualization using Python and popular libraries.', 'https://i.ibb.co/7d7WB7bY/6d641e5b8c6c.webp', 800, 25, NOW() + INTERVAL '5 hours', NOW() + INTERVAL '9 hours', '["Dr. Alex Thompson", "Lisa Wang"]', true);

-- Verify the workshops were added
SELECT
    id,
    title,
    fee,
    capacity,
    is_active,
    created_at
FROM workshops
ORDER BY created_at DESC;
