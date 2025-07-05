import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import { User } from "@supabase/supabase-js";
import { Home, LogOut, School, Heart, Briefcase, Moon } from "lucide-react";

interface ActionRecord {
  id: string;
  user_id: string;
  action: string;
  created_at: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [actions, setActions] = useState<ActionRecord[]>([]);
  const [daysToShow, setDaysToShow] = useState(3);

  const allowedEmail = import.meta.env.VITE_ALLOWED_EMAIL;

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setAuthorized(user.email === allowedEmail);
      }
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setAuthorized(currentUser?.email === allowedEmail);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [allowedEmail]);

  useEffect(() => {
    const fetchActions = async () => {
      if (authorized) {
        const { data, error } = await supabase
          .from("actions")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching actions:", error.message);
        } else {
          setActions(data as ActionRecord[]);
        }
      }
    };

    fetchActions();
  }, [authorized]);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAuthorized(false);
    setActions([]);
  };

  const renderAction = (action: string, date: string) => {
    const formatted = new Date(date).toLocaleString("es-ES", {
      hour: "2-digit",
      minute: "2-digit"
    });

    switch (action) {
      case "arrive_home":
        return {
          icon: (
            <Home className="text-violet-600 bg-violet-200 rounded-md p-[2px] h-6 w-6" />
          ),
          message: `Lucía llegó a casa a las ${formatted}`,
        };
      case "leave_home":
        return {
          icon: (
            <LogOut className="text-violet-600 bg-violet-200 rounded-md p-[2px] h-6 w-6" />
          ),
          message: `Lucía salió de casa a las ${formatted}`,
        };
      case "arrive_high_school":
        return {
          icon: (
            <School className="text-blue-600 bg-blue-200 rounded-md p-[2px] h-6 w-6" />
          ),
          message: `Lucía llegó al insti a las ${formatted}`,
        };
      case "leave_high_school":
        return {
          icon: (
            <LogOut className="text-blue-600 bg-blue-200 rounded-md p-[2px] h-6 w-6" />
          ),
          message: `Lucía salió del insti a las ${formatted}`,
        };
      case "arrive_gf_home":
        return {
          icon: (
            <Heart className="text-fuchsia-600 bg-fuchsia-200 rounded-md p-[2px] h-6 w-6" />
          ),
          message: `Lucía llegó a casa de su novia a las ${formatted}`,
        };
      case "leave_gf_home":
        return {
          icon: (
            <LogOut className="text-fuchsia-600 bg-fuchsia-200 rounded-md p-[2px] h-6 w-6" />
          ),
          message: `Lucía salió de casa de su novia a las ${formatted}`,
        };
      case "arrive_job":
        return {
          icon: (
            <Briefcase className="text-fuchsia-600 bg-fuchsia-200 rounded-md p-[2px] h-6 w-6" />
          ),
          message: `Lucía llegó al trabajo a las ${formatted}`,
        };
      case "leave_job":
        return {
          icon: (
            <LogOut className="text-fuchsia-600 bg-fuchsia-200 rounded-md p-[2px] h-6 w-6" />
          ),
          message: `Lucía salió del trabajo a las ${formatted}`,
        };
      case "sleep":
        return {
          icon: (
            <Moon className="text-indigo-600 bg-indigo-200 rounded-md p-[2px] h-6 w-6" />
          ),
          message: `Lucía se fue a dormir a las ${formatted}`,
        };
      case "wakeup":
        return {
          icon: (
            <Moon className="text-indigo-600 bg-cyan-200 rounded-md p-[2px] h-6 w-6" />
          ),
          message: `Lucía se despertó a las ${formatted}`,
        };
      default:
        return {
          icon: null,
          message: `Acción desconocida (${action}) a las ${formatted}`,
        };
    }
  };

  const groupedByDate = actions.reduce((acc, curr) => {
    const date = new Date(curr.created_at).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    acc[date] = acc[date] || [];
    acc[date].push(curr);
    return acc;
  }, {} as Record<string, ActionRecord[]>);

  const allDates = Object.keys(groupedByDate);
  const visibleDates = allDates.slice(0, daysToShow);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-pink-100 to-fuchsia-100">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full transform transition-all hover:scale-105">
          <h1 className="text-3xl font-bold text-center text-fuchsia-600 mb-6">Lucía Logs</h1>
          <p className="text-gray-600 text-center mb-8">Inicia sesión para ver tus actividades recientes</p>
          <div className="flex justify-center">
            <button
              onClick={handleLogin}
              className="bg-gradient-to-r from-pink-400 to-fuchsia-500 text-white px-6 py-3 rounded-xl hover:from-pink-600 hover:to-fuchsia-600 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Iniciar sesión con Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-pink-100">
        <p className="text-red-500 text-xl">
          No estás autorizado para ver este contenido.
        </p>
        <button
          onClick={handleLogout}
          className="mt-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
        >
          Cerrar sesión
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pink-50 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-fuchsia-700 mb-6">
          ¡Bienvenida Lucía!
        </h1>
        {actions.length === 0 ? (
          <p className="text-gray-700">No hay acciones registradas.</p>
        ) : (
          <div className="space-y-8">
            {visibleDates.map((date) => (
              <div key={date}>
                <h2 className="text-xl font-semibold text-fuchsia-600 mb-2 border-b border-fuchsia-300 pb-1">
                  {date}
                </h2>
                <ul className="space-y-4">
                  {groupedByDate[date]
                    .sort((a, b) =>
                      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                    )
                    .map((action) => {
                      const { icon, message } = renderAction(
                        action.action,
                        action.created_at
                      );
                      return (
                        <li
                          key={action.id}
                          className="bg-white border-pink-100 border-[1px] p-4 rounded-md flex items-center gap-3"
                        >
                          <div className="mt-1">{icon}</div>
                          <div className="text-gray-800">
                            <p className="font-medium">{message}</p>
                          </div>
                        </li>
                      );
                    })}
                </ul>
              </div>
            ))}
            {daysToShow < allDates.length && (
              <div className="text-center">
                <button
                  onClick={() => setDaysToShow(daysToShow + 3)}
                  className="mt-4 bg-fuchsia-400 text-white px-4 py-2 rounded-xl hover:bg-fuchsia-600 transition"
                >
                  Cargar más días
                </button>
              </div>
            )}
          </div>
        )}
        <button
          onClick={handleLogout}
          className="mt-10 bg-fuchsia-400 text-white px-4 py-2 rounded-xl hover:bg-fuchsia-600 transition"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export default App;
