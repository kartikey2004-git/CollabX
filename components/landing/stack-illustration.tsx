export function StackIllustration() {
  return (
    <svg
      width="260"
      height="660"
      viewBox="0 0 260 660"
      className="h-auto w-[180px] md:w-[220px]"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id="deviceFace"
          x1="20"
          y1="10"
          x2="240"
          y2="95"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#050505" />
          <stop offset="55%" stopColor="#0d0d0f" />
          <stop offset="100%" stopColor="#050505" />
        </linearGradient>

        <linearGradient
          id="iridescence"
          x1="20"
          y1="0"
          x2="240"
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="35%" stopColor="#f5f5f5" />
          <stop offset="65%" stopColor="#fdba74" />
          <stop offset="100%" stopColor="#f9a8d4" />
        </linearGradient>

        <linearGradient id="deviceSide" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#151517" />
          <stop offset="100%" stopColor="#080808" />
        </linearGradient>

        <path
          id="plateTop"
          d="M130 0
             C136 0 142 1.5 147 4
             L226 40
             C233 43 233 51 226 54
             L147 90
             C142 92.5 136 94 130 94
             C124 94 118 92.5 113 90
             L34 54
             C27 51 27 43 34 40
             L113 4
             C118 1.5 124 0 130 0 Z"
        />
      </defs>

      <g stroke="#4b4b4f" strokeWidth="1" strokeDasharray="2 5">
        <path d="M34 90 V610" />
        <path d="M130 130 V630" />
        <path d="M226 90 V610" />
      </g>

      <g>
        <path
          d="M34 40 L34 90 L130 130 L226 90 L226 40 L130 76 Z"
          fill="url(#deviceSide)"
          stroke="#2c2c30"
          strokeWidth="1"
        />

        {/* iridescent edge line along the bottom of the side wall */}
        <path
          d="M34 88 L130 128 L226 88"
          stroke="url(#iridescence)"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* vent slats on the left face */}
        <g stroke="#3a3a3e" strokeWidth="1.6" strokeLinecap="round">
          <path d="M40 52 L40 74" />
          <path d="M45 54 L45 76" />
          <path d="M50 56 L50 78" />
          <path d="M55 58 L55 80" />
          <path d="M60 60 L60 82" />
        </g>

        {/* top face */}
        <path
          d="M130 4
             C136 4 142 5.5 147 8
             L222 42
             C228 45 228 51 222 54
             L147 88
             C142 90.5 136 92 130 92
             C124 92 118 90.5 113 88
             L38 54
             C32 51 32 45 38 42
             L113 8
             C118 5.5 124 4 130 4 Z"
          fill="url(#deviceFace)"
          stroke="#e5e5e5"
          strokeOpacity="0.35"
          strokeWidth="1.2"
        />

        <g
          stroke="#f4f4f5"
          strokeWidth="4.5"
          strokeLinecap="round"
          transform="translate(130 48)"
        >
          <path d="M0 -16 L0 16" />
          <path d="M-14 -8 L14 8" />
          <path d="M14 -8 L-14 8" />
        </g>
      </g>

      <StackLayer cy={230} />
      <StackLayer cy={345} />
      <StackLayer cy={460} />
      <StackLayer cy={575} />
    </svg>
  );
}

function StackLayer({ cy }: { cy: number }) {
  return (
    <g>
      <path
        d={`
          M34 ${cy + 40}
          L34 ${cy + 88}
          L130 ${cy + 128}
          L226 ${cy + 88}
          L226 ${cy + 40}
          L130 ${cy + 76}
          Z
        `}
        fill="url(#deviceSide)"
        stroke="#2c2c30"
        strokeWidth="1"
      />

      <use
        href="#plateTop"
        transform={`translate(0 ${cy})`}
        fill="url(#deviceFace)"
        stroke="#f3f4f6"
        strokeOpacity="0.25"
        strokeWidth="1"
      />

      <path
        d={`
          M34 ${cy + 86}
          L130 ${cy + 126}
          L226 ${cy + 86}
        `}
        stroke="url(#iridescence)"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <circle cx="34" cy={cy + 47} r="2.2" fill="#7d7d82" />
      <circle cx="226" cy={cy + 47} r="2.2" fill="#7d7d82" />
      <circle cx="130" cy={cy} r="2.2" fill="#7d7d82" />
      <circle cx="130" cy={cy + 94} r="2.2" fill="#7d7d82" />
    </g>
  );
}
