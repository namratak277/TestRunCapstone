export function LogoMark({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={(size * 30) / 44} viewBox="0 0 44 30" aria-hidden="true">
      <rect x="1" y="1" width="42" height="28" rx="14" fill="#F4A261" />
      <rect x="6" y="6" width="32" height="18" rx="9" fill="none" stroke="#FBF7F0" strokeWidth="1.5" />
      <rect x="11" y="11" width="22" height="8" rx="4" fill="#1E7A6E" />
      <circle cx="14" cy="26.5" r="2.6" fill="#264653" />
    </svg>
  );
}

export function Track({ width = 300 }: { width?: number }) {
  return (
    <svg width={width} height={(width * 220) / 520} viewBox="0 0 520 220" role="img" aria-label="A running track" style={{ maxWidth: "100%", height: "auto" }}>
      <rect x="10" y="10" width="500" height="200" rx="100" fill="#F4A261" />
      <rect x="26" y="26" width="468" height="168" rx="84" fill="none" stroke="#FBF7F0" strokeWidth="2" />
      <rect x="42" y="42" width="436" height="136" rx="68" fill="none" stroke="#FBF7F0" strokeWidth="2" />
      <rect x="58" y="58" width="404" height="104" rx="52" fill="none" stroke="#FBF7F0" strokeWidth="2" />
      <rect x="74" y="74" width="372" height="72" rx="36" fill="none" stroke="#FBF7F0" strokeWidth="2" />
      <rect x="90" y="90" width="340" height="40" rx="20" fill="#1E7A6E" />
      <line x1="320" y1="130" x2="320" y2="210" stroke="#FBF7F0" strokeWidth="4" />
      <circle cx="380" cy="202" r="7" fill="#264653" stroke="#FBF7F0" strokeWidth="2" />
      <circle cx="250" cy="170" r="7" fill="#264653" stroke="#FBF7F0" strokeWidth="2" />
      <circle cx="150" cy="138" r="7" fill="#264653" stroke="#FBF7F0" strokeWidth="2" />
    </svg>
  );
}
