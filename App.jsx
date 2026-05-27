import { useState, useEffect, useRef } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";
import {
  collection, addDoc, query, where, orderBy,
  onSnapshot, serverTimestamp, doc, setDoc,
  getDoc, getDocs, updateDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "./firebase";

// ── Helpers ──────────────────────────────────────────────────────────────────
const AVATARS = ["🌺","⚡","🌙","🎵","🎉","🚀","🔥","💡","🌊","🦋","🌸","🎯"];
const COLORS  = ["#2d1b4e","#1a1a2e","#2e1a0e","#2e0e1a","#1a2e1a","#0e2e1a","#2e2a0e","#0e1a2e"];
const randAv  = () => AVATARS[Math.floor(Math.random()*AVATARS.length)];
const randCol = () => COLORS[Math.floor(Math.random()*COLORS.length)];
const nowTime = () => new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});
const convId  = (a,b) => [a,b].sort().join("_");

// ── Avatar ────────────────────────────────────────────────────────────────────
function Av({ av, col, online, sz = 44 }) {
  return (
    <div style={{ position:"relative", width:sz, height:sz, flexShrink:0 }}>
      <div style={{ width:sz, height:sz, borderRadius:sz>=40?13:10, background:col||"#252830",
        display:"flex", alignItems:"center", justifyContent:"center", fontSize:sz*0.45 }}>
        {av||"👤"}
      </div>
      {online && <div style={{ width:11, height:11, background:"#22c55e", border:"2.5px solid #0e0f13",
        borderRadius:"50%", position:"absolute", bottom:-1, right:-1 }} />}
    </div>
  );
}

// ── Auth Screen ───────────────────────────────────────────────────────────────
function AuthScreen() {
  const [mode, setMode]     = useState("login");
  const [name, setName]     = useState("");
  const [email, setEmail]   = useState("");
  const [pass, setPass]     = useState("");
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!email || !pass) return setError("Remplis tous les champs.");
    setLoading(true); setError("");
    try {
      if (mode === "register") {
        if (!name) return setError("Entre ton nom.");
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        await updateProfile(cred.user, { displayName: name });
        await setDoc(doc(db, "users", cred.user.uid), {
          uid: cred.user.uid, name, email,
          avatar: randAv(), color: randCol(),
          online: true, createdAt: serverTimestamp()
        });
      } else {
        await signInWithEmailAndPassword(auth, email, pass);
      }
    } catch (e) {
      const msgs = {
        "auth/email-already-in-use": "Email déjà utilisé.",
        "auth/invalid-email": "Email invalide.",
        "auth/weak-password": "Mot de passe trop court (6 car. min).",
        "auth/user-not-found": "Compte introuvable.",
        "auth/wrong-password": "Mot de passe incorrect.",
        "auth/invalid-credential": "Email ou mot de passe incorrect.",
      };
      setError(msgs[e.code] || e.message);
    } finally { setLoading(false); }
  };

  const inp = (label, val, set, ph, type="text") => (
    <div style={{ marginBottom:14 }}>
      <label style={{ fontSize:12, color:"#9899a8", fontWeight:500, display:"block", marginBottom:6 }}>{label}</label>
      <input type={type} value={val} onChange={e=>set(e.target.value)}
        onKeyDown={e=>e.key==="Enter"&&handle()}
        placeholder={ph} style={{ width:"100%", padding:"10px 14px", background:"#1e2028",
          border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, color:"#f0f0f5", fontSize:14,
          fontFamily:"'DM Sans',sans-serif", outline:"none" }} />
    </div>
  );

  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#0e0f13", fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ background:"#16181f", border:"1px solid rgba(255,255,255,0.08)", borderRadius:24,
        padding:"38px 34px", width:370, maxWidth:"92vw", animation:"fadeUp .35s ease" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:28 }}>
          <div style={{ width:38, height:38, background:"#6c63ff", borderRadius:11,
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>💬</div>
          <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:21, color:"#f0f0f5" }}>
            u<span style={{ color:"#9b8ffd" }}>Chat</span>
          </span>
        </div>
        <h2 style={{ color:"#f0f0f5", fontWeight:600, fontSize:20, marginBottom:6 }}>
          {mode==="login" ? "Bienvenue 👋" : "Créer un compte"}
        </h2>
        <p style={{ color:"#9899a8", fontSize:13, marginBottom:22 }}>
          {mode==="login" ? "Connecte-toi à uChat" : "Rejoins la communauté uChat"}
        </p>
        {mode==="register" && inp("Nom complet", name, setName, "Ex: Amara Diallo")}
        {inp("Email", email, setEmail, "toi@email.com", "email")}
        {inp("Mot de passe", pass, setPass, "••••••••", "password")}
        {error && <p style={{ color:"#ef4444", fontSize:12, marginBottom:10 }}>⚠️ {error}</p>}
        <button onClick={handle} disabled={loading}
          style={{ width:"100%", padding:"12px", background: loading?"#4a45b0":"#6c63ff",
            border:"none", borderRadius:12, color:"#fff", fontWeight:600, fontSize:15,
            cursor: loading?"default":"pointer", fontFamily:"'DM Sans',sans-serif" }}>
          {loading ? "Chargement…" : mode==="login" ? "Se connecter →" : "Créer le compte →"}
        </button>
        <p style={{ textAlign:"center", color:"#9899a8", fontSize:13, marginTop:14 }}>
          {mode==="login" ? "Pas encore de compte ? " : "Déjà un compte ? "}
          <span onClick={()=>{setMode(m=>m==="login"?"register":"login");setError("");}}
            style={{ color:"#9b8ffd", cursor:"pointer", fontWeight:500 }}>
            {mode==="login" ? "S'inscrire" : "Se connecter"}
          </span>
        </p>
      </div>
    </div>
  );
}

// ── New Conversation Modal ─────────────────────────────────────────────────────
function NewConvModal({ currentUid, onClose, onOpen }) {
  const [query2, setQuery2] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = async (q) => {
    setQuery2(q);
    if (q.length < 2) return setResults([]);
    setLoading(true);
    const snap = await getDocs(collection(db,"users"));
    const all = snap.docs.map(d=>d.data()).filter(u=>
      u.uid !== currentUid &&
      (u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase()))
    );
    setResults(all);
    setLoading(false);
  };

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex",
      alignItems:"center", justifyContent:"center", zIndex:80 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#16181f", border:"1px solid rgba(255,255,255,0.1)",
        borderRadius:20, padding:24, width:340, maxWidth:"90vw" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <span style={{ fontWeight:600, fontSize:15, color:"#f0f0f5" }}>Nouvelle conversation</span>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#9899a8", cursor:"pointer", fontSize:18 }}>✕</button>
        </div>
        <input value={query2} onChange={e=>search(e.target.value)} placeholder="Chercher par nom ou email…"
          autoFocus style={{ width:"100%", padding:"10px 14px", background:"#1e2028",
            border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, color:"#f0f0f5",
            fontSize:14, fontFamily:"'DM Sans',sans-serif", outline:"none", marginBottom:12 }} />
        {loading && <p style={{ color:"#9899a8", fontSize:13, textAlign:"center" }}>Recherche…</p>}
        {results.map(u => (
          <div key={u.uid} onClick={()=>{ onOpen(u); onClose(); }}
            style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 8px", borderRadius:10,
              cursor:"pointer", transition:"background .12s" }}
            onMouseOver={ev=>ev.currentTarget.style.background="#1e2028"}
            onMouseOut={ev=>ev.currentTarget.style.background="none"}>
            <Av av={u.avatar} col={u.color} sz={38} />
            <div>
              <div style={{ fontSize:14, fontWeight:500, color:"#f0f0f5" }}>{u.name}</div>
              <div style={{ fontSize:12, color:"#9899a8" }}>{u.email}</div>
            </div>
          </div>
        ))}
        {query2.length>=2 && !loading && results.length===0 &&
          <p style={{ color:"#9899a8", fontSize:13, textAlign:"center", padding:"10px 0" }}>Aucun utilisateur trouvé</p>}
        <p style={{ color:"#5c5d70", fontSize:11, textAlign:"center", marginTop:14 }}>
          L'utilisateur doit avoir un compte uChat
        </p>
      </div>
    </div>
  );
}

// ── Main Chat App ─────────────────────────────────────────────────────────────
function ChatApp({ user, profile }) {
  const [convs, setConvs]           = useState([]);
  const [activeId, setActiveId]     = useState(null);
  const [activeOther, setActiveOther] = useState(null);
  const [msgs, setMsgs]             = useState([]);
  const [txt, setTxt]               = useState("");
  const [search, setSearch]         = useState("");
  const [showNew, setShowNew]       = useState(false);
  const [showProf, setShowProf]     = useState(false);
  const [typing, setTyping]         = useState(false);
  const [imgModal, setImgModal]     = useState(null);
  const [reacting, setReacting]     = useState(null);
  const endRef  = useRef(null);
  const fileRef = useRef(null);
  const inputRef= useRef(null);

  // Load conversations
  useEffect(() => {
    const q = query(collection(db,"conversations"),
      where("members","array-contains", user.uid));
    const unsub = onSnapshot(q, async snap => {
      const list = await Promise.all(snap.docs.map(async d => {
        const data = d.data();
        const otherId = data.members.find(m => m !== user.uid);
        let other = {};
        if (otherId) {
          const usnap = await getDoc(doc(db,"users", otherId));
          if (usnap.exists()) other = usnap.data();
        }
        return { id: d.id, ...data, other };
      }));
      list.sort((a,b) => (b.lastTime?.seconds||0) - (a.lastTime?.seconds||0));
      setConvs(list);
    });
    return unsub;
  }, [user.uid]);

  // Load messages for active conversation
  useEffect(() => {
    if (!activeId) return;
    const q = query(collection(db,"conversations",activeId,"messages"), orderBy("createdAt","asc"));
    const unsub = onSnapshot(q, snap => {
      setMsgs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [activeId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs.length]);

  const openConv = async (otherUser) => {
    const cid = convId(user.uid, otherUser.uid);
    const ref2 = doc(db,"conversations", cid);
    const snap = await getDoc(ref2);
    if (!snap.exists()) {
      await setDoc(ref2, {
        members: [user.uid, otherUser.uid],
        lastMsg: "", lastTime: serverTimestamp(), unread: {}
      });
    }
    setActiveId(cid);
    setActiveOther(otherUser);
    setShowProf(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const selectConv = (c) => {
    setActiveId(c.id);
    setActiveOther(c.other);
    setShowProf(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const sendMsg = async (content, type="text", extra={}) => {
    if (!content.trim() && type==="text") return;
    if (!activeId) return;
    const msg = {
      from: user.uid,
      fromName: profile?.name || user.displayName || "Moi",
      text: content,
      type,
      createdAt: serverTimestamp(),
      status: "sent",
      ...extra
    };
    setTxt("");
    await addDoc(collection(db,"conversations",activeId,"messages"), msg);
    await updateDoc(doc(db,"conversations",activeId), {
      lastMsg: type==="text" ? content : "📎 Fichier",
      lastTime: serverTimestamp()
    });
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeId) return;
    const isImg = file.type.startsWith("image/");
    const storageRef = ref(storage, `uchat/${activeId}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    await sendMsg(file.name, isImg?"image":"file", isImg?{url}:{size:(file.size/1024).toFixed(0)+" KB", url});
    e.target.value="";
  };

  const addReaction = async (msgId, emoji) => {
    await updateDoc(doc(db,"conversations",activeId,"messages",msgId), { reaction: emoji });
    setReacting(null);
  };

  const filtered = convs.filter(c =>
    !search || c.other?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (ts) => {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts.seconds*1000);
    return d.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});
  };

  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", width:"100%", height:"100vh", fontFamily:"'DM Sans',sans-serif" }}>
      {imgModal && (
        <div onClick={()=>setImgModal(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)",
          display:"flex", alignItems:"center", justifyContent:"center", zIndex:100 }}>
          <img src={imgModal} alt="" style={{ maxWidth:"88vw", maxHeight:"88vh", borderRadius:12 }} />
        </div>
      )}
      {showNew && <NewConvModal currentUid={user.uid} onClose={()=>setShowNew(false)} onOpen={openConv} />}

      <div style={{ width:"100%", maxWidth:1000, height:"96vh", background:"#16181f", borderRadius:20,
        border:"1px solid rgba(255,255,255,0.08)", display:"flex", overflow:"hidden" }}>

        {/* ── Sidebar ── */}
        <div style={{ width:295, minWidth:260, background:"#16181f", borderRight:"1px solid rgba(255,255,255,0.06)", display:"flex", flexDirection:"column" }}>
          <div style={{ padding:"16px 14px 10px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:34, height:34, background:"#6c63ff", borderRadius:10,
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>💬</div>
              <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:19, color:"#f0f0f5" }}>
                u<span style={{ color:"#9b8ffd" }}>Chat</span>
              </span>
            </div>
            <button onClick={()=>setShowNew(true)} title="Nouvelle conversation"
              style={{ width:30, height:30, borderRadius:8, background:"#6c63ff", border:"none",
                cursor:"pointer", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center" }}>✏️</button>
          </div>

          {/* Profile row */}
          <div style={{ display:"flex", alignItems:"center", gap:9, padding:"6px 14px 12px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
            <Av av={profile?.avatar} col={profile?.color} sz={34} online={true} />
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#f0f0f5" }}>{profile?.name || user.displayName || "Moi"}</div>
              <div style={{ fontSize:11, color:"#22c55e" }}>En ligne</div>
            </div>
            <button onClick={()=>signOut(auth)}
              style={{ fontSize:11, color:"#9899a8", background:"rgba(255,255,255,0.05)", border:"none", borderRadius:6, padding:"3px 8px", cursor:"pointer" }}>Déco</button>
          </div>

          {/* Search */}
          <div style={{ margin:"10px 12px 8px", background:"#1e2028", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, display:"flex", alignItems:"center", gap:7, padding:"0 11px" }}>
            <span style={{ fontSize:13, opacity:.7 }}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher…"
              style={{ background:"none", border:"none", color:"#f0f0f5", fontSize:13, width:"100%", padding:"7px 0", fontFamily:"'DM Sans',sans-serif", outline:"none" }} />
          </div>

          {/* Conv list */}
          <div style={{ flex:1, overflowY:"auto", padding:"0 7px" }}>
            {filtered.length===0 && (
              <div style={{ textAlign:"center", padding:"30px 16px" }}>
                <div style={{ fontSize:32, marginBottom:10 }}>💬</div>
                <p style={{ color:"#5c5d70", fontSize:13, marginBottom:10 }}>Aucune conversation</p>
                <button onClick={()=>setShowNew(true)}
                  style={{ background:"rgba(108,99,255,0.2)", border:"1px solid rgba(108,99,255,0.3)", borderRadius:8,
                    color:"#9b8ffd", padding:"6px 14px", fontSize:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                  ✏️ Démarrer une conversation
                </button>
              </div>
            )}
            {filtered.map(c => (
              <div key={c.id} onClick={()=>selectConv(c)}
                style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 9px", borderRadius:12, cursor:"pointer", marginBottom:2,
                  background: activeId===c.id ? "rgba(108,99,255,0.14)" : "none",
                  border: activeId===c.id ? "1px solid rgba(108,99,255,0.2)" : "1px solid transparent",
                  transition:"all .12s" }}
                onMouseOver={ev=>{ if(activeId!==c.id) ev.currentTarget.style.background="#1e2028"; }}
                onMouseOut={ev=>{ if(activeId!==c.id) ev.currentTarget.style.background="none"; }}>
                <Av av={c.other?.avatar} col={c.other?.color} sz={42} online={c.other?.online} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:2 }}>
                    <span style={{ fontWeight:500, fontSize:13, color:"#f0f0f5" }}>{c.other?.name || "..."}</span>
                    <span style={{ fontSize:10, color:"#5c5d70" }}>{formatTime(c.lastTime)}</span>
                  </div>
                  <span style={{ fontSize:12, color:"#9899a8", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", display:"block", maxWidth:180 }}>{c.lastMsg || "Démarrer la conversation"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Main ── */}
        {!activeId ? (
          <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12, opacity:.4 }}>
            <div style={{ fontSize:48 }}>💬</div>
            <p style={{ color:"#9899a8", fontSize:14 }}>Sélectionnez une conversation</p>
            <button onClick={()=>setShowNew(true)} style={{ background:"none", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, color:"#9899a8", padding:"7px 16px", fontSize:13, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
              ✏️ Nouvelle conversation
            </button>
          </div>
        ) : (
          <div style={{ flex:1, display:"flex", flexDirection:"column", background:"#0e0f13", overflow:"hidden" }}>
            {/* Header */}
            <div style={{ padding:"12px 16px", background:"#16181f", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", gap:11 }}>
              <Av av={activeOther?.avatar} col={activeOther?.color} sz={40} online={activeOther?.online} />
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:15, fontFamily:"'Space Grotesk',sans-serif", color:"#f0f0f5" }}>{activeOther?.name}</div>
                <div style={{ fontSize:12, color: activeOther?.online ? "#22c55e" : "#9899a8", marginTop:1 }}>
                  {activeOther?.online ? "En ligne" : "Hors ligne"}
                </div>
              </div>
              <div style={{ display:"flex", gap:5 }}>
                {[["📹","Appel vidéo"],["📞","Appel audio"]].map(([ic,tip]) => (
                  <button key={ic} title={tip} style={{ width:31, height:31, borderRadius:9, background:"#1e2028",
                    border:"1px solid rgba(255,255,255,0.06)", cursor:"pointer", fontSize:14,
                    display:"flex", alignItems:"center", justifyContent:"center" }}>{ic}</button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex:1, overflowY:"auto", padding:"14px 16px", display:"flex", flexDirection:"column", gap:2 }}
              onClick={()=>setReacting(null)}>
              {msgs.length===0 && (
                <div style={{ textAlign:"center", opacity:.4, marginTop:40 }}>
                  <div style={{ fontSize:36, marginBottom:8 }}>👋</div>
                  <p style={{ color:"#9899a8", fontSize:13 }}>Dis bonjour à {activeOther?.name} !</p>
                </div>
              )}
              {msgs.map((msg, i) => {
                const isSent = msg.from === user.uid;
                const ts = msg.createdAt;
                const timeStr = ts ? formatTime(ts) : nowTime();
                return (
                  <div key={msg.id} style={{ display:"flex", flexDirection:isSent?"row-reverse":"row",
                    alignItems:"flex-end", gap:7, marginBottom:2, animation:"msgIn .2s ease" }}>
                    {!isSent && <Av av={activeOther?.avatar} col={activeOther?.color} sz={24} />}
                    <div style={{ maxWidth:"60%", position:"relative" }}
                      onMouseEnter={()=>setReacting(msg.id)} onMouseLeave={()=>setReacting(null)}>
                      {reacting===msg.id && (
                        <div style={{ position:"absolute", bottom:"100%", left:isSent?"auto":0, right:isSent?0:"auto",
                          marginBottom:6, background:"#1e2028", border:"1px solid rgba(255,255,255,0.1)",
                          borderRadius:20, padding:"5px 9px", display:"flex", gap:4, zIndex:10 }}>
                          {["👍","❤️","😂","😮","🔥","👏"].map(e => (
                            <button key={e} onClick={()=>addReaction(msg.id,e)}
                              style={{ fontSize:16, background:"none", border:"none", cursor:"pointer", transition:"transform .1s" }}
                              onMouseOver={ev=>ev.target.style.transform="scale(1.4)"}
                              onMouseOut={ev=>ev.target.style.transform="scale(1)"}>{e}</button>
                          ))}
                        </div>
                      )}
                      <div style={{ padding: msg.type==="image" ? "4px 4px 8px" : "9px 13px",
                        borderRadius:14, borderBottomRightRadius:isSent?4:14, borderBottomLeftRadius:isSent?14:4,
                        background:isSent?"#6c63ff":"#1e2028",
                        border:isSent?"none":"1px solid rgba(255,255,255,0.06)",
                        color:"#f0f0f5", position:"relative" }}>
                        {msg.type==="image" && (
                          <img src={msg.url} onClick={()=>setImgModal(msg.url)} alt={msg.text}
                            style={{ maxWidth:200, maxHeight:170, borderRadius:10, display:"block", cursor:"pointer", objectFit:"cover" }} />
                        )}
                        {msg.type==="file" && (
                          <a href={msg.url} target="_blank" rel="noreferrer"
                            style={{ display:"flex", alignItems:"center", gap:8, textDecoration:"none" }}>
                            <span style={{ fontSize:22 }}>📄</span>
                            <div>
                              <div style={{ fontSize:13, fontWeight:500, color:"#f0f0f5" }}>{msg.text}</div>
                              <div style={{ fontSize:11, color:"rgba(255,255,255,0.55)" }}>{msg.size} — Télécharger</div>
                            </div>
                          </a>
                        )}
                        {(!msg.type||msg.type==="text") && <span style={{ fontSize:13.5, lineHeight:1.5 }}>{msg.text}</span>}
                        <div style={{ fontSize:10, marginTop:4, opacity:.65, display:"flex", alignItems:"center",
                          justifyContent:isSent?"flex-end":"flex-start", gap:3 }}>{timeStr}</div>
                        {msg.reaction && (
                          <div style={{ position:"absolute", bottom:-10, right:isSent?8:"auto", left:isSent?"auto":8,
                            fontSize:15, background:"#16181f", borderRadius:20, padding:"1px 5px",
                            border:"1px solid rgba(255,255,255,0.08)" }}>{msg.reaction}</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>

            {/* Composer */}
            <div style={{ padding:"11px 13px", background:"#16181f", borderTop:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", gap:7 }}>
              <input ref={fileRef} type="file" style={{ display:"none" }} onChange={handleFile} />
              <button onClick={()=>fileRef.current?.click()} style={{ width:34, height:34, borderRadius:9,
                background:"#1e2028", border:"1px solid rgba(255,255,255,0.07)", cursor:"pointer",
                fontSize:15, display:"flex", alignItems:"center", justifyContent:"center" }}>📎</button>
              <input ref={inputRef} value={txt} onChange={e=>setTxt(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); sendMsg(txt); }}}
                placeholder={`Message à ${activeOther?.name||"..."}…`}
                style={{ flex:1, background:"#1e2028", border:"1px solid rgba(255,255,255,0.07)",
                  borderRadius:12, padding:"9px 13px", color:"#f0f0f5", fontFamily:"'DM Sans',sans-serif",
                  fontSize:14, outline:"none", transition:"border-color .15s" }}
                onFocus={ev=>ev.target.style.borderColor="rgba(108,99,255,0.4)"}
                onBlur={ev=>ev.target.style.borderColor="rgba(255,255,255,0.07)"} />
              <button onClick={()=>sendMsg(txt)} disabled={!txt.trim()}
                style={{ width:36, height:36, borderRadius:10, background:txt.trim()?"#6c63ff":"#252830",
                  border:"none", cursor:txt.trim()?"pointer":"default", fontSize:15,
                  display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all .15s" }}>➤</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser]       = useState(undefined);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u || null);
      if (u) {
        const snap = await getDoc(doc(db,"users", u.uid));
        if (snap.exists()) setProfile(snap.data());
        await updateDoc(doc(db,"users", u.uid), { online: true }).catch(()=>{});
      }
    });
  }, []);

  if (user === undefined) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#0e0f13", color:"#f0f0f5", fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:40, marginBottom:12 }}>💬</div>
        <p style={{ color:"#9899a8" }}>Chargement uChat…</p>
      </div>
    </div>
  );
  if (!user) return <AuthScreen />;
  return <ChatApp user={user} profile={profile} />;
}
