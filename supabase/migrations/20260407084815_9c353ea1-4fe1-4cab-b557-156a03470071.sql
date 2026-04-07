
-- Drop the overly permissive policy
DROP POLICY "Authenticated can update seats for booking" ON public.seats;

-- Replace with a more restrictive policy: users can update seats they've booked
CREATE POLICY "Users can update their booked seats" ON public.seats 
  FOR UPDATE TO authenticated 
  USING (current_user_id = auth.uid() OR current_user_id IS NULL);
