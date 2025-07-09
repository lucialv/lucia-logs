import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import { User } from "@supabase/supabase-js";
import { Home, LogOut, School, Heart, Briefcase, Moon, Sun } from "lucide-react";

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
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const allowedEmail = import.meta.env.VITE_ALLOWED_EMAIL;

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

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
            <Home className="text-violet-500 dark:text-violet-300 bg-violet-100 dark:bg-violet-900/30 rounded-md p-[2px] h-6 w-6" />
          ),
          message: `Lucía llegó a casa a las ${formatted}`,
        };
      case "leave_home":
        return {
          icon: (
            <LogOut className="text-violet-500 dark:text-violet-300 bg-violet-100 dark:bg-violet-900/30 rounded-md p-[2px] h-6 w-6" />
          ),
          message: `Lucía salió de casa a las ${formatted}`,
        };
      case "arrive_high_school":
        return {
          icon: (
            <School className="text-sky-500 dark:text-sky-300 bg-sky-100 dark:bg-sky-900/30 rounded-md p-[2px] h-6 w-6" />
          ),
          message: `Lucía llegó al insti a las ${formatted}`,
        };
      case "leave_high_school":
        return {
          icon: (
            <LogOut className="text-sky-500 dark:text-sky-300 bg-sky-100 dark:bg-sky-900/30 rounded-md p-[2px] h-6 w-6" />
          ),
          message: `Lucía salió del insti a las ${formatted}`,
        };
      case "arrive_gf_home":
        return {
          icon: (
            <Heart className="text-rose-500 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/30 rounded-md p-[2px] h-6 w-6" />
          ),
          message: `Lucía llegó a casa de su novia a las ${formatted}`,
        };
      case "leave_gf_home":
        return {
          icon: (
            <LogOut className="text-rose-500 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/30 rounded-md p-[2px] h-6 w-6" />
          ),
          message: `Lucía salió de casa de su novia a las ${formatted}`,
        };
      case "arrive_job":
        return {
          icon: (
            <Briefcase className="text-emerald-500 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/30 rounded-md p-[2px] h-6 w-6" />
          ),
          message: `Lucía llegó al trabajo a las ${formatted}`,
        };
      case "leave_job":
        return {
          icon: (
            <LogOut className="text-emerald-500 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/30 rounded-md p-[2px] h-6 w-6" />
          ),
          message: `Lucía salió del trabajo a las ${formatted}`,
        };
      case "sleep":
        return {
          icon: (
            <Moon className="text-indigo-500 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/30 rounded-md p-[2px] h-6 w-6" />
          ),
          message: `Lucía se fue a dormir a las ${formatted}`,
        };
      case "wakeup":
        return {
          icon: (
            <Moon className="text-indigo-500 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/30 rounded-md p-[2px] h-6 w-6" />
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
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 p-4 duration-300 transition-all">
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-lg bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 border border-pink-200 dark:border-neutral-700"
          >
            {isDark ? (
              <Sun className="h-5 w-5 text-amber-500" />
            ) : (
              <Moon className="h-5 w-5 text-indigo-500" />
            )}
          </button>
        </div>
        <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm p-8 rounded-2xl shadow-lg max-w-md w-full transform transition-all hover:scale-105 border border-pink-200 dark:border-neutral-700">
          <h1 className="text-3xl font-bold text-center text-pink-500 dark:text-pink-400 mb-6">Lucía Logs</h1>
          <p className="text-neutral-600 dark:text-neutral-300 text-center mb-8">Inicia sesión para ver tus actividades recientes</p>
          <div className="flex justify-center">
            <button
              onClick={handleLogin}
              className="bg-gradient-to-r from-pink-300 to-purple-400 dark:from-pink-500 dark:to-purple-600 text-white px-6 py-3 rounded-xl hover:from-pink-400 hover:to-purple-500 dark:hover:from-pink-600 dark:hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
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
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 p-4 duration-300 transition-all">
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-lg bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 border border-pink-200 dark:border-neutral-700"
          >
            {isDark ? (
              <Sun className="h-5 w-5 text-amber-500" />
            ) : (
              <Moon className="h-5 w-5 text-indigo-500" />
            )}
          </button>
        </div>
        <p className="text-red-400 dark:text-red-300 text-xl">
          No estás autorizado para ver este contenido.
        </p>
        <button
          onClick={handleLogout}
          className="mt-4 bg-neutral-400 dark:bg-neutral-600 text-white px-4 py-2 rounded hover:bg-neutral-500 dark:hover:bg-neutral-700 transition"
        >
          Cerrar sesión
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 p-4 duration-300 transition-all">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-fuchsia-400 dark:text-purple-600">
            ¡Bienvenida Lucía!
          </h1>
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-lg bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm  hover:scale-105 hover:rotate-1 transition-all duration-300 border border-neutral-200 dark:border-neutral-700"
          >
            {isDark ? (
              <Sun className="h-5 w-5 text-amber-500" />
            ) : (
              <Moon className="h-5 w-5 text-indigo-500" />
            )}
          </button>
        </div>
        {actions.length === 0 ? (
          <p className="text-neutral-600 dark:text-neutral-300">No hay acciones registradas.</p>
        ) : (
          <div className="space-y-8">
            {visibleDates.map((date) => (
              <div key={date}>
                <h2 className="text-xl font-semibold text-purple-500 dark:text-purple-400 mb-2 border-b border-purple-200 dark:border-purple-600 pb-1">
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
                          className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm border-pink-100 dark:border-neutral-700 border-[1px] p-4 rounded-lg flex items-center gap-3 shadow-sm hover:shadow-md transition-all duration-300"
                        >
                          <div className="mt-1">{icon}</div>
                          <div className="text-neutral-700 dark:text-neutral-200">
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
                  className="mt-4 bg-gradient-to-r from-pink-300 to-purple-400 dark:from-pink-500 dark:to-purple-600 text-white px-4 py-2 rounded-xl hover:from-pink-400 hover:to-purple-500 dark:hover:from-pink-600 dark:hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  Cargar más días
                </button>
              </div>
            )}
          </div>
        )}
        <button
          onClick={handleLogout}
          className="mt-10 bg-gradient-to-r from-pink-300 to-purple-400 dark:from-pink-500 dark:to-purple-600 text-white px-4 py-2 rounded-xl hover:from-pink-400 hover:to-purple-500 dark:hover:from-pink-600 dark:hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export default App;
