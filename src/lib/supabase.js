import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://cuvltejoxlsekxfpvdha.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1dmx0ZWpveGxzZWt4ZnB2ZGhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMTMwOTYsImV4cCI6MjA5MDU4OTA5Nn0.fDnc9mS-yTNQusUsKpEYT-Gn1SeJ3kPYrzy214Yz3HQ'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
