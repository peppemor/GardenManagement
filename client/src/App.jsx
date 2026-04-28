import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import ProtectedRoute from "./components/ProtectedRoute";
import Topbar from "./components/Topbar";
import Login from "./pages/Login";
import Dashboard from "./pages/admin/Dashboard";
import Clienti from "./pages/admin/Clienti";
import Operatori from "./pages/admin/Operatori";
import Rapporti from "./pages/admin/Rapporti";
import Impostazioni from "./pages/admin/Impostazioni";
import HomeOperatore from "./pages/operatore/Home";
import BozzeOperatore from "./pages/operatore/Bozze";
import RifiutatiOperatore from "./pages/operatore/Rifiutati";
import LeRichiesteOperatore from "./pages/operatore/LeRichieste";
import ClienteDettaglio from "./pages/operatore/ClienteDettaglio";
import NuovoRapporto from "./pages/operatore/NuovoRapporto";
import VisualizzaRapporto from "./pages/VisualizzaRapporto";
import { getAuth, subscribeAuthChange } from "./components/api";

function HomeRedirect() {
  const auth = getAuth();
  if (!auth?.user) return <Navigate to="/login" replace />;
  return auth.user.ruolo === "admin" ? (
    <Navigate to="/admin" replace />
  ) : (
    <Navigate to="/operatore" replace />
  );
}

export default function App() {
  const [auth, setAuth] = useState(() => getAuth());

  useEffect(() => {
    const syncAuth = () => setAuth(getAuth());
    return subscribeAuthChange(syncAuth);
  }, []);

  return (
    <div className="app-shell">
      {auth?.token && auth?.user ? <Topbar auth={auth} /> : null}
      <main className="page">
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["admin"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/clienti"
            element={
              <ProtectedRoute roles={["admin"]}>
                <Clienti />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/operatori"
            element={
              <ProtectedRoute roles={["admin"]}>
                <Operatori />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/template"
            element={
              <ProtectedRoute roles={["admin"]}>
                <Navigate to="/admin/impostazioni" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/rapporti"
            element={
              <ProtectedRoute roles={["admin"]}>
                <Rapporti />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/rapporti/:id"
            element={
              <ProtectedRoute roles={["admin"]}>
                <VisualizzaRapporto />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/impostazioni"
            element={
              <ProtectedRoute roles={["admin"]}>
                <Impostazioni />
              </ProtectedRoute>
            }
          />

          <Route
            path="/operatore"
            element={
              <ProtectedRoute roles={["operatore"]}>
                <HomeOperatore />
              </ProtectedRoute>
            }
          />
          <Route
            path="/operatore/bozze"
            element={
              <ProtectedRoute roles={["operatore"]}>
                <BozzeOperatore />
              </ProtectedRoute>
            }
          />
          <Route
            path="/operatore/rifiutati"
            element={
              <ProtectedRoute roles={["operatore"]}>
                <RifiutatiOperatore />
              </ProtectedRoute>
            }
          />
          <Route
            path="/operatore/richieste"
            element={
              <ProtectedRoute roles={["operatore"]}>
                <LeRichiesteOperatore />
              </ProtectedRoute>
            }
          />
          <Route
            path="/operatore/nuovo-rapporto"
            element={
              <ProtectedRoute roles={["operatore"]}>
                <NuovoRapporto />
              </ProtectedRoute>
            }
          />
          <Route
            path="/operatore/clienti/:id"
            element={
              <ProtectedRoute roles={["operatore"]}>
                <ClienteDettaglio />
              </ProtectedRoute>
            }
          />
          <Route
            path="/operatore/clienti/:id/nuovo-rapporto"
            element={
              <ProtectedRoute roles={["operatore"]}>
                <NuovoRapporto />
              </ProtectedRoute>
            }
          />
          <Route
            path="/operatore/bozze/:bozzaId/modifica"
            element={
              <ProtectedRoute roles={["operatore"]}>
                <NuovoRapporto />
              </ProtectedRoute>
            }
          />
          <Route
            path="/operatore/rapporti/:id"
            element={
              <ProtectedRoute roles={["operatore"]}>
                <VisualizzaRapporto />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
