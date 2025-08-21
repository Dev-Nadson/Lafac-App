/*
  # Sistema LAFAC - Funcionalidades Avançadas

  1. Novas Tabelas
    - `site_settings` - Configurações visuais do site (Superadmin)
    - `registrations` - Inscrições para processo seletivo
    - `personal_spaces` - Espaços pessoais dos membros
    - `budget_requests` - Solicitações de orçamento
    - `notifications` - Sistema de notificações
    - `activity_assignments` - Atribuições de atividades
    - `member_workload` - Carga de trabalho dos membros

  2. Novos Perfis
    - Superadmin (acesso total)
    - Tesoureiro (orçamento)
    - Membro (acesso limitado)

  3. Funcionalidades
    - Processo seletivo público
    - Espaço pessoal dos membros
    - Sistema de notificações
    - Controle de carga de trabalho
    - Configurações visuais do site
*/

-- Adicionar novo perfil Superadmin e Tesoureiro
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('Superadmin', 'President', 'Vice-President', 'Director of Events', 'Director of Communications', 'Scientific Director', 'Treasurer', 'Member', 'InterviwerMember'));

-- Adicionar campos extras aos usuários
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date date;
ALTER TABLE users ADD COLUMN IF NOT EXISTS student_id text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cpf text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS institution text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS period text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture text;

-- Configurações do site (Superadmin)
CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  primary_color text DEFAULT '#3B82F6',
  secondary_color text DEFAULT '#10B981',
  logo_url text,
  site_name text DEFAULT 'LAFAC',
  show_posts_tab boolean DEFAULT true,
  show_events_tab boolean DEFAULT true,
  show_study_groups_tab boolean DEFAULT true,
  show_statistics_tab boolean DEFAULT true,
  show_selection_process_tab boolean DEFAULT true,
  selection_process_open boolean DEFAULT false,
  birthday_mode_active boolean DEFAULT false,
  birthday_member_id uuid REFERENCES users(id),
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Inscrições para processo seletivo
CREATE TABLE IF NOT EXISTS registrations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name text NOT NULL,
  email text NOT NULL,
  birth_date date NOT NULL,
  student_id text NOT NULL,
  cpf text NOT NULL,
  institution text NOT NULL,
  period text NOT NULL,
  motivation_letter text,
  status text DEFAULT 'Pending' CHECK (status IN ('Pending', 'Under Review', 'Approved', 'Rejected')),
  interview_date timestamptz,
  interviewer_1_id uuid REFERENCES users(id),
  interviewer_2_id uuid REFERENCES users(id),
  test_score integer CHECK (test_score >= 0 AND test_score <= 100),
  interview_1_score integer CHECK (interview_1_score >= 0 AND interview_1_score <= 100),
  interview_2_score integer CHECK (interview_2_score >= 0 AND interview_2_score <= 100),
  final_score decimal(5,2),
  assigned_role text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Espaços pessoais dos membros
CREATE TABLE IF NOT EXISTS personal_spaces (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  background_image text,
  background_color text DEFAULT '#F3F4F6',
  notes text DEFAULT '',
  stickers jsonb DEFAULT '[]',
  spotify_embed text,
  youtube_embed text,
  layout_config jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Solicitações de orçamento
CREATE TABLE IF NOT EXISTS budget_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text NOT NULL,
  requested_amount decimal(10,2) NOT NULL,
  category text NOT NULL CHECK (category IN ('Event', 'Material', 'Infrastructure', 'Other')),
  priority text DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  status text DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Under Review')),
  requested_by uuid REFERENCES users(id) ON DELETE SET NULL,
  reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  related_event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  justification text,
  treasurer_notes text,
  approved_amount decimal(10,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sistema de notificações
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('Task', 'Event', 'Deadline', 'System', 'Birthday', 'Budget')),
  read boolean DEFAULT false,
  action_url text,
  related_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Atribuições de atividades
CREATE TABLE IF NOT EXISTS activity_assignments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (activity_type IN ('Post', 'Event', 'Study', 'Research', 'Design', 'Video')),
  activity_id uuid NOT NULL,
  task_description text NOT NULL,
  deadline timestamptz,
  status text DEFAULT 'Assigned' CHECK (status IN ('Assigned', 'In Progress', 'Completed', 'Overdue')),
  assigned_by uuid REFERENCES users(id) ON DELETE SET NULL,
  completed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Carga de trabalho dos membros
CREATE TABLE IF NOT EXISTS member_workload (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  semester text NOT NULL,
  total_assignments integer DEFAULT 0,
  completed_assignments integer DEFAULT 0,
  overdue_assignments integer DEFAULT 0,
  workload_level text DEFAULT 'Light' CHECK (workload_level IN ('Light', 'Regular', 'Heavy')),
  last_calculated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, semester)
);

-- Enable RLS on new tables
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_workload ENABLE ROW LEVEL SECURITY;

-- RLS Policies for site_settings
CREATE POLICY "Everyone can read site settings"
  ON site_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only Superadmin can manage site settings"
  ON site_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'Superadmin'
      AND u.is_active = true
    )
  );

-- RLS Policies for registrations
CREATE POLICY "Public can insert registrations"
  ON registrations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Executives can manage registrations"
  ON registrations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('Superadmin', 'President', 'Vice-President')
      AND u.is_active = true
    )
  );

-- RLS Policies for personal_spaces
CREATE POLICY "Users can manage their own personal space"
  ON personal_spaces
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for budget_requests
CREATE POLICY "All users can read budget requests"
  ON budget_requests
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create budget requests"
  ON budget_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (requested_by = auth.uid());

CREATE POLICY "Treasurers can manage budget requests"
  ON budget_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('Superadmin', 'President', 'Vice-President', 'Treasurer')
      AND u.is_active = true
    )
  );

-- RLS Policies for notifications
CREATE POLICY "Users can read their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for activity_assignments
CREATE POLICY "Users can read their own assignments"
  ON activity_assignments
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Directors can manage assignments"
  ON activity_assignments
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('Superadmin', 'President', 'Vice-President', 'Director of Events', 'Director of Communications', 'Scientific Director', 'InterviwerMember')
      AND u.is_active = true
    )
  );

-- RLS Policies for member_workload
CREATE POLICY "Users can read their own workload"
  ON member_workload
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Directors can read all workloads"
  ON member_workload
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('Superadmin', 'President', 'Vice-President', 'Director of Events', 'Director of Communications', 'Scientific Director', 'InterviwerMember')
      AND u.is_active = true
    )
  );

CREATE POLICY "System can manage workloads"
  ON member_workload
  FOR ALL
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status);
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON registrations(created_at);
CREATE INDEX IF NOT EXISTS idx_personal_spaces_user_id ON personal_spaces(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_requests_status ON budget_requests(status);
CREATE INDEX IF NOT EXISTS idx_budget_requests_requested_by ON budget_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_activity_assignments_user_id ON activity_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_assignments_status ON activity_assignments(status);
CREATE INDEX IF NOT EXISTS idx_member_workload_user_id ON member_workload(user_id);

-- Insert default site settings
INSERT INTO site_settings (primary_color, secondary_color, site_name)
VALUES ('#3B82F6', '#10B981', 'LAFAC')
ON CONFLICT DO NOTHING;

-- Insert Superadmin user
INSERT INTO users (
  id,
  email, 
  name, 
  role, 
  contact_info, 
  is_active,
  join_date
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'superadmin@lafac.com',
  'Superadmin LAFAC',
  'Superadmin',
  '+55 11 99999-0000',
  true,
  CURRENT_DATE
) ON CONFLICT (email) DO NOTHING;

-- Create triggers for updated_at
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_registrations_updated_at BEFORE UPDATE ON registrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_personal_spaces_updated_at BEFORE UPDATE ON personal_spaces FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budget_requests_updated_at BEFORE UPDATE ON budget_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_activity_assignments_updated_at BEFORE UPDATE ON activity_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_member_workload_updated_at BEFORE UPDATE ON member_workload FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate workload
CREATE OR REPLACE FUNCTION calculate_member_workload()
RETURNS TRIGGER AS $$
BEGIN
  -- Update workload when assignments change
  INSERT INTO member_workload (user_id, semester, total_assignments, completed_assignments, overdue_assignments)
  VALUES (
    NEW.user_id,
    EXTRACT(YEAR FROM NOW()) || '-' || CASE WHEN EXTRACT(MONTH FROM NOW()) <= 6 THEN '1' ELSE '2' END,
    1,
    CASE WHEN NEW.status = 'Completed' THEN 1 ELSE 0 END,
    CASE WHEN NEW.status = 'Overdue' THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id, semester) DO UPDATE SET
    total_assignments = member_workload.total_assignments + 1,
    completed_assignments = member_workload.completed_assignments + CASE WHEN NEW.status = 'Completed' THEN 1 ELSE 0 END,
    overdue_assignments = member_workload.overdue_assignments + CASE WHEN NEW.status = 'Overdue' THEN 1 ELSE 0 END,
    workload_level = CASE 
      WHEN member_workload.total_assignments + 1 >= 15 THEN 'Heavy'
      WHEN member_workload.total_assignments + 1 >= 8 THEN 'Regular'
      ELSE 'Light'
    END,
    last_calculated = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for workload calculation
CREATE TRIGGER calculate_workload_trigger
  AFTER INSERT OR UPDATE ON activity_assignments
  FOR EACH ROW
  EXECUTE FUNCTION calculate_member_workload();

-- Function to check birthdays and activate birthday mode
CREATE OR REPLACE FUNCTION check_birthday_mode()
RETURNS void AS $$
DECLARE
  birthday_user_id uuid;
BEGIN
  -- Check if today is someone's birthday
  SELECT id INTO birthday_user_id
  FROM users 
  WHERE EXTRACT(MONTH FROM birth_date) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(DAY FROM birth_date) = EXTRACT(DAY FROM CURRENT_DATE)
    AND is_active = true
  LIMIT 1;
  
  IF birthday_user_id IS NOT NULL THEN
    -- Activate birthday mode
    UPDATE site_settings 
    SET 
      birthday_mode_active = true,
      birthday_member_id = birthday_user_id,
      updated_at = NOW()
    WHERE id = (SELECT id FROM site_settings LIMIT 1);
    
    -- Create birthday notification for all users
    INSERT INTO notifications (user_id, title, message, type)
    SELECT 
      u.id,
      '🎉 Aniversário!',
      'Hoje é aniversário de ' || (SELECT name FROM users WHERE id = birthday_user_id) || '! 🎂',
      'Birthday'
    FROM users u
    WHERE u.is_active = true;
  ELSE
    -- Deactivate birthday mode if no birthdays today
    UPDATE site_settings 
    SET 
      birthday_mode_active = false,
      birthday_member_id = NULL,
      updated_at = NOW()
    WHERE birthday_mode_active = true;
  END IF;
END;
$$ LANGUAGE plpgsql;