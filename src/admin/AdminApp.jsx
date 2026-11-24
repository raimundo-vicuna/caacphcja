import { useEffect, useState } from "react";
import { Link, NavLink, Navigate, Route, Routes } from "react-router-dom";
import { supabase, configured } from "../lib/supabase";
import Suggestions from "./Suggestions";
import Crud from "./Crud";
import Settings from "./Settings";
import Admins from "./Admins";
import SetPassword from "./SetPassword";
import { SECTIONS } from "./sections";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError("Correo o contraseña incorrectos.");
    setBusy(false);
  };

  return (
    <div className="adm-login">
      <form className="adm-login__box" onSubmit={submit}>
        <h1>Portal administrador</h1>
        <p>Centro de Alumnos</p>
        {error && <div className="adm-alert adm-alert--err">{error}</div>}
        <label>
          Correo
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button className="adm-btn" disabled={busy}>
          {busy ? "Entrando…" : "Entrar"}
        </button>
        <Link to="/" className="adm-link">
          ← Volver a la página
        </Link>
      </form>
    </div>
  );
}

function Panel({ session }) {
  const [menu, setMenu] = useState(false);
  const links = [
    { to: "/admin/sugerencias", label: "Sugerencias" },
    ...SECTIONS.map((s) => ({ to: `/admin/${s.path}`, label: s.title })),
    { to: "/admin/administradores", label: "Administradores" },
    { to: "/admin/ajustes", label: "Ajustes de la página" },
  ];
  return (
    <div className="adm">
      <aside className={`adm-side ${menu ? "adm-side--open" : ""}`}>
        <div className="adm-side__head">
          <strong>Panel admin</strong>
          <button
            className="adm-burger"
            onClick={() => setMenu(!menu)}
            aria-label="Menú"
          >
            ☰
          </button>
        </div>
        <nav onClick={() => setMenu(false)}>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="adm-side__foot">
          <small>{session.user.email}</small>
          <Link to="/" className="adm-link">
            Ver la página
          </Link>
          <button
            className="adm-btn adm-btn--ghost"
            onClick={() => supabase.auth.signOut()}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="adm-main">
        <Routes>
          <Route path="sugerencias" element={<Suggestions />} />
          {SECTIONS.map((s) => (
            <Route
              key={s.path}
              path={s.path}
              element={<Crud key={s.path} {...s} />}
            />
          ))}
          <Route path="administradores" element={<Admins />} />
          <Route path="establecer-clave" element={<SetPassword />} />
          <Route path="ajustes" element={<Settings />} />
          <Route path="*" element={<Navigate to="/admin/sugerencias" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function AdminApp() {
  const [session, setSession] = useState(undefined); // undefined = cargando
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    if (!configured) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let active = true;

    if (!session) {
      setIsAdmin(null);
      return;
    }

    setIsAdmin(null);
    supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (active) setIsAdmin(!error && Boolean(data));
      });

    return () => {
      active = false;
    };
  }, [session]);

  if (!configured) {
    return (
      <div className="adm-login">
        <div className="adm-login__box">
          <h1>Portal no configurado</h1>
          <p>
            Faltan las claves de Supabase. Sigue los pasos del archivo
            README.md.
          </p>
          <Link to="/" className="adm-link">
            ← Volver a la página
          </Link>
        </div>
      </div>
    );
  }
  if (session === undefined || (session && isAdmin === null))
    return <div className="adm-loading">Cargando…</div>;
  if (!session) return <Login />;
  if (!isAdmin) {
    return (
      <div className="adm-login">
        <div className="adm-login__box">
          <h1>Sin permisos</h1>
          <p>
            Tu cuenta ({session.user.email}) no está autorizada como
            administradora.
          </p>
          <button className="adm-btn" onClick={() => supabase.auth.signOut()}>
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }
  return <Panel session={session} />;
}
