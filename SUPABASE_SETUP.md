# LAFAC Supabase Setup Guide

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login to your account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - Name: `LAFAC Management System`
   - Database Password: (choose a strong password)
   - Region: (choose closest to your users)
6. Click "Create new project"

## 2. Get Your Project Credentials

1. In your Supabase dashboard, go to Settings > API
2. Copy the following values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **Anon public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

## 3. Configure Environment Variables

1. Create a `.env` file in your project root
2. Add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_NAME=LAFAC Management System
VITE_APP_VERSION=1.0.0
```

## 4. Run Database Migrations

### Option A: Using Supabase CLI (Recommended)

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref your-project-id
```

4. Push migrations:
```bash
supabase db push
```

### Option B: Manual SQL Execution

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste each migration file content in order:
   - `20250628023423_orange_torch.sql`
   - `20250628152451_shiny_butterfly.sql`
   - `20250628154306_round_smoke.sql`
   - `20250628175422_stark_breeze.sql`
   - `20250628181532_delicate_thunder.sql`
   - `20250628182426_small_bridge.sql`
   - `20250628183357_restless_tooth.sql`
   - `20250628195154_yellow_spark.sql`
   - `20250628205253_azure_night.sql`
   - `20250629032659_graceful_palace.sql`
   - `20250702130049_throbbing_flame.sql`
4. Execute each migration in order

## 5. Configure Authentication

1. In Supabase dashboard, go to Authentication > Settings
2. Configure the following:
   - **Site URL**: `http://localhost:5173` (for development)
   - **Redirect URLs**: Add your production URL when ready
   - **Email Auth**: Enable if you want email/password authentication
   - **Disable email confirmations** for development (optional)

## 6. Test the Connection

1. Start your development server:
```bash
npm run dev
```

2. Try logging in with the superadmin account:
   - Email: `superadmin@lafac.com`
   - Password: `SuperAdmin2025!`

## 7. Verify Data Tables

After running migrations, you should see these tables in your Supabase dashboard:

- `users` - User profiles and authentication
- `events` - Events and activities
- `posts` - Social media posts
- `study_groups` - Study group sessions
- `candidates` - Selection process candidates
- `registrations` - Public registration submissions
- `budget_requests` - Budget request management
- `notifications` - System notifications
- `site_settings` - Site configuration
- `personal_spaces` - User personal spaces

## 8. Row Level Security (RLS)

The migrations automatically set up Row Level Security policies. These ensure:
- Users can only see data they're authorized to access
- Role-based permissions are enforced
- Sensitive operations require proper authentication

## 9. Default Accounts

The system creates these default accounts:

### Superadmin
- Email: `superadmin@lafac.com`
- Password: `SuperAdmin2025!`
- Role: Full system access

### Sample Users
- Various role-based accounts for testing
- Check the migration files for complete list

## 10. Troubleshooting

### Common Issues:

1. **Connection Error**: Verify your `.env` file has correct credentials
2. **Authentication Error**: Check if migrations ran successfully
3. **Permission Error**: Verify RLS policies are set up correctly
4. **Data Not Loading**: Check browser console for errors

### Debug Steps:

1. Open browser console (F12)
2. Check for error messages
3. Verify network requests to Supabase
4. Check Supabase dashboard logs

## 11. Production Deployment

When ready for production:

1. Update environment variables with production URLs
2. Configure proper authentication settings
3. Set up proper domain and SSL
4. Review and adjust RLS policies if needed
5. Set up database backups
6. Configure monitoring and alerts

## Support

If you encounter issues:
1. Check the browser console for errors
2. Review Supabase dashboard logs
3. Verify all migrations ran successfully
4. Check that environment variables are correct