import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn("Supabase credentials not found. Make sure to set SUPABASE_URL and SUPABASE_ANON_KEY in server/.env");
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');
