insert into profiles (id, email)
values ('11111111-1111-1111-1111-111111111111', 'demo@aitherapist.local')
on conflict (id) do nothing;

insert into mental_profiles (user_id, main_challenges, stress_level, sleep_quality, triggers, coping_methods, goals, therapy_experience)
values (
  '11111111-1111-1111-1111-111111111111',
  array['anxiety', 'overthinking'],
  7,
  5,
  array['work deadlines', 'Sunday evenings', 'uncertainty'],
  array['walking', 'music', 'breathing'],
  array['calm mind', 'reduce panic'],
  'Some prior CBT experience'
)
on conflict (user_id) do nothing;

insert into mood_logs (user_id, mood, anxiety_level, energy, stress, sleep_quality, notes)
values
  ('11111111-1111-1111-1111-111111111111', 6, 7, 5, 8, 4, 'Busy day before a presentation'),
  ('11111111-1111-1111-1111-111111111111', 7, 5, 7, 6, 6, 'Felt more regulated after exercise'),
  ('11111111-1111-1111-1111-111111111111', 8, 4, 7, 5, 7, 'Steadier and more focused');

insert into journal_entries (user_id, text_content, emotional_analysis_json)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'I noticed I get tense every Sunday night thinking about work on Monday.',
    '{"emotionalThemes":["anticipatory anxiety"],"triggers":["Sunday evening","work"],"distortions":["catastrophizing"],"tone":"reflective","summary":"Anticipatory work anxiety is recurring."}'
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    'I assumed my manager was disappointed, but I did not actually have evidence.',
    '{"emotionalThemes":["self-doubt"],"triggers":["unclear feedback"],"distortions":["mind reading"],"tone":"self-aware","summary":"You are noticing assumptions earlier."}'
  );

insert into insights (user_id, insight_type, description)
values
  ('11111111-1111-1111-1111-111111111111', 'trigger', 'You often feel more anxious before meetings and early in the work week.'),
  ('11111111-1111-1111-1111-111111111111', 'distortion', 'Recent entries show catastrophizing and mind-reading patterns.'),
  ('11111111-1111-1111-1111-111111111111', 'progress', 'Mood tends to improve on days with movement and better sleep.');
