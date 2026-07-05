import React, { useState, useEffect, useRef } from 'react';
import { Camera, MonitorUp, PowerOff, LayoutDashboard, CalendarDays, Images, NotebookPen, Settings, Mic, Send, Cpu, MemoryStick, ThermometerSun, Battery, Minimize2, Maximize2, X, Lock, KeyRound, EyeOff, Zap, Power, Monitor, Search, Image as ImageIcon, Smartphone, BrainCircuit, Info } from 'lucide-react';
import Earth from './Earth';
import Aurora from './Aurora';
import './index.css';

/* ─── YIGO Logo ─────────────────────────────────────────────────────────── */
const Logo = ({ s = 24, className = '' }) => (
  <img
    src="https://yigoai.vercel.app/img/logo.png"
    alt="YIGO"
    width={s} height={s}
    className={className}
    style={{ borderRadius: 6, objectFit: 'contain', flexShrink: 0 }}
    onError={e => { e.target.style.display = 'none'; }}
  />
);

/* ─── Feeds ─────────────────────────────────────────────────────────────── */
function CamFeed() {
  const ref = useRef(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    let stream;
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(s => { stream = s; if (ref.current) ref.current.srcObject = s; })
      .catch(() => setErr('Camera access denied'));
    return () => stream?.getTracks().forEach(t => t.stop());
  }, []);
  if (err) return <div className="feed-blank"><Camera size={28} /><span>{err}</span></div>;
  return <video ref={ref} autoPlay muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: 'block' }} />;
}

function DisplayFeed() {
  const ref = useRef(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    let stream;
    navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
      .then(s => { stream = s; if (ref.current) ref.current.srcObject = s; s.getVideoTracks()[0].onended = () => setErr('Screen share ended'); })
      .catch(() => setErr('Screen share cancelled'));
    return () => stream?.getTracks().forEach(t => t.stop());
  }, []);
  if (err) return <div className="feed-blank"><MonitorUp size={28} /><span>{err}</span></div>;
  return <video ref={ref} autoPlay muted style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', background: '#000' }} />;
}

/* ─── Lock Screen ───────────────────────────────────────────────────────── */
function LockScreen({ requiredPin, onUnlock }) {
  const [input, setInput] = useState('');
  const [err, setErr] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (err) return;
      if (e.key === 'Backspace') {
        setInput(p => p.slice(0, -1));
      } else if (/^[0-9]$/.test(e.key)) {
        if (input.length < 4) setInput(p => p + e.key);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [input, err]);

  useEffect(() => {
    if (input.length === 4) {
      if (input === requiredPin) onUnlock();
      else {
        setErr(true);
        setTimeout(() => { setInput(''); setErr(false); }, 1000);
      }
    }
  }, [input, requiredPin, onUnlock]);

  return (
    <div className="lock-screen">
      <div className="bg-layer" style={{ backgroundImage: 'url(/bg.jpg)' }} />
      <div className="aurora-wrap"><Aurora colorStops={['#000', '#0a1a14', '#000']} speed={0.3} /></div>
      
      <div className="lock-box">
        <Logo s={64} className="mb-4" />
        <div style={{ fontFamily: 'var(--mono)', fontSize: 24, letterSpacing: 4, marginBottom: 24, color: '#fff' }}>YIGO <span style={{ color: 'var(--green)' }}>AI</span></div>
        <div style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: 2, marginBottom: 24, textTransform: 'uppercase' }}>Enter Security PIN</div>
        <div className="pin-dots">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`pin-dot ${i < input.length ? 'filled' : ''} ${err ? 'err' : ''}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main App ──────────────────────────────────────────────────────────── */
export default function App() {
  const [locked, setLocked]     = useState(true); // initially assume locked to prevent flash
  const [booting, setBooting]   = useState(false); // boot handled after unlock
  const [sysPin, setSysPin]     = useState(null);
  const [sysPwd, setSysPwd]     = useState(null);
  const [pwdInput, setPwdInput] = useState('');
  const [settingsUnlocked, setSettingsUnlocked] = useState(false);
  
  const [tab, setTab]           = useState('DASHBOARD');
  const [aiState, setAiState]   = useState(false);
  const [visionMode, setVisionMode] = useState(null); // 'LENS' or 'DISPLAY'
  
  const [msgs, setMsgs]         = useState([]);
  const [input, setInput]       = useState('');
  
  const [time, setTime]         = useState(new Date());
  const [stats, setStats]       = useState({ cpuLoad: '–', memUsage: '–', temp: '–', battery: '–' });
  const [news, setNews]         = useState([]);
  const [media, setMedia]       = useState([]);
  const [notes, setNotes]       = useState([]);
  const [apiKeys, setApiKeys]   = useState({ gemini: '', groq: '', openai: '' });
  const [pinInput, setPinInput] = useState('');
  const [currentPinVerify, setCurrentPinVerify] = useState('');
  const [toast, setToast]       = useState('');
  const [newNote, setNewNote]   = useState('');
  const [isListening, setIsListening] = useState(false);
  const videoRef = useRef(null);
  const recognitionRef = useRef(null);
  const sendMsgRef = useRef(null); // ref so recognition can call the latest sendMsgWithText
  
  const bottomRef = useRef(null);
  
  /* Init */
  useEffect(() => {
    const initApp = async () => {
      if (window.electronAPI) {
        const p = await window.electronAPI.getStoreVal('pin');
        const g = await window.electronAPI.getStoreVal('gemini_key');
        const q = await window.electronAPI.getStoreVal('groq_key');
        const o = await window.electronAPI.getStoreVal('openai_key');
        const n = await window.electronAPI.getStoreVal('notes') || [];
        const pw = await window.electronAPI.getStoreVal('sysPwd');
        
        setApiKeys({ gemini: g || '', groq: q || '', openai: o || '' });
        if (n.length) setNotes(n);
        if (pw) setSysPwd(pw);
        
        if (p) {
          setSysPin(p);
          setLocked(true);
        } else {
          setLocked(false);
          setBooting(true);
        }
      } else {
        setLocked(false);
        setBooting(true);
      }
    };
    initApp();
  }, []);

  /* boot */
  useEffect(() => { 
    if (booting) setTimeout(() => setBooting(false), 4500); 
  }, [booting]);

  /* clock & stats */
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* Speech Recognition Init - uses ref so it always has fresh sendMsgWithText */
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'hi-IN';

      rec.onresult = (event) => {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal) {
          const transcript = lastResult[0].transcript.trim();
          if (transcript && sendMsgRef.current) {
            sendMsgRef.current(transcript);
          }
        }
      };
      rec.onerror = (e) => {
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          setIsListening(false);
          return;
        }
        if (e.error !== 'aborted' && aiStateRef.current) {
          setTimeout(() => { try { rec.start(); } catch(err) {} }, 800);
        }
      };
      rec.onend = () => {
        if (aiStateRef.current) {
          setTimeout(() => { try { rec.start(); } catch(e) {} }, 300);
        } else {
          setIsListening(false);
        }
      };
      recognitionRef.current = rec;
    }
  }, []);

  // We need a ref for aiState so onend can read the latest state
  const aiStateRef = useRef(aiState);
  useEffect(() => { aiStateRef.current = aiState; }, [aiState]);

  const handleAiActivation = (newState) => {
    setAiState(newState);
    if (newState) {
      const greeting = "Hello Boss whats up";
      speakText(greeting);
      setMsgs(p => [...p, { role: 'ai', text: greeting }]);
      if (recognitionRef.current) {
        try { recognitionRef.current.start(); setIsListening(true); } catch(e){}
      }
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
    }
  };

  const toggleListen = () => {
    if (!aiState) return;
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  /* Electron Handlers */
  useEffect(() => {
    const fetchStats = async () => {
      if (window.electronAPI) {
        const s = await window.electronAPI.getSystemStats?.();
        if (s) setStats(s);
      }
    };
    fetchStats();
    const t = setInterval(fetchStats, 3000);
    return () => clearInterval(t);
  }, []);

  /* Fetch News */
  useEffect(() => {
    fetch('https://saurav.tech/NewsAPI/top-headlines/category/technology/in.json')
      .then(res => res.json())
      .then(data => { if (data.articles) setNews(data.articles.slice(0, 10)); })
      .catch(() => {});
  }, []);

  /* scroll chat */
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const win = cmd => window.electronAPI?.windowControl(cmd);

  const greet = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const speakText = async (text) => {
    const cleanText = text.replace(/[*#_`]/g, '').trim();
    if (!cleanText) return;
    try {
      // Use Electron IPC for Google TTS (most natural)
      if (window.electronAPI && window.electronAPI.getTTSAudio) {
        const base64Audio = await window.electronAPI.getTTSAudio(cleanText);
        if (base64Audio) {
          window.speechSynthesis?.cancel();
          const audio = new Audio('data:audio/mp3;base64,' + base64Audio);
          audio.volume = 1.0;
          await audio.play();
          return;
        }
      }
    } catch (e) {
      // fall through to Web Speech
    }
    // Web Speech API fallback — pick best available female voice
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const speak = (voices) => {
      const ut = new SpeechSynthesisUtterance(cleanText);
      const female = voices.find(v => /Google हिन्दी|Swara|Priya|Google Hindi/i.test(v.name))
        || voices.find(v => /hi[-_]IN/i.test(v.lang))
        || voices.find(v => /female|woman|girl/i.test(v.name))
        || voices[0];
      if (female) ut.voice = female;
      ut.lang = 'hi-IN';
      ut.rate = 1.05;
      ut.pitch = 1.1;
      ut.volume = 1.0;
      window.speechSynthesis.speak(ut);
    };
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) speak(voices);
    else { window.speechSynthesis.onvoiceschanged = () => speak(window.speechSynthesis.getVoices()); }
  };

  const askGemini = async (text) => {
    if (!apiKeys.gemini) return "ERROR: Missing Gemini API Key in Settings.";
    try {
      const systemPrompt = `You are Yigo AI, an advanced AI construct operating locally on the user's desktop.
CRITICAL: You MUST ALWAYS reply in HINDI. Your voice will be read aloud by a female TTS, so make it natural and conversational. DO NOT USE ENGLISH unless explaining technical terms. Keep responses extremely brief and direct (under 2 sentences) unless asked otherwise.

Available Actions:
- "OPEN_APP": to open applications or websites (e.g., whatsapp, youtube, notepad).
- "SAVE_NOTE": to save important user preferences, info, or memories.
- "NONE": just talk normally.

If you need to perform an action (like opening an app or saving a note based on user request), you MUST output ONLY a valid JSON object like this:
{"action": "ACTION_NAME", "payload": "app name or note text", "reply": "Your conversational response"}

If no action is needed, just reply normally with plain text.
Here are your current memory/notes to remember about the user: ${JSON.stringify(notes.map(n => n.text))}`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKeys.gemini}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: text }] }] 
        })
      });
      const data = await res.json();
      let aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
      
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
           const parsed = JSON.parse(jsonMatch[0]);
           if (parsed.reply) aiResponse = parsed.reply;
           if (parsed.action === 'OPEN_APP' && window.electronAPI) {
             window.electronAPI.openApp(parsed.payload);
           }
           if (parsed.action === 'SAVE_NOTE') {
             const newNotes = [...notes, { date: new Date().toISOString(), text: parsed.payload }];
             setNotes(newNotes);
             window.electronAPI?.setStoreVal('notes', newNotes);
           }
        }
      } catch (e) {
        // Not JSON, just normal text
      }
      
      speakText(aiResponse);
      return aiResponse;
    } catch (err) {
      return "ERROR: Connection to AI engine failed.";
    }
  };

  const sendMsgWithText = async (text) => {
    if (!text.trim() || !aiStateRef.current) return;
    setMsgs(p => [...p, { role: 'user', text: text }]);
    const aiResponse = await askGemini(text);
    setMsgs(p => [...p, { role: 'ai', text: aiResponse }]);
  };

  // Keep ref always pointing at the latest function
  useEffect(() => { sendMsgRef.current = sendMsgWithText; });

  const sendMsg = async (e) => {
    e.preventDefault();
    if (!input.trim() || !aiState) return;
    const q = input.trim();
    setInput('');
    await sendMsgWithText(q);
  };

  const takeScreenshot = async () => {
    if (!window.electronAPI) return;
    const res = await window.electronAPI.takeScreenshot();
    if (res.success) loadMedia();
  };

  const loadMedia = async () => {
    if (!window.electronAPI) return;
    const files = await window.electronAPI.getMediaFiles();
    setMedia(files);
  };

  useEffect(() => {
    if (tab === 'GALLERY') loadMedia();
  }, [tab]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const saveSettings = () => {
    window.electronAPI?.setStoreVal('gemini_key', apiKeys.gemini);
    window.electronAPI?.setStoreVal('groq_key', apiKeys.groq);
    window.electronAPI?.setStoreVal('openai_key', apiKeys.openai);
    
    if (pwdInput.trim() !== '') {
      window.electronAPI?.setStoreVal('sysPwd', pwdInput);
      setSysPwd(pwdInput);
      setPwdInput('');
    }
    if (pinInput && pinInput.length === 4) {
      if (sysPin && currentPinVerify !== sysPin) {
        showToast("Error: Current PIN is incorrect!");
        return;
      }
      window.electronAPI?.setStoreVal('pin', pinInput);
      setSysPin(pinInput);
      setPinInput('');
      setCurrentPinVerify('');
      showToast("Settings and Security PIN Saved!");
    } else {
      showToast("Settings Saved!");
    }
  };

  const addManualNote = () => {
    if (!newNote.trim()) return;
    const item = { id: Date.now(), type: 'user', content: newNote, ts: new Date().toLocaleTimeString() };
    const n = [item, ...notes];
    setNotes(n);
    window.electronAPI?.setStoreVal('notes', n);
    setNewNote('');
    showToast("Note added to Memory Bank");
  };

  const deleteNote = (index) => {
    const updated = notes.filter((_, i) => i !== index);
    setNotes(updated);
    window.electronAPI?.setStoreVal('notes', updated);
    showToast('Note deleted');
  };

  const [lightboxImg, setLightboxImg] = useState(null);

  const deleteMedia = (index) => {
    const updated = media.filter((_, i) => i !== index);
    setMedia(updated);
    showToast('Photo removed from vault');
  };

  useEffect(() => {
    if (!aiState || !visionMode) {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }
      return;
    }
    
    const startStream = async () => {
      try {
        if (videoRef.current && videoRef.current.srcObject) {
          videoRef.current.srcObject.getTracks().forEach(t => t.stop());
        }
        let stream;
        if (visionMode === 'DISPLAY') {
          if (window.electronAPI?.getDesktopSource) {
            const sourceId = await window.electronAPI.getDesktopSource();
            if (sourceId) {
              stream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                  mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: sourceId
                  }
                }
              });
            }
          } else {
            stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          }
        } else if (visionMode === 'LENS') {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }
        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Stream error:", err);
      }
    };
    startStream();
  }, [aiState, visionMode]);

  if (locked) return <LockScreen requiredPin={sysPin} onUnlock={() => { setLocked(false); setBooting(true); }} />;

  const hh = time.getHours().toString().padStart(2, '0');
  const mm = time.getMinutes().toString().padStart(2, '0');
  const ss = time.getSeconds().toString().padStart(2, '0');
  const dateStr = time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const NAV_ITEMS = [
    { id: 'DASHBOARD', icon: <LayoutDashboard size={20} strokeWidth={1.5} />, label: 'Dashboard' },
    { id: 'TODAY',     icon: <CalendarDays size={20} strokeWidth={1.5} />,    label: 'Today' },
    { id: 'GALLERY',   icon: <Images size={20} strokeWidth={1.5} />,          label: 'Vault' },
    { id: 'NOTES',     icon: <NotebookPen size={20} strokeWidth={1.5} />,     label: 'Notes' },
    { id: 'SETTINGS',  icon: <Settings size={20} strokeWidth={1.5} />,        label: 'Settings' },
    { id: 'ABOUT',     icon: <Info size={20} strokeWidth={1.5} />,            label: 'About Us' },
  ];

  return (
    <div className="app-root">
      <div className="bg-layer" style={{ backgroundImage: 'url(/bg.jpg)' }} />
      <div className="aurora-wrap"><Aurora colorStops={['#000000', '#0a1a14', '#000000']} speed={0.3} amplitude={1.2} blend={0.6} /></div>
      <div className="scanline" />

      {toast && (
        <div className="custom-toast">
          {toast}
        </div>
      )}

      {/* Boot Screen */}
      {booting && (
        <div className="boot">
          <div className="boot-bg" style={{ backgroundImage: 'url(/bg.jpg)' }} />
          <div className="boot-glow" />
          <div className="boot-logo-container">
            <div className="glitch-wrapper"><img src="https://yigoai.vercel.app/img/logo.png" className="boot-main-logo" alt="YIGO" /></div>
            <div className="boot-logo-text">YIGO AI</div>
            <div className="boot-loading-bar"><div className="boot-progress" /></div>
          </div>
          <div className="boot-terminal">
            <div className="t-line t-line-1">SYSTEM KERNEL v9.0.4 ONLINE</div>
            <div className="t-line t-line-2">ESTABLISHING NEURAL LINK...</div>
            <div className="t-line t-line-3">DECRYPTING LOCAL DATASTORE... [OK]</div>
            <div className="t-line t-line-4">WAKING YIGO AI CONSTRUCT...</div>
          </div>
        </div>
      )}

      {/* Titlebar */}
      <div className="titlebar">
        <div className="tb-drag" />
        <div className="tb-btns">
          <button className="tb-btn" onClick={() => win('minimize')}><Minimize2 size={14} /></button>
          <button className="tb-btn" onClick={() => win('maximize')}><Maximize2 size={14} /></button>
          <button className="tb-btn tb-close" onClick={() => win('close')}><X size={16} /></button>
        </div>
      </div>

      <div className="app-layout">
        
        {/* SIDEBAR */}
        <div className="sidebar">
        <div className="sidebar-brand">
          <Logo s={90} className="mb-4" />
        </div>
          <nav className="side-nav">
            {NAV_ITEMS.map(n => (
              <button key={n.id} className={`side-btn${tab === n.id ? ' active' : ''}`} onClick={() => setTab(n.id)}>
                {n.icon} <span className="side-label">{n.label}</span>
              </button>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="side-clock">{hh}<span className="blink">:</span>{mm}</div>
            <div className={`status-dot${aiState ? ' online' : ''}`} title={aiState ? 'Online' : 'Offline'} />
          </div>
        </div>

        {/* MAIN WORKSPACE */}
        <main className="workspace">
          
          {/* DASHBOARD */}
          {tab === 'DASHBOARD' && (
            <div className="dash">
              {/* LEFT */}
              <div className="left-col">
                <div className="panel feed-panel">
                  <div className="feed-head">
                    <span className={`dot${aiState ? '' : ' off'}`} />
                    <span>VISION INPUT</span>
                    <span className="feed-badge">{!aiState ? 'OFFLINE' : (visionMode || 'NONE').toUpperCase()}</span>
                  </div>
                  <div className="feed-body">
                    {(!aiState || !visionMode) ? (
                      <div className="feed-blank">
                        <EyeOff size={32} />
                        <div>NO SIGNAL</div>
                      </div>
                    ) : (
                      <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }} />
                    )}
                  </div>
                </div>

                <div className="panel stats-panel">
                  <div className="stats-ttl">TELEMETRY</div>
                  <div className="stats-grid">
                    <div className="stat-card"><Cpu size={16} className="s-ico" /><div className="stat-v green">{stats.cpuLoad}</div><div className="stat-k">CPU</div></div>
                    <div className="stat-card"><MemoryStick size={16} className="s-ico" /><div className="stat-v">{stats.memUsage}</div><div className="stat-k">RAM</div></div>
                    <div className="stat-card"><ThermometerSun size={16} className="s-ico" /><div className="stat-v">{stats.temp}</div><div className="stat-k">TEMP</div></div>
                    <div className="stat-card"><Battery size={16} className="s-ico" /><div className="stat-v">{stats.battery}</div><div className="stat-k">BATT</div></div>
                  </div>
                </div>
              </div>

              {/* CENTER */}
              <div className="center-col">
                <div className={`core-orb-wrap ${aiState ? 'active' : ''}`}>
                  <div className="core-orb"></div>
                  <div className="core-glow"></div>
                  <div className="core-rings">
                    <div className="c-ring c-ring-1"></div>
                    <div className="c-ring c-ring-2"></div>
                  </div>
                  <div className={`sphere-lbl ${aiState ? 'on' : 'off'}`}>
                    <Zap size={14} fill={aiState ? 'var(--green)' : 'none'} />
                    {aiState ? 'SYSTEM ONLINE' : 'STANDBY MODE'}
                  </div>
                </div>

                <div className="vbar">
                  <button onClick={() => handleAiActivation(!aiState)} className={`vbtn ${!aiState ? 'start-btn' : 'stop-btn'}`} style={{ marginRight: 16 }}>
                    <Power size={14} /> {aiState ? 'SHUTDOWN' : 'ACTIVATE'}
                  </button>
                  <div style={{ width: 1, height: 20, background: 'var(--border-soft)', marginRight: 16 }} />
                  <button disabled={!aiState} onClick={() => setVisionMode(p => p === 'LENS' ? null : 'LENS')} className={`vbtn ${visionMode === 'LENS' && aiState ? 'von' : ''}`}>
                    <Camera size={14} /> LENS
                  </button>
                  <button disabled={!aiState} onClick={() => setVisionMode(p => p === 'DISPLAY' ? null : 'DISPLAY')} className={`vbtn ${visionMode === 'DISPLAY' && aiState ? 'von' : ''}`}>
                    <Monitor size={14} /> DISPLAY
                  </button>
                </div>
              </div>

              {/* RIGHT */}
              <div className="panel chat-col">
                <div className="chat-head">
                  <div className="chat-brand"><Logo s={18} /> YIGO <span style={{ color: 'var(--green)' }}>AI</span></div>
                  <button onClick={takeScreenshot} style={{ marginLeft: 'auto', background: 'var(--green-dim)', border: '1px solid var(--green-mid)', color: 'var(--green)', padding: '6px 12px', borderRadius: 8, fontSize: 10, cursor: 'pointer', fontFamily: 'var(--mono)' }}>TAKE SCREENSHOT</button>
                </div>
                <div className="chat-msgs">
                  {msgs.length === 0 ? (
                    <div className="chat-empty">
                      <Logo s={120} className="ce-logo" />
                      <div className="ce-title">YIGO <span style={{ color: 'var(--green)' }}>AI</span></div>
                      <div className="ce-sub">Power on core AI<br />to establish link</div>
                    </div>
                  ) : msgs.map((m, i) => (
                    <div key={i} className={`msg msg-${m.role}`}>
                      {m.role === 'ai' && <Logo s={16} />}
                      <span className="bubble">{m.text}</span>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
                <form className="chat-form" onSubmit={sendMsg}>
                  <input className="chat-input" value={input} onChange={e => setInput(e.target.value)} placeholder={aiState ? 'Listening... or type a message...' : 'Turn on to chat...'} disabled={!aiState} />
                  <button type="submit" className="chat-send" disabled={!aiState}><Send size={16} /></button>
                </form>
              </div>
            </div>
          )}

          {/* TODAY */}
          {tab === 'TODAY' && (
            <div className="page">
              <div className="today-top">
                <div>
                  <div className="today-date">{dateStr}</div>
                  <h1 className="today-greet">{greet()}.</h1>
                  <p className="today-quote">"The future is built on logic and illuminated by imagination."</p>
                </div>
                <div className="big-clock">{hh}:{mm}<span className="big-sec">{ss}</span></div>
              </div>
              <div className="news-section" style={{ marginTop: 40 }}>
                <h3 style={{ fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: 2, marginBottom: 20 }}>LATEST TECH NEWS</h3>
                <div style={{ display: 'grid', gap: 16 }}>
                  {news.map((n, i) => (
                    <a key={i} href={n.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 12, border: '1px solid var(--border-soft)', display: 'block' }}>
                      <div style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{n.title}</div>
                      <div style={{ color: 'var(--muted)', fontSize: 12 }}>{n.source?.name}</div>
                    </a>
                  ))}
                  {news.length === 0 && <div style={{ color: 'var(--muted)' }}>Fetching live feeds...</div>}
                </div>
              </div>
            </div>
          )}

          {/* Gallery lightbox */}
          {lightboxImg && (
            <div onClick={() => setLightboxImg(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
              <img src={lightboxImg} alt="preview" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, boxShadow: '0 0 60px rgba(0,255,157,0.3)' }} />
            </div>
          )}

          {/* GALLERY */}
          {tab === 'GALLERY' && (
            <div className="page">
              <div className="settings-head">
                <Images size={36} color="var(--green)" />
                <div>
                  <h1 style={{ fontFamily: 'var(--mono)', fontSize: 20, letterSpacing: 2 }}>MEDIA <span style={{ color: 'var(--green)' }}>VAULT</span></h1>
                  <div style={{ color: 'var(--muted)', fontSize: 11, marginTop: 4 }}>LOCAL DEVICE STORAGE</div>
                </div>
              </div>
              {media.length === 0 ? (
                <div className="panel" style={{ height: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                  <Images size={64} color="var(--muted)" style={{ opacity: 0.2 }} />
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: 3, color: 'var(--muted)' }}>NO MEDIA FILES</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                  {media.map((m, i) => (
                    <div key={i} style={{ position: 'relative', background: 'var(--panel)', border: '1px solid var(--border-soft)', borderRadius: 12, padding: 8, cursor: 'pointer' }}
                      className="vault-card"
                    >
                      <img onClick={() => setLightboxImg(m.data)} src={m.data} alt={m.name} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 6, marginBottom: 8 }} />
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteMedia(i); }}
                        className="vault-delete-btn"
                        title="Delete"
                      >×</button>
                      <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--mono)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{m.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* NOTES */}
          {tab === 'NOTES' && (
            <div className="page">
              <h2 style={{ fontFamily: 'var(--mono)', fontSize: 24, letterSpacing: 4, marginBottom: 30, display: 'flex', alignItems: 'center', gap: 12 }}>
                <BrainCircuit size={28} color="var(--green)" /> MEMORY BANK
              </h2>
              
              <div className="panel" style={{ padding: 20, marginBottom: 30, display: 'flex', gap: 12 }}>
                <input 
                  type="text" 
                  value={newNote} 
                  onChange={e => setNewNote(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && addManualNote()}
                  placeholder="Add a new memory or task..." 
                  className="input-field" 
                  style={{ flex: 1 }} 
                />
                <button onClick={addManualNote} style={{ background: 'var(--green)', color: '#000', border: 'none', padding: '0 24px', borderRadius: 12, fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: 2, fontWeight: 700, cursor: 'pointer' }}>
                  SAVE
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {notes.length === 0 ? (
                  <div style={{ color: 'var(--muted)', fontStyle: 'italic' }}>No notes saved yet. Tell YIGO to "save this to notes" in chat.</div>
                ) : (
                  notes.map((n, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 12, border: '1px solid var(--border-soft)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, color: 'var(--green)', fontFamily: 'var(--mono)', marginBottom: 8 }}>{new Date(n.date || n.ts || Date.now()).toLocaleString()}</div>
                        <div style={{ color: '#fff', fontSize: 13, lineHeight: 1.5 }}>{n.text || n.content}</div>
                      </div>
                      <button
                        onClick={() => deleteNote(i)}
                        title="Delete note"
                        style={{ background: 'rgba(255,60,60,0.12)', border: '1px solid rgba(255,60,60,0.4)', color: '#ff6b6b', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, flexShrink: 0 }}
                      >×</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* SETTINGS */}
          {tab === 'SETTINGS' && (
            <div className="page">
              {sysPwd && !settingsUnlocked ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 20 }}>
                  <Lock size={48} color="var(--green)" />
                  <h2 style={{ fontFamily: 'var(--mono)', letterSpacing: 2 }}>SYSTEM SETTINGS LOCKED</h2>
                  <input type="password" placeholder="Enter System Password" value={pwdInput} onChange={e => setPwdInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && pwdInput === sysPwd) { setSettingsUnlocked(true); setPwdInput(''); } else if (e.key === 'Enter') { showToast('Incorrect System Password'); } }} style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--green)', padding: '12px 20px', borderRadius: 8, color: '#fff', outline: 'none', width: 300, textAlign: 'center', letterSpacing: 2 }} />
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>Press Enter to unlock</div>
                </div>
              ) : (
                <>
              <div className="settings-head">
                <Settings size={36} color="var(--green)" />
                <div>
                  <h1 style={{ fontFamily: 'var(--mono)', fontSize: 20, letterSpacing: 2 }}>YIGO <span style={{ color: 'var(--green)' }}>SETTINGS</span></h1>
                  <div style={{ color: 'var(--muted)', fontSize: 11, marginTop: 4 }}>v1.0.0 — System Config</div>
                </div>
              </div>
              
              <div className="panel" style={{ padding: 26, marginBottom: 20 }}>
                <h3 style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: 2, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}><KeyRound size={14} color="var(--green)" /> API PROVIDERS</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 18, maxWidth: 500 }}>
                  <div>
                    <label style={{ fontSize: 10, color: 'var(--muted)', display: 'block', marginBottom: 6, fontFamily: 'var(--mono)', letterSpacing: 1 }}>Google Gemini API Key</label>
                    <input type="password" value={apiKeys.gemini} onChange={e => setApiKeys({ ...apiKeys, gemini: e.target.value })} placeholder="AI Studio Key..." className="input-field" />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: 'var(--muted)', display: 'block', marginBottom: 6, fontFamily: 'var(--mono)', letterSpacing: 1 }}>Groq API Key</label>
                    <input type="password" value={apiKeys.groq} onChange={e => setApiKeys({ ...apiKeys, groq: e.target.value })} placeholder="Groq Cloud Key..." className="input-field" />
                  </div>
                </div>
              </div>

              <div className="panel" style={{ padding: 26, marginBottom: 24 }}>
                <h3 style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: 2, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}><Lock size={14} color="var(--green)" /> SECURITY (SYSTEM PIN)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, maxWidth: 600 }}>
                  <div>
                    <label style={{ fontSize: 10, color: 'var(--muted)', display: 'block', marginBottom: 6, fontFamily: 'var(--mono)', letterSpacing: 1 }}>Set New 4-Digit Lock PIN (Current: {sysPin ? '****' : 'None'})</label>
                    <input type="password" maxLength={4} value={pinInput} onChange={e => setPinInput(e.target.value.replace(/[^0-9]/g, ''))} placeholder="e.g. 1234" className="input-field" />
                  </div>
                </div>
              </div>

              <button onClick={saveSettings} style={{ background: 'var(--green)', color: '#000', padding: '12px 24px', borderRadius: 12, border: 'none', fontFamily: 'var(--mono)', fontWeight: 'bold', letterSpacing: 2, cursor: 'pointer' }}>SAVE & APPLY SETTINGS</button>
              </>
              )}
            </div>
          )}

          {/* ABOUT */}
          {tab === 'ABOUT' && (
            <div className="page fade-in" style={{ padding: '40px', maxWidth: '800px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                <Info size={36} color="var(--green)" />
                <div>
                  <h1 style={{ fontFamily: 'var(--mono)', fontSize: 24, letterSpacing: 2 }}>ABOUT <span style={{ color: 'var(--green)' }}>YIGO</span></h1>
                  <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>System Information & Updates</div>
                </div>
              </div>
              
              <div className="panel" style={{ padding: '30px', marginBottom: '24px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,255,157,0.2)', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '18px', color: '#fff', marginBottom: '10px' }}>YIGO AI Desktop Assistant</h3>
                <p style={{ color: 'var(--green)', fontSize: '14px', marginBottom: '20px', fontFamily: 'var(--mono)', letterSpacing: '1px' }}>
                  Created by <strong>SARDAR JAPNAM SINGH LALL</strong>
                </p>
                <div style={{ background: 'rgba(0,255,157,0.05)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(0,255,157,0.1)', marginBottom: '25px' }}>
                  <p style={{ color: '#a0aab0', lineHeight: '1.8', fontSize: '14px' }}>
                    YIGO AI is an advanced operating system assistant built for the future. It features seamless voice control with natural female Hindi speech, vision analytics capable of processing your screen or camera feed, intelligent memory banking, and direct desktop automation. 
                    <br/><br/>
                    Designed to streamline workflows and enhance daily productivity without compromising on aesthetics.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <button onClick={() => window.open('https://yigoai.vercel.app', '_blank')} style={{ background: 'var(--green)', color: '#000', padding: '12px 24px', borderRadius: '8px', border: 'none', fontFamily: 'var(--mono)', fontWeight: 'bold', cursor: 'pointer', flex: 1 }}>
                    OUR WEBSITE
                  </button>
                  <button onClick={() => showToast('Software is Updated')} style={{ background: 'transparent', color: '#fff', padding: '12px 24px', borderRadius: '8px', border: '1px solid var(--green)', fontFamily: 'var(--mono)', fontWeight: 'bold', cursor: 'pointer', flex: 1 }}>
                    CHECK UPDATES
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
