import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownUp, ArrowUpRight, Bookmark, Check, ChevronDown, CirclePlus, Copy,
  Eye, EyeOff, Filter, Layers3, LogOut, LockKeyhole, Search, Sparkles,
  ThumbsUp, Trash2, WandSparkles, X
} from "lucide-react";
import { api } from "./api.js";

const categories = ["Desarrollo", "Marketing", "Diseno", "Educacion", "Productividad", "Otro"];
const blankForm = { title: "", content: "", category: "Desarrollo", visibility: "public" };

function App() {
  const [user, setUser] = useState(null);
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");
  const [scope, setScope] = useState("Todos");
  const [sort, setSort] = useState("recent");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadPrompts = useCallback(async () => {
    try {
      const result = await api("/prompts");
      setPrompts(result.prompts);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api("/auth/me")
      .then(({ user: currentUser }) => setUser(currentUser))
      .catch((requestError) => {
        if (requestError.status !== 401) setError(requestError.message);
      });
    loadPrompts();
  }, [loadPrompts]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const visiblePrompts = useMemo(() => {
    const filtered = prompts.filter((prompt) => {
      const matchesQuery = `${prompt.title} ${prompt.content} ${prompt.owner?.name || ""}`
        .toLowerCase().includes(query.toLowerCase());
      return (
        matchesQuery &&
        (category === "Todas" || prompt.category === category) &&
        (scope === "Todos" || (scope === "Mis prompts" ? prompt.isOwner : !prompt.isOwner))
      );
    });
    return filtered.sort((a, b) =>
      sort === "votes" ? b.voteCount - a.voteCount : new Date(b.createdAt) - new Date(a.createdAt)
    );
  }, [prompts, query, category, scope, sort]);

  async function submitAuth(event) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const result = await api(`/auth/${authMode === "login" ? "login" : "register"}`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setUser(result.user);
      setAuthOpen(false);
      setNotice(`Hola, ${result.user.name}. Sesion iniciada.`);
      await loadPrompts();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function logout() {
    try {
      await api("/auth/logout", { method: "POST" });
      setUser(null);
      setScope("Todos");
      await loadPrompts();
      setNotice("Sesion cerrada correctamente.");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function savePrompt(event) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      await api(editing ? `/prompts/${editing._id}` : "/prompts", {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify(payload)
      });
      setFormOpen(false);
      setEditing(null);
      setNotice(editing ? "Prompt actualizado y version guardada." : "Prompt publicado correctamente.");
      await loadPrompts();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function vote(prompt) {
    if (!user) {
      setAuthMode("login");
      setAuthOpen(true);
      return;
    }
    try {
      await api(`/prompts/${prompt._id}/vote`, { method: "POST" });
      await loadPrompts();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function deletePrompt(prompt) {
    if (!window.confirm(`Eliminar "${prompt.title}"? Esta accion no se puede deshacer.`)) return;
    try {
      await api(`/prompts/${prompt._id}`, { method: "DELETE" });
      setNotice("Prompt eliminado.");
      await loadPrompts();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function copyPrompt(content) {
    try {
      await navigator.clipboard.writeText(content);
      setNotice("Contenido copiado al portapapeles.");
    } catch {
      setError("No se pudo copiar. Verifica los permisos del navegador.");
    }
  }

  function openEditor(prompt = null) {
    if (!user) {
      setAuthMode("login");
      setAuthOpen(true);
      return;
    }
    setEditing(prompt);
    setFormOpen(true);
  }

  return (
    <div className="min-h-screen bg-canvas text-slate-100">
      <header className="sticky top-0 z-20 border-b border-white/[0.07] bg-canvas/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <a className="flex items-center gap-3" href="#">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-slate-950 shadow-lg shadow-violet-500/20"><Layers3 size={21} /></span>
            <span><strong className="block text-lg font-semibold tracking-tight">PromptVault</strong><small className="text-xs text-slate-500">Tu biblioteca de IA</small></span>
          </a>
          <nav className="hidden items-center gap-8 text-sm text-slate-400 md:flex">
            <a className="text-white" href="#explorar">Explorar</a><a href="#explorar">Categorias</a><a href="#como-funciona">Como funciona</a>
          </nav>
          <div className="flex items-center gap-3">
            {user ? <><span className="hidden text-sm text-slate-300 sm:block">{user.name}</span><button className="button-muted !px-3" onClick={logout} title="Cerrar sesion"><LogOut size={16} /><span className="hidden sm:inline">Salir</span></button></> :
              <><button className="hidden px-3 py-2 text-sm text-slate-300 sm:block" onClick={() => { setAuthMode("login"); setAuthOpen(true); }}>Iniciar sesion</button><button className="button-primary !py-2.5" onClick={() => { setAuthMode("register"); setAuthOpen(true); }}>Crear cuenta <ArrowUpRight size={16} /></button></>}
          </div>
        </div>
      </header>

      <main>
        <section className="hero-grid relative overflow-hidden border-b border-white/[0.06]">
          <div className="pointer-events-none absolute -right-16 -top-32 h-[30rem] w-[30rem] rounded-full bg-violet-600/15 blur-[110px]" />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-20 md:grid-cols-[1.15fr_.85fr] md:items-center md:py-28 lg:px-8">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/[0.07] px-3 py-1.5 text-xs font-medium text-violet-200"><Sparkles size={14} /> Conocimiento colectivo, mejores resultados</div>
              <h1 className="max-w-2xl text-5xl font-semibold leading-[1.08] tracking-[-0.045em] sm:text-6xl">Tus mejores ideas de IA, <span className="text-violet-300">siempre a mano.</span></h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-slate-400">Guarda, organiza y comparte prompts que realmente funcionan. Una biblioteca creada por personas, para personas.</p>
              <div className="mt-8 flex flex-wrap gap-3"><a className="button-primary" href="#explorar">Explorar prompts <ArrowUpRight size={17} /></a><button className="button-muted" onClick={() => openEditor()}><CirclePlus size={17} /> Crear un prompt</button></div>
              <div className="mt-12 flex gap-8"><div><strong className="text-2xl">{prompts.length}</strong><p className="mt-1 text-xs text-slate-500">Prompts compartidos</p></div><div><strong className="text-2xl">{categories.length - 1}</strong><p className="mt-1 text-xs text-slate-500">Categorias</p></div><div><strong className="text-2xl">100%</strong><p className="mt-1 text-xs text-slate-500">Hecho para crear</p></div></div>
            </div>
            <div className="relative hidden md:block"><div className="absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-violet-500/20 via-blue-500/5 to-transparent blur-2xl" /><div className="relative rounded-2xl border border-white/10 bg-panel/90 p-5 shadow-2xl shadow-black/40">
              <div className="mb-6 flex items-center justify-between"><div className="flex gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-rose-400/70" /><i className="h-2.5 w-2.5 rounded-full bg-amber-300/70" /><i className="h-2.5 w-2.5 rounded-full bg-emerald-300/70" /></div><span className="text-xs text-slate-500">prompt_que_si_funciona.md</span><Bookmark size={16} className="text-violet-300" /></div>
              <div className="mb-4 inline-flex rounded-md bg-emerald-300/10 px-2 py-1 text-[10px] font-medium text-emerald-300">DESARROLLO · VERSION 3</div><p className="font-mono text-sm leading-7 text-slate-300"><span className="text-violet-300">Actua como</span> un ingeniero de software senior. Analiza el siguiente codigo y propone mejoras siguiendo principios de clean code...</p>
              <div className="mt-5 flex items-center justify-between border-t border-white/[0.07] pt-4 text-xs text-slate-500"><span>Compartido por <b className="font-medium text-slate-300">maria.dev</b></span><span className="flex items-center gap-1 text-slate-300"><ThumbsUp size={14} /> 128</span></div>
            </div></div>
          </div>
        </section>

        <section id="explorar" className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-violet-300"><WandSparkles size={14} /> La comunidad comparte</div><h2 className="text-3xl font-semibold tracking-tight">Explora la biblioteca</h2><p className="mt-2 text-sm text-slate-500">Encuentra el punto de partida para tu siguiente gran idea.</p></div><button className="button-muted" onClick={() => openEditor()}><CirclePlus size={17} /> Nuevo prompt</button></div>
          <div className="mb-6 flex flex-col gap-3 lg:flex-row">
            <label className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={17} /><input className="field !pl-11" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar prompts, categorias o autores..." /></label>
            <div className="flex flex-wrap gap-2">
              <label className="select-wrap"><Filter size={14} /><select value={category} onChange={(event) => setCategory(event.target.value)}><option>Todas</option>{categories.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={14} /></label>
              {user && <label className="select-wrap"><Eye size={14} /><select value={scope} onChange={(event) => setScope(event.target.value)}><option>Todos</option><option>Mis prompts</option><option>Comunidad</option></select><ChevronDown size={14} /></label>}
              <button className="button-muted !px-3" onClick={() => setSort(sort === "recent" ? "votes" : "recent")} title="Cambiar orden"><ArrowDownUp size={16} /><span className="hidden sm:inline">{sort === "recent" ? "Mas recientes" : "Mas votados"}</span></button>
            </div>
          </div>
          <div className="mb-5 flex items-center justify-between text-xs text-slate-500"><span>{visiblePrompts.length} prompts encontrados</span><span className="hidden items-center gap-1 sm:flex"><LockKeyhole size={13} /> Tus prompts privados solo los ves tu</span></div>
          {error && <div role="alert" className="mb-5 flex items-center justify-between rounded-xl border border-rose-400/20 bg-rose-400/[0.07] px-4 py-3 text-sm text-rose-200">{error}<button onClick={() => setError("")} aria-label="Cerrar aviso"><X size={16} /></button></div>}
          {loading ? <div className="py-20 text-center text-slate-500">Cargando biblioteca...</div> : visiblePrompts.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visiblePrompts.map((prompt) => <article key={prompt._id} className="prompt-card group">
            <div className="mb-4 flex items-start justify-between gap-3"><span className="category-pill">{prompt.category}</span><div className="flex items-center gap-2">{prompt.visibility === "private" && <span title="Privado" className="text-slate-500"><EyeOff size={15} /></span>}<span className="text-xs text-slate-500">v{prompt.version}</span></div></div>
            <h3 className="mb-2 text-lg font-semibold leading-snug">{prompt.title}</h3><p className="prompt-content">{prompt.content}</p>
            <div className="mt-5 flex flex-wrap items-center gap-1.5">{prompt.content.toLowerCase().includes("codigo") && <span className="tag">#codigo</span>}<span className="tag">#prompt</span></div>
            <div className="mt-5 flex items-center justify-between border-t border-white/[0.07] pt-4"><div className="flex items-center gap-2.5"><span className="avatar">{prompt.owner?.name?.slice(0, 1).toUpperCase() || "?"}</span><div><p className="text-xs font-medium text-slate-300">{prompt.isOwner ? "Tu" : prompt.owner?.name}</p><p className="text-[10px] text-slate-600">{new Date(prompt.createdAt).toLocaleDateString("es-ES")}</p></div></div><div className="flex items-center gap-1">
              {prompt.isOwner && <><button className="icon-button" title="Editar prompt" onClick={() => openEditor(prompt)}><WandSparkles size={15} /></button><button className="icon-button hover:!text-rose-300" title="Eliminar prompt" onClick={() => deletePrompt(prompt)}><Trash2 size={15} /></button></>}
              <button className={`vote-button ${prompt.hasVoted ? "voted" : ""}`} onClick={() => vote(prompt)} aria-label={`${prompt.voteCount} votos`}><ThumbsUp size={14} /> {prompt.voteCount}</button></div></div>
            <button onClick={() => copyPrompt(prompt.content)} className="copy-button"><Copy size={14} /> Copiar prompt</button>
          </article>)}</div> : <div className="rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center"><div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-violet-300/10 text-violet-200"><Search size={20} /></div><h3 className="font-medium">Todavia no hay prompts por aqui</h3><p className="mt-2 text-sm text-slate-500">{query ? "Prueba con otra busqueda o categoria." : "Inicia sesion y comparte tu primer prompt con la comunidad."}</p></div>}
        </section>

        <section id="como-funciona" className="border-y border-white/[0.06] bg-white/[0.015]"><div className="mx-auto max-w-7xl px-5 py-14 lg:px-8"><div className="mb-8 text-center"><p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-violet-300">Simple por diseno</p><h2 className="text-2xl font-semibold">De una idea a un gran resultado</h2></div><div className="grid gap-4 md:grid-cols-3">{[["01", "Crea tu biblioteca", "Guarda tus prompts favoritos, organizados por categoria y siempre con su historial de versiones."], ["02", "Comparte lo que funciona", "Publica tus mejores ideas para que la comunidad pueda descubrirlas y votar por ellas."], ["03", "Mejora en comunidad", "Encuentra nuevas formas de trabajar y construye mejores resultados, un prompt a la vez."]].map(([number, title, description]) => <div className="rounded-xl border border-white/[0.07] bg-panel/60 p-5" key={number}><span className="text-sm font-semibold text-violet-300">{number}</span><h3 className="mt-4 font-medium">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p></div>)}</div></div></section>
      </main>

      <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-7 text-xs text-slate-600 lg:px-8"><span>PromptVault · Proyecto academico de Tecnologias en Internet</span><span>Construido para compartir mejores ideas.</span></footer>

      {notice && <div role="status" className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-xl border border-emerald-300/20 bg-panel px-4 py-3 text-sm shadow-xl"><Check className="text-emerald-300" size={16} />{notice}</div>}

      {authOpen && <Modal title={authMode === "login" ? "Que bueno verte" : "Crea tu cuenta"} subtitle={authMode === "login" ? "Inicia sesion para continuar con tus ideas." : "Unete y comparte tus prompts con la comunidad."} onClose={() => setAuthOpen(false)}>
        {error && <p role="alert" className="mb-4 rounded-lg border border-rose-400/20 bg-rose-400/[0.07] px-3 py-2 text-sm text-rose-200">{error}</p>}
        <form className="space-y-4" onSubmit={submitAuth}>{authMode === "register" && <Field label="Nombre" name="name" placeholder="Tu nombre" required maxLength={60} />}<Field label="Correo electronico" name="email" type="email" placeholder="tu@correo.com" required maxLength={254} /><Field label="Contrasena" name="password" type="password" placeholder="Minimo 8 caracteres" required minLength={8} /><button className="button-primary mt-2 w-full justify-center" type="submit">{authMode === "login" ? "Iniciar sesion" : "Crear cuenta"} <ArrowUpRight size={16} /></button></form>
        <p className="mt-5 text-center text-sm text-slate-500">{authMode === "login" ? "Aun no tienes cuenta?" : "Ya tienes una cuenta?"} <button className="text-violet-300 hover:text-violet-200" onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setError(""); }}>{authMode === "login" ? "Registrate" : "Inicia sesion"}</button></p>
      </Modal>}

      {formOpen && <Modal title={editing ? "Edita tu prompt" : "Comparte un prompt"} subtitle={editing ? "Al cambiar el contenido se guardara una nueva version." : "Cuanto mas claro, mas util sera para todos."} onClose={() => { setFormOpen(false); setEditing(null); }} wide>
        {error && <p role="alert" className="mb-4 rounded-lg border border-rose-400/20 bg-rose-400/[0.07] px-3 py-2 text-sm text-rose-200">{error}</p>}
        <form className="space-y-4" onSubmit={savePrompt}><Field label="Titulo" name="title" placeholder="Ej. Revisor de codigo accesible" required maxLength={120} defaultValue={editing?.title} /><label className="block"><span className="field-label">Contenido del prompt</span><textarea className="field min-h-36 resize-y" name="content" placeholder="Escribe el prompt completo..." required maxLength={10000} defaultValue={editing?.content} /></label><div className="grid gap-4 sm:grid-cols-2"><label><span className="field-label">Categoria</span><select className="field" name="category" defaultValue={editing?.category || "Desarrollo"}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label><span className="field-label">Visibilidad</span><select className="field" name="visibility" defaultValue={editing?.visibility || "public"}><option value="public">Publico: visible para todos</option><option value="private">Privado: solo para mi</option></select></label></div><button className="button-primary mt-2 w-full justify-center" type="submit">{editing ? "Guardar cambios" : "Publicar prompt"} <ArrowUpRight size={16} /></button></form>
      </Modal>}
    </div>
  );
}

function Modal({ title, subtitle, onClose, children, wide = false }) {
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className={`modal-panel ${wide ? "max-w-2xl" : "max-w-md"}`} role="dialog" aria-modal="true" aria-label={title}><div className="mb-6 flex items-start justify-between"><div><h2 className="text-xl font-semibold">{title}</h2><p className="mt-1 text-sm text-slate-500">{subtitle}</p></div><button className="icon-button" onClick={onClose} aria-label="Cerrar"><X size={18} /></button></div>{children}</div></div>;
}

function Field({ label, ...props }) {
  return <label className="block"><span className="field-label">{label}</span><input className="field" {...props} /></label>;
}

export default App;
