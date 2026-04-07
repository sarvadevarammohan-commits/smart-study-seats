import { useAuth } from "@/contexts/AuthContext";
import { useLibrary } from "@/contexts/LibraryContext";
import LoginPage from "./Login";
import StudentDashboard from "./StudentDashboard";
import AdminDashboard from "./AdminDashboard";

const Index = () => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { loading: libLoading } = useLibrary();

  if (authLoading || (isAuthenticated && libLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <LoginPage />;
  if (user?.role === 'admin') return <AdminDashboard />;
  return <StudentDashboard />;
};

export default Index;
