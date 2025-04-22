import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import { User } from "@supabase/supabase-js";
import { Home, LogOut, School, Heart, Briefcase } from "lucide-react";

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
      dateStyle: "full",
      timeStyle: "short",
    });

    switch (action) {
      case "arrive_home":
        return {
          icon: (
            <Home className="text-green-600 bg-green-200 rounded-md p-[2px] h-6 w-6" />
          ),
          message: `Lucía llegó a casa el ${formatted}`,
        };
      case "leave_home":
        return {
          icon: (
            <LogOut className="text-green-600 bg-green-200 rounded-md p-[2px] h-6 w-6" />
          ),
          message: `Lucía salió de casa el ${formatted}`,
        };
      case "arrive_high_school":
        return {
          icon: (
            <School className="text-blue-600 bg-blue-200 rounded-md p-[2px] h-6 w-6" />
          ),
          message: `Lucía llegó al insti el ${formatted}`,
        };
      case "leave_high_school":
        return {
          icon: (
            <LogOut className="text-blue-600 bg-blue-200 rounded-md p-[2px] h-6 w-6" />
          ),
          message: `Lucía salió del insti el ${formatted}`,
        };
      case "arrive_gf_home":
        return {
          icon: (
            <Heart className="text-fuchsia-600 bg-fuchsia-200 rounded-md p-[2px] h-6 w-6" />
          ),
          message: `Lucía llegó a casa de su novia el ${formatted}`,
        };
      case "leave_gf_home":
        return {
          icon: (
            <LogOut className="text-fuchsia-600 bg-fuchsia-200 rounded-md p-[2px] h-6 w-6" />
          ),
          message: `Lucía salió de casa de su novia el ${formatted}`,
        };
      case "arrive_job":
        return {
          icon: (
            <Briefcase className="text-yellow-600 bg-yellow-200 rounded-md p-[2px] h-6 w-6" />
          ),
          message: `Lucía llegó al trabajo el ${formatted}`,
        };
      case "leave_job":
        return {
          icon: (
            <LogOut className="text-yellow-600 bg-yellow-200 rounded-md p-[2px] h-6 w-6" />
          ),
          message: `Lucía salió del trabajo el ${formatted}`,
        };
      default:
        return {
          icon: null,
          message: `Acción desconocida (${action}) el ${formatted}`,
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
      <div className="flex flex-col items-center justify-center h-screen bg-pink-100">
        <button
          onClick={handleLogin}
          className="bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600 transition"
        >
          Iniciar sesión con Google
        </button>
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
    <div className="min-h-screen bg-pink-100 p-4">
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
                  {groupedByDate[date].map((action) => {
                    const { icon, message } = renderAction(
                      action.action,
                      action.created_at
                    );
                    return (
                      <li
                        key={action.id}
                        className="bg-white border-pink-100 border-[1px] p-4 rounded-md flex items-start gap-3"
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
