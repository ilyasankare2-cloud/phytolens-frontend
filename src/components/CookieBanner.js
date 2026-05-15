import { useState } from 'react';
import { palette } from '../shared/theme';

export function CookieBanner() {
  const [visible, setVisible] = useState(() => !localStorage.getItem('trichai_cookie_consent'));
  if (!visible) return null;
  const handle = (choice) => {
    localStorage.setItem('trichai_cookie_consent', choice);
    if (choice === 'accepted' && window.gtag) {
      window.gtag('consent', 'update', { analytics_storage: 'granted' });
    }
    setVisible(false);
  };
  return (
    <div style={s.banner}>
      <p style={s.text}>
        Usamos Google Analytics para mejorar la app. No recopilamos datos personales.{' '}
        <a href="/terms.html" style={{color: palette.green}}>Términos</a>
      </p>
      <div style={s.btns}>
        <button style={s.reject} onClick={() => handle('rejected')}>Rechazar</button>
        <button style={s.accept} onClick={() => handle('accepted')}>Aceptar</button>
      </div>
    </div>
  );
}

const s = {
  banner: { position:'fixed', bottom:0, left:0, right:0, background:'#1a1a1a', borderTop:`1px solid #2a2a2a`, padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, zIndex:1000, flexWrap:'wrap' },
  text:   { color:'#888', fontSize:13, margin:0, flex:1 },
  btns:   { display:'flex', gap:8, flexShrink:0 },
  reject: { background:'transparent', border:'1px solid #333', color:'#666', borderRadius:8, padding:'8px 16px', fontSize:13, cursor:'pointer' },
  accept: { background:palette.green, border:'none', color:'#000', borderRadius:8, padding:'8px 16px', fontSize:13, fontWeight:600, cursor:'pointer' },
};
