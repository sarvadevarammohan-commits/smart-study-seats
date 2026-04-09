DROP POLICY IF EXISTS "Anyone can view seats" ON public.seats;
CREATE POLICY "Anyone can view seats" ON public.seats FOR SELECT TO public USING (true);