// Original inline illustrations, drawn only with theme variables. viewBox 800×500.
const S = { stroke: 'var(--ink)', strokeWidth: 2, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };

function Frame({ children, className = '' }) {
  return (
    <svg viewBox="0 0 800 500" aria-hidden className={`group/art block h-full w-full ${className}`}>
      <rect width="800" height="500" fill="var(--stone)" />
      <g stroke="var(--rule)" strokeWidth="1">
        {Array.from({ length: 12 }, (_, i) => <line key={'v' + i} x1={i * 72} y1="0" x2={i * 72} y2="500" />)}
        {Array.from({ length: 7 }, (_, i) => <line key={'h' + i} x1="0" y1={i * 72} x2="800" y2={i * 72} />)}
      </g>
      {children}
    </svg>
  );
}
const lift = 'transition-transform duration-700 ease-ui group-hover/art:-translate-y-[10px]';

/** Hero: a sapling with its survival log, a ration kit, and a receipt with the accent check. */
export function HeroArt() {
  return (
    <Frame>
      <g className={lift}>
        <rect x="90" y="110" width="260" height="300" rx="18" fill="var(--paper)" {...S} />
        <path d="M220 330 V230" {...S} strokeWidth="3" />
        <path d="M220 270 C180 260 165 225 172 200 C205 205 222 235 220 270Z" fill="var(--accent)" {...S} />
        <path d="M220 245 C255 238 270 205 262 180 C232 188 218 215 220 245Z" fill="var(--paper)" {...S} />
        <path d="M150 330 H290" {...S} />
        <path d="M165 345 Q220 360 275 345" {...S} />
        <text x="115" y="145" fontSize="15" fill="var(--muted)" fontFamily="Inter Variable">SITE 01 · GEOTAGGED</text>
        {['6 mo', '12 mo', '24 mo'].map((t, i) => (
          <g key={t} transform={`translate(${118 + i * 78} 380)`}>
            <circle r="7" fill={i === 0 ? 'var(--accent)' : 'var(--paper)'} {...S} cx="0" cy="0" />
            <text x="14" y="5" fontSize="13" fill="var(--ink)" fontFamily="Inter Variable">{t}</text>
          </g>
        ))}
      </g>
      <g className="transition-transform delay-100 duration-700 ease-ui group-hover/art:-translate-y-[10px]">
        <rect x="400" y="80" width="300" height="180" rx="18" fill="var(--paper)" {...S} />
        <text x="425" y="118" fontSize="15" fill="var(--muted)" fontFamily="Inter Variable">RATION KIT · HOUSEHOLD 0142</text>
        {['Atta 10 kg', 'Dal 2 kg', 'Oil 1 L'].map((t, i) => (
          <g key={t} transform={`translate(425 ${148 + i * 30})`}>
            <rect width="16" height="16" rx="4" {...S} fill={i < 2 ? 'var(--ink)' : 'var(--paper)'} />
            {i < 2 && <path d="M4 8 l3 3 l5 -6" stroke="var(--paper)" strokeWidth="2" fill="none" />}
            <text x="28" y="13" fontSize="15" fill="var(--ink)" fontFamily="Inter Variable">{t}</text>
          </g>
        ))}
      </g>
      <g className="transition-transform delay-200 duration-700 ease-ui group-hover/art:-translate-y-[10px]">
        <rect x="440" y="290" width="260" height="140" rx="18" fill="var(--paper)" {...S} />
        <text x="465" y="326" fontSize="15" fill="var(--muted)" fontFamily="Inter Variable">RECEIPT PF/2026-27/…</text>
        <text x="465" y="372" fontSize="34" fill="var(--ink)" fontFamily="Space Grotesk Variable" fontWeight="500">₹1,000</text>
        <circle cx="655" cy="360" r="22" fill="var(--accent)" {...S} />
        <path d="M645 360 l7 7 l12 -14" {...S} strokeWidth="3" />
        <path d="M465 400 H600" stroke="var(--rule)" strokeWidth="2" />
      </g>
    </Frame>
  );
}

function GreenArt() {
  return (
    <Frame>
      <path d="M60 400 H740" {...S} />
      {[160, 330, 500, 660].map((x, i) => (
        <g key={x} className={lift} style={{ transitionDelay: `${i * 60}ms` }}>
          <path d={`M${x} 400 V${330 - i * 30}`} {...S} strokeWidth="3" />
          <circle cx={x} cy={300 - i * 30} r={32 + i * 10} fill={i === 3 ? 'var(--accent)' : 'var(--paper)'} {...S} />
          <text x={x} y="440" textAnchor="middle" fontSize="15" fill="var(--muted)" fontFamily="Inter Variable">{['Planted', '6 mo', '12 mo', '24 mo'][i]}</text>
        </g>
      ))}
      <path d="M160 300 Q330 200 500 210 T660 170" {...S} strokeDasharray="6 8" />
    </Frame>
  );
}

function FoodArt() {
  return (
    <Frame>
      <g className={lift}>
        <rect x="120" y="90" width="300" height="320" rx="18" fill="var(--paper)" {...S} />
        <text x="148" y="130" fontSize="15" fill="var(--muted)" fontFamily="Inter Variable">DISTRIBUTION REGISTER</text>
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i} transform={`translate(148 ${160 + i * 46})`}>
            <rect width="18" height="18" rx="4" {...S} fill={i < 4 ? 'var(--ink)' : 'var(--paper)'} />
            <path d="M28 9 H200" stroke="var(--rule)" strokeWidth="8" strokeLinecap="round" />
            {i === 2 && <text x="214" y="14" fontSize="13" fill="var(--ink)" fontFamily="Inter Variable">dup?</text>}
          </g>
        ))}
      </g>
      <g className="transition-transform delay-100 duration-700 ease-ui group-hover/art:-translate-y-[10px]">
        <path d="M480 220 H680 L660 400 H500 Z" fill="var(--paper)" {...S} />
        <path d="M480 220 L520 170 H640 L680 220" {...S} />
        <rect x="545" y="260" width="70" height="48" rx="8" fill="var(--accent)" {...S} />
        <text x="580" y="290" textAnchor="middle" fontSize="14" fill="var(--on-accent)" fontFamily="Inter Variable">KIT</text>
      </g>
    </Frame>
  );
}

function EducationArt() {
  return (
    <Frame>
      <g className={lift}>
        <path d="M150 140 Q270 110 390 150 V390 Q270 350 150 380 Z" fill="var(--paper)" {...S} />
        <path d="M390 150 Q510 110 630 140 V380 Q510 350 390 390" fill="var(--paper)" {...S} />
        {[0, 1, 2, 3].map((i) => <path key={i} d={`M190 ${190 + i * 40} Q270 ${175 + i * 40} 350 ${195 + i * 40}`} stroke="var(--rule)" strokeWidth="6" fill="none" strokeLinecap="round" />)}
      </g>
      <g className="transition-transform delay-100 duration-700 ease-ui group-hover/art:-translate-y-[10px]">
        <rect x="440" y="200" width="180" height="110" rx="14" fill="var(--paper)" {...S} />
        <text x="460" y="232" fontSize="13" fill="var(--muted)" fontFamily="Inter Variable">SCHOLARSHIP</text>
        <text x="460" y="268" fontSize="20" fill="var(--ink)" fontFamily="Space Grotesk Variable" fontWeight="500">Need + merit</text>
        <rect x="460" y="282" width="80" height="8" rx="4" fill="var(--accent)" />
      </g>
    </Frame>
  );
}

function HealthArt() {
  return (
    <Frame>
      <g className={lift}>
        <path d="M170 380 L330 150 L490 380 Z" fill="var(--paper)" {...S} />
        <path d="M330 150 V380 M290 380 L330 300 L370 380" {...S} />
        <rect x="300" y="200" width="60" height="60" rx="10" fill="var(--accent)" {...S} />
        <path d="M330 214 V246 M314 230 H346" {...S} strokeWidth="4" />
      </g>
      <g className="transition-transform delay-100 duration-700 ease-ui group-hover/art:-translate-y-[10px]">
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${540 + i * 70} ${300 - (i % 2) * 20})`}>
            <circle r="20" cy="0" fill="var(--paper)" {...S} />
            <path d="M-28 70 Q0 30 28 70" fill="var(--paper)" {...S} />
          </g>
        ))}
      </g>
      <path d="M100 380 H720" {...S} />
    </Frame>
  );
}

export const programmeArt = { green: GreenArt, food: FoodArt, education: EducationArt, health: HealthArt };

/** Small certificate sketch for the verify page. */
export function CertificateArt() {
  return (
    <Frame>
      <g className={lift}>
        <rect x="150" y="90" width="500" height="320" rx="18" fill="var(--paper)" {...S} />
        <rect x="150" y="90" width="14" height="320" fill="var(--ink)" />
        <rect x="200" y="130" width="12" height="12" rx="3" fill="var(--accent)" {...S} />
        <text x="222" y="141" fontSize="14" fill="var(--ink)" fontFamily="Inter Variable" fontWeight="600">PIRENTO FOUNDATION</text>
        <path d="M200 200 H520" stroke="var(--ink)" strokeWidth="14" strokeLinecap="round" />
        <path d="M200 250 H420" stroke="var(--rule)" strokeWidth="10" strokeLinecap="round" />
        <rect x="200" y="268" width="200" height="5" fill="var(--accent)" />
        <path d="M200 350 H330" {...S} />
        <circle cx="570" cy="330" r="38" fill="var(--paper)" {...S} />
        <path d="M553 330 l12 12 l22 -24" {...S} strokeWidth="3" />
      </g>
    </Frame>
  );
}
