import { useAuth } from "@/contexts/AuthContext";
import LoginPage from "./Login";
import StudentDashboard from "./StudentDashboard";
import AdminDashboard from "./AdminDashboard";

const Index = () => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return <LoginPage />;
  if (user?.role === 'admin') return <AdminDashboard />;
  return <StudentDashboard />;
};

export default Index;
