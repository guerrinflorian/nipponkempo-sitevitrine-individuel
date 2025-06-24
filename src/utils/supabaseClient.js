import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://cbqzachnnlkgouvqqugq.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNicXphY2hubmxrZ291dnFxdWdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0ODMxMjksImV4cCI6MjA1MTA1OTEyOX0.-P8TIDyjaIyg2jPfn2_TSxzZ8BMB4kd6JW1OW3lfE5s";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
