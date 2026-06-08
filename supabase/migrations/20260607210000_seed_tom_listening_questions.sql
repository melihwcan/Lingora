-- Seed True/False questions for "Tom and his dog" listening module

DELETE FROM public.listening_comprehension_questions
WHERE module_id IN (
  SELECT id FROM public.modules WHERE title ILIKE 'Tom and his dog' AND type = 'listening'
);

INSERT INTO public.listening_comprehension_questions (module_id, statement, correct_answer, order_index)
SELECT m.id, v.statement, v.correct_answer, v.order_index
FROM public.modules m
CROSS JOIN (
  VALUES
    ('Tom has a dog.', true, 0),
    ('Tom''s dog is big and black.', false, 1),
    ('Tom takes his dog for a walk in the morning.', true, 2),
    ('Tom plays with a ball in the park.', true, 3),
    ('Tom gives his dog food and water after the walk.', true, 4)
) AS v(statement, correct_answer, order_index)
WHERE m.title ILIKE 'Tom and his dog' AND m.type = 'listening';
