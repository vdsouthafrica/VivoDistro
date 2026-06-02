-- 1. Drop the restrictive foreign key constraint
ALTER TABLE public.techlist_groups 
DROP CONSTRAINT IF EXISTS techlist_groups_performer_id_fkey;

-- 2. Add Row-Level Security (RLS) policies to allow Bookers and Agents
-- RLS policies are additive. By adding these new policies, we ensure that 
-- regardless of your role, if you own the profile, you can manage your TechList.

-- Create an INSERT policy
CREATE POLICY "Enable insert for all roles" ON public.techlist_groups
FOR INSERT
WITH CHECK (
  performer_id IN (SELECT id FROM performers WHERE auth_id = auth.uid()) OR
  performer_id IN (SELECT id FROM agents WHERE auth_id = auth.uid()) OR
  performer_id IN (SELECT id FROM bookers WHERE auth_id = auth.uid()) OR
  performer_id = auth.uid()
);

-- Create an UPDATE policy
CREATE POLICY "Enable update for all roles" ON public.techlist_groups
FOR UPDATE
USING (
  performer_id IN (SELECT id FROM performers WHERE auth_id = auth.uid()) OR
  performer_id IN (SELECT id FROM agents WHERE auth_id = auth.uid()) OR
  performer_id IN (SELECT id FROM bookers WHERE auth_id = auth.uid()) OR
  performer_id = auth.uid()
);

-- Create a DELETE policy
CREATE POLICY "Enable delete for all roles" ON public.techlist_groups
FOR DELETE
USING (
  performer_id IN (SELECT id FROM performers WHERE auth_id = auth.uid()) OR
  performer_id IN (SELECT id FROM agents WHERE auth_id = auth.uid()) OR
  performer_id IN (SELECT id FROM bookers WHERE auth_id = auth.uid()) OR
  performer_id = auth.uid()
);

-- (Optional but recommended) Ensure SELECT is open for reading public TechLists
CREATE POLICY "Enable select for everyone" ON public.techlist_groups
FOR SELECT
USING (true);
