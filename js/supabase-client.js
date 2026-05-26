// Supabase client — anon key is safe to expose (designed to be public)
const SUPABASE_URL      = "https://yqwmiffmwbdouxfkgbqa.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlxd21pZmZtd2Jkb3V4ZmtnYnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MDQxNjAsImV4cCI6MjA5NTM4MDE2MH0.DABNccDdfFdryZXMrmrDhoPFpjQ1blf4NdItP3mbJi4";
const _sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
