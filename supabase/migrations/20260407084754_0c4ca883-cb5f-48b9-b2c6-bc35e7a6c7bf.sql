
-- Create enums
CREATE TYPE public.app_role AS ENUM ('student', 'admin');
CREATE TYPE public.seat_status AS ENUM ('available', 'reserved', 'occupied');
CREATE TYPE public.complaint_status AS ENUM ('pending', 'resolved', 'dismissed');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  roll_number TEXT NOT NULL DEFAULT '',
  branch TEXT DEFAULT '',
  year TEXT DEFAULT '',
  subject TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Seats table
CREATE TABLE public.seats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seat_id TEXT NOT NULL UNIQUE,
  status seat_status NOT NULL DEFAULT 'available',
  current_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expiry_time TIMESTAMP WITH TIME ZONE,
  block_number INTEGER NOT NULL,
  qr_token TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;

-- Bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  seat_id TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  checked_in BOOLEAN NOT NULL DEFAULT false,
  user_name TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Complaints table
CREATE TABLE public.complaints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_name TEXT NOT NULL DEFAULT '',
  seat_id TEXT NOT NULL DEFAULT 'N/A',
  booking_id TEXT DEFAULT '',
  message TEXT NOT NULL,
  status complaint_status NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_seats_updated_at BEFORE UPDATE ON public.seats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON public.complaints FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.email, '')
  );
  -- Default role is student
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies

-- Profiles: users can read own, admins can read all
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- User roles: users can read own role
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Seats: everyone authenticated can read, admins can modify
CREATE POLICY "Anyone can view seats" ON public.seats FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert seats" ON public.seats FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update seats" ON public.seats FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can update seats for booking" ON public.seats FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete seats" ON public.seats FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Bookings: users see own, admins see all
CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all bookings" ON public.bookings FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create bookings" ON public.bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bookings" ON public.bookings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can update all bookings" ON public.bookings FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can delete own bookings" ON public.bookings FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can delete all bookings" ON public.bookings FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Complaints: users see own, admins see all
CREATE POLICY "Users can view own complaints" ON public.complaints FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all complaints" ON public.complaints FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create complaints" ON public.complaints FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update complaints" ON public.complaints FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for seats, bookings, complaints
ALTER PUBLICATION supabase_realtime ADD TABLE public.seats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.complaints;

-- Seed initial 36 seats (4 blocks × 9 seats)
INSERT INTO public.seats (seat_id, status, block_number, qr_token) VALUES
  ('S1', 'available', 1, 'QR-S1-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 8)),
  ('S2', 'available', 1, 'QR-S2-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 8)),
  ('S3', 'available', 1, 'QR-S3-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 8)),
  ('S4', 'available', 1, 'QR-S4-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 8)),
  ('S5', 'available', 1, 'QR-S5-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 8)),
  ('S6', 'available', 1, 'QR-S6-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 8)),
  ('S7', 'available', 1, 'QR-S7-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 8)),
  ('S8', 'available', 1, 'QR-S8-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 8)),
  ('S9', 'available', 1, 'QR-S9-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 8)),
  ('S10', 'available', 2, 'QR-S10-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 8)),
  ('S11', 'available', 2, 'QR-S11-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 8)),
  ('S12', 'available', 2, 'QR-S12-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 8)),
  ('S13', 'available', 2, 'QR-S13-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 8)),
  ('S14', 'available', 2, 'QR-S14-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 8)),
  ('S15', 'available', 2, 'QR-S15-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 8)),
  ('S16', 'available', 2, 'QR-S16-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 8)),
  ('S17', 'available', 2, 'QR-S17-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 8)),
  ('S18', 'available', 2, 'QR-S18-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 8)),
  ('S19', 'available', 3, 'QR-S19-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 8)),
  ('S20', 'available', 3, 'QR-S20-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 8)),
  ('S21', 'available', 3, 'QR-S21-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 8)),
  ('S22', 'available', 3, 'QR-S22-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 8)),
  ('S23', 'available', 3, 'QR-S23-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 8)),
  ('S24', 'available', 3, 'QR-S24-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 8)),
  ('S25', 'available', 3, 'QR-S25-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 8)),
  ('S26', 'available', 3, 'QR-S26-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 8)),
  ('S27', 'available', 3, 'QR-S27-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 8)),
  ('S28', 'available', 4, 'QR-S28-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 8)),
  ('S29', 'available', 4, 'QR-S29-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 8)),
  ('S30', 'available', 4, 'QR-S30-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 8)),
  ('S31', 'available', 4, 'QR-S31-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 8)),
  ('S32', 'available', 4, 'QR-S32-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 8)),
  ('S33', 'available', 4, 'QR-S33-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 8)),
  ('S34', 'available', 4, 'QR-S34-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 8)),
  ('S35', 'available', 4, 'QR-S35-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 8)),
  ('S36', 'available', 4, 'QR-S36-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 8));
