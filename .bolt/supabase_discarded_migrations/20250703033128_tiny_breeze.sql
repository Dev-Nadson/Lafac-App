/*
  # Add Sample Data for Testing

  1. Sample Data
    - Add sample events, posts, and study groups
    - Ensure all users can see data immediately
    - Provide realistic test data for development

  2. Data Types
    - Events with different statuses and types
    - Posts with various deadlines and assignments
    - Study groups with different modes and statuses
*/

-- Insert sample events
INSERT INTO events (
  id,
  title,
  description,
  date,
  time,
  type,
  location,
  online_link,
  assigned_members,
  status,
  created_by
) VALUES 
(
  gen_random_uuid(),
  'Palestra: Farmácia Clínica na UTI',
  'Uma palestra sobre a aplicação da farmácia clínica em unidades de terapia intensiva, abordando protocolos de medicação e interações medicamentosas.',
  CURRENT_DATE + INTERVAL '7 days',
  '14:00',
  'Palestra',
  'Auditório Principal - Bloco A',
  'https://meet.google.com/abc-defg-hij',
  ARRAY['00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000008'],
  'Scheduled',
  '00000000-0000-0000-0000-000000000002'
),
(
  gen_random_uuid(),
  'Workshop: Atenção Farmacêutica',
  'Workshop prático sobre atenção farmacêutica, com casos clínicos reais e discussões em grupo.',
  CURRENT_DATE + INTERVAL '14 days',
  '09:00',
  'Workshop',
  'Laboratório de Farmácia Clínica',
  NULL,
  ARRAY['00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000006'],
  'Confirmed',
  '00000000-0000-0000-0000-000000000002'
),
(
  gen_random_uuid(),
  'Simpósio de Farmácia Hospitalar',
  'Evento anual com palestras sobre farmácia hospitalar, gestão de medicamentos e segurança do paciente.',
  CURRENT_DATE + INTERVAL '30 days',
  '08:00',
  'Simpósio',
  'Centro de Convenções',
  'https://meet.google.com/xyz-uvw-rst',
  ARRAY['00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004'],
  'Scheduled',
  '00000000-0000-0000-0000-000000000002'
),
(
  gen_random_uuid(),
  'Ação Social: Orientação Medicamentosa',
  'Ação social em comunidade carente para orientação sobre uso correto de medicamentos.',
  CURRENT_DATE - INTERVAL '5 days',
  '08:30',
  'Ação',
  'Centro Comunitário Vila Esperança',
  NULL,
  ARRAY['00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000008'],
  'Completed',
  '00000000-0000-0000-0000-000000000004'
)
ON CONFLICT (id) DO NOTHING;

-- Insert sample posts
INSERT INTO posts (
  id,
  title,
  description,
  date,
  deadline,
  status,
  assigned_roles,
  related_event_id,
  created_by,
  post_type
) VALUES 
(
  gen_random_uuid(),
  'Post sobre Interações Medicamentosas',
  'Criar um post educativo sobre as principais interações medicamentosas em cardiologia, com infográfico e exemplos práticos.',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '5 days',
  'In Production',
  '[
    {"role": "Instagram Art Designer", "assignedTo": "00000000-0000-0000-0000-000000000008", "completed": false},
    {"role": "Scientific Researcher", "assignedTo": "00000000-0000-0000-0000-000000000006", "completed": true},
    {"role": "Caption Writer", "assignedTo": "00000000-0000-0000-0000-000000000005", "completed": false}
  ]'::jsonb,
  NULL,
  '00000000-0000-0000-0000-000000000005',
  'Feed Post'
),
(
  gen_random_uuid(),
  'Reel: Dicas de Farmácia Clínica',
  'Reel com dicas rápidas sobre farmácia clínica para estudantes, formato vertical e dinâmico.',
  CURRENT_DATE - INTERVAL '2 days',
  CURRENT_DATE + INTERVAL '3 days',
  'In Production',
  '[
    {"role": "Video Editor", "assignedTo": "00000000-0000-0000-0000-000000000007", "completed": false},
    {"role": "Scientific Researcher", "assignedTo": "00000000-0000-0000-0000-000000000006", "completed": true},
    {"role": "Caption Writer", "assignedTo": "00000000-0000-0000-0000-000000000005", "completed": true}
  ]'::jsonb,
  NULL,
  '00000000-0000-0000-0000-000000000005',
  'Reel'
),
(
  gen_random_uuid(),
  'Carrossel: Protocolo de Anticoagulação',
  'Carrossel educativo sobre protocolo de anticoagulação em pacientes hospitalizados.',
  CURRENT_DATE - INTERVAL '7 days',
  CURRENT_DATE - INTERVAL '1 day',
  'Posted',
  '[
    {"role": "Instagram Art Designer", "assignedTo": "00000000-0000-0000-0000-000000000008", "completed": true},
    {"role": "Scientific Researcher", "assignedTo": "00000000-0000-0000-0000-000000000006", "completed": true},
    {"role": "Caption Writer", "assignedTo": "00000000-0000-0000-0000-000000000005", "completed": true}
  ]'::jsonb,
  NULL,
  '00000000-0000-0000-0000-000000000005',
  'Carrossel'
),
(
  gen_random_uuid(),
  'Story: Divulgação do Workshop',
  'Stories para divulgar o workshop de atenção farmacêutica, com countdown e call-to-action.',
  CURRENT_DATE + INTERVAL '1 day',
  CURRENT_DATE + INTERVAL '10 days',
  'In Production',
  '[
    {"role": "Instagram Art Designer", "assignedTo": "00000000-0000-0000-0000-000000000008", "completed": false},
    {"role": "Caption Writer", "assignedTo": "00000000-0000-0000-0000-000000000005", "completed": false}
  ]'::jsonb,
  (SELECT id FROM events WHERE title = 'Workshop: Atenção Farmacêutica' LIMIT 1),
  '00000000-0000-0000-0000-000000000005',
  'Story'
)
ON CONFLICT (id) DO NOTHING;

-- Insert sample study groups
INSERT INTO study_groups (
  id,
  theme,
  presenter,
  mode,
  date,
  time,
  material_status,
  session_status,
  created_by,
  research_assigned_to,
  material_assigned_to
) VALUES 
(
  gen_random_uuid(),
  'Farmacologia Cardiovascular',
  'Dr. Maria Silva',
  'Presencial',
  CURRENT_DATE + INTERVAL '10 days',
  '15:30',
  'Unfinished',
  'Scheduled',
  '00000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000008',
  '00000000-0000-0000-0000-000000000007'
),
(
  gen_random_uuid(),
  'Farmacocinética Clínica',
  'Prof. João Santos',
  'Online',
  CURRENT_DATE + INTERVAL '17 days',
  '14:00',
  'Finished',
  'Scheduled',
  '00000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000008'
),
(
  gen_random_uuid(),
  'Farmácia Oncológica',
  'Dra. Ana Costa',
  'Presencial',
  CURRENT_DATE - INTERVAL '3 days',
  '16:00',
  'Finished',
  'Done',
  '00000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000007',
  '00000000-0000-0000-0000-000000000008'
),
(
  gen_random_uuid(),
  'Farmacoterapia Pediátrica',
  'Dr. Carlos Oliveira',
  'Online',
  CURRENT_DATE + INTERVAL '24 days',
  '13:30',
  'Unfinished',
  'Scheduled',
  '00000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000007'
)
ON CONFLICT (id) DO NOTHING;

-- Insert sample budget requests
INSERT INTO budget_requests (
  id,
  title,
  description,
  requested_amount,
  category,
  priority,
  status,
  requested_by,
  reviewed_by,
  related_event_id,
  justification,
  treasurer_notes,
  approved_amount
) VALUES 
(
  gen_random_uuid(),
  'Material para Workshop de Atenção Farmacêutica',
  'Compra de materiais didáticos, impressões e coffee break para o workshop.',
  450.00,
  'Event',
  'High',
  'Approved',
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000007',
  (SELECT id FROM events WHERE title = 'Workshop: Atenção Farmacêutica' LIMIT 1),
  'Materiais essenciais para a realização do workshop, incluindo casos clínicos impressos e coffee break para os participantes.',
  'Aprovado com redução de 10% no valor do coffee break.',
  400.00
),
(
  gen_random_uuid(),
  'Equipamento de Projeção',
  'Compra de projetor portátil para apresentações em eventos externos.',
  1200.00,
  'Infrastructure',
  'Medium',
  'Under Review',
  '00000000-0000-0000-0000-000000000005',
  NULL,
  NULL,
  'Necessário para melhorar a qualidade das apresentações em locais que não possuem equipamento adequado.',
  NULL,
  NULL
),
(
  gen_random_uuid(),
  'Transporte para Ação Social',
  'Aluguel de van para transporte dos membros até o local da ação social.',
  180.00,
  'Event',
  'High',
  'Pending',
  '00000000-0000-0000-0000-000000000004',
  NULL,
  (SELECT id FROM events WHERE title = 'Ação Social: Orientação Medicamentosa' LIMIT 1),
  'Transporte necessário para levar os membros e materiais até a comunidade.',
  NULL,
  NULL
)
ON CONFLICT (id) DO NOTHING;

-- Insert sample notifications
INSERT INTO notifications (
  id,
  user_id,
  title,
  message,
  type,
  read,
  action_url,
  related_id
) VALUES 
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000008',
  'Nova Tarefa Atribuída',
  'Você foi designado para criar o design do post sobre interações medicamentosas. Prazo: 5 dias.',
  'Task',
  false,
  '#posts',
  (SELECT id FROM posts WHERE title = 'Post sobre Interações Medicamentosas' LIMIT 1)
),
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000007',
  'Prazo Próximo',
  'O prazo para edição do reel sobre dicas de farmácia clínica é em 3 dias.',
  'Deadline',
  false,
  '#posts',
  (SELECT id FROM posts WHERE title = 'Reel: Dicas de Farmácia Clínica' LIMIT 1)
),
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000004',
  'Solicitação de Orçamento Aprovada',
  'Sua solicitação de orçamento para o workshop foi aprovada com valor de R$ 400,00.',
  'Budget',
  true,
  '#budget',
  (SELECT id FROM budget_requests WHERE title = 'Material para Workshop de Atenção Farmacêutica' LIMIT 1)
),
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000006',
  'Grupo de Estudo Agendado',
  'O grupo de estudo sobre Farmacologia Cardiovascular foi agendado para próxima semana.',
  'Event',
  false,
  '#study-groups',
  (SELECT id FROM study_groups WHERE theme = 'Farmacologia Cardiovascular' LIMIT 1)
)
ON CONFLICT (id) DO NOTHING;

-- Verify data was inserted
DO $$
DECLARE
  event_count integer;
  post_count integer;
  study_group_count integer;
  budget_count integer;
  notification_count integer;
BEGIN
  SELECT COUNT(*) INTO event_count FROM events;
  SELECT COUNT(*) INTO post_count FROM posts;
  SELECT COUNT(*) INTO study_group_count FROM study_groups;
  SELECT COUNT(*) INTO budget_count FROM budget_requests;
  SELECT COUNT(*) INTO notification_count FROM notifications;
  
  RAISE NOTICE 'Sample data inserted successfully:';
  RAISE NOTICE '- Events: %', event_count;
  RAISE NOTICE '- Posts: %', post_count;
  RAISE NOTICE '- Study Groups: %', study_group_count;
  RAISE NOTICE '- Budget Requests: %', budget_count;
  RAISE NOTICE '- Notifications: %', notification_count;
END $$;