/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://leakwnqwbovfxyudlhjt.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlYWt3bnF3Ym92Znh5dWRsaGp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4NjgyNzksImV4cCI6MjA3MjQ0NDI3OX0.d6CtzLTqquoI7UQEDQ7pih6tRRHW7WF9artmJiU89ZI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
