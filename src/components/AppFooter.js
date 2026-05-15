import { useState } from 'react';
import { Mail, Check } from 'lucide-react';
import { palette } from '../shared/theme';

const FEEDBACK_EMAIL = 'trichaiphy@gmail.com';
const GMAIL_COMPOSE  = `https://mail.google.com/mail/?view=cm&fs=1&to=${FEEDBACK_EMAIL}&su=${encodeURIComponent('Feedback TrichAI')}`;

function FeedbackModal({ onClose }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(FEEDBACK_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };
  return (
    <div style={feedback.overlay} onClick={onClose}>
      <div style={feedback.box} onClick={e => e.stopPropagation()}>
        <p style={feedback.title}>
          <Mail size={16} strokeWidth={1.8} style={{display:'inline-block', verticalAlign:'-3px', marginRight:8}} />
          Mándanos feedback
        </p>
        <p style={feedback.sub}>Bugs, sugerencias o lo que sea — leemos todo.</p>
        <div style={feedback.emailRow}>
          <span style={feedback.emailText}>{FEEDBACK_EMAIL}</span>
          <button style={feedback.copyBtn} onClick={copy}>
            {copied ? (
              <span style={{display:'inline-flex', alignItems:'center', gap:4}}>
                <Check size={12} strokeWidth={3} />Copiado
              </span>
            ) : 'Copiar'}
          </button>
        </div>
        <a href={GMAIL_COMPOSE} target="_blank" rel="noreferrer" style={feedback.gmailBtn}>Abrir en Gmail</a>
        <a href={`mailto:${FEEDBACK_EMAIL}?subject=Feedback%20TrichAI`} style={feedback.mailBtn}>Abrir cliente de correo</a>
        <button style={feedback.closeBtn} onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
}

export function AppFooter() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div style={bar.wrap}>
        <button style={bar.linkBtn} onClick={() => setOpen(true)}>
          <Mail size={13} strokeWidth={1.8} style={{display:'inline-block', verticalAlign:'-2px', marginRight:6}} />
          Feedback
        </button>
        <span style={bar.sep}>·</span>
        <a href="/terms.html" style={bar.link}>Términos</a>
      </div>
      {open && <FeedbackModal onClose={() => setOpen(false)} />}
    </>
  );
}

const bar = {
  wrap:    { textAlign:'center', padding:'24px 16px 80px', color:'#444', fontSize:13 },
  link:    { color:'#666', textDecoration:'none' },
  linkBtn: { color:'#666', textDecoration:'none', background:'none', border:'none', font:'inherit', cursor:'pointer', padding:0 },
  sep:     { margin:'0 10px', color:'#222' },
};

const feedback = {
  overlay:   { position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1100, padding:16, backdropFilter:'blur(8px)' },
  box:       { background:palette.card, borderRadius:18, padding:24, width:'100%', maxWidth:380, border:`1px solid ${palette.border}` },
  title:     { color:palette.text, fontSize:17, fontWeight:700, margin:'0 0 6px', textAlign:'center' },
  sub:       { color:palette.muted, fontSize:13, margin:'0 0 18px', textAlign:'center', lineHeight:1.5 },
  emailRow:  { display:'flex', alignItems:'center', gap:8, background:'#0a0a0a', border:`1px solid ${palette.border}`, borderRadius:10, padding:'10px 12px', marginBottom:14 },
  emailText: { color:palette.text, fontSize:14, flex:1, fontFamily:'monospace' },
  copyBtn:   { background:palette.green, color:'#000', border:'none', borderRadius:8, padding:'6px 12px', fontSize:12, fontWeight:700, cursor:'pointer', flexShrink:0 },
  gmailBtn:  { display:'block', textAlign:'center', background:palette.greenSoft, color:palette.green, border:`1px solid ${palette.green}40`, borderRadius:10, padding:'12px', fontSize:14, fontWeight:600, textDecoration:'none', marginBottom:8 },
  mailBtn:   { display:'block', textAlign:'center', background:'#111', color:palette.muted, border:`1px solid ${palette.border}`, borderRadius:10, padding:'12px', fontSize:13, textDecoration:'none', marginBottom:14 },
  closeBtn:  { width:'100%', background:'transparent', color:'#555', border:'none', fontSize:13, cursor:'pointer', padding:'6px 0' },
};
