-- push_setup.sql
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)

-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, subscription)
);

-- Enable Row Level Security
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own subscriptions
CREATE POLICY "Users can insert their own subscriptions" 
    ON public.push_subscriptions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can see their own subscriptions" 
    ON public.push_subscriptions FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions" 
    ON public.push_subscriptions FOR DELETE 
    USING (auth.uid() = user_id);

-- Ensure Realtime is enabled for the tables we listen to
ALTER PUBLICATION supabase_realtime ADD TABLE public.inbox_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ratings;
