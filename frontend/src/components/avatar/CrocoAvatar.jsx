const COLORS = {
  mint: {
    body: "#63D6AA",
    belly: "#BFEFD8",
    spikes: "#209C84",
    cheek: "#F6C7A8",
  },
  emerald: {
    body: "#2ECC8A",
    belly: "#BFEFD8",
    spikes: "#087F5B",
    cheek: "#F6C7A8",
  },
  aqua: {
    body: "#7EDFD8",
    belly: "#D6F7EF",
    spikes: "#1C9CA4",
    cheek: "#F8C7AE",
  },
  sage: {
    body: "#A7E5C1",
    belly: "#E8F7EF",
    spikes: "#4F9F82",
    cheek: "#F6D6BD",
  },
  blue: {
    body: "#9DD2F7",
    belly: "#DCEEFE",
    spikes: "#3F84C5",
    cheek: "#F8C7AE",
  },
  lavender: {
    body: "#BDB2FF",
    belly: "#E9E6FF",
    spikes: "#7C6AD6",
    cheek: "#F8C7AE",
  },
  yellow: {
    body: "#FFD56B",
    belly: "#FFF4D6",
    spikes: "#C89416",
    cheek: "#F6B78B",
  },
  coral: {
    body: "#FF9E8F",
    belly: "#FFE2DB",
    spikes: "#D96055",
    cheek: "#FFD1B8",
  },
  cream: {
    body: "#F2EFE8",
    belly: "#FFFFFF",
    spikes: "#B7B1A8",
    cheek: "#F6C7A8",
  },
};

const SHAPES = {
  classic: {
    viewBox: "0 0 240 240",
    body: "M78 196C54 181 47 140 59 103C72 62 108 37 149 45C188 53 210 85 211 124C212 167 187 200 145 205C119 208 95 207 78 196Z",
    belly: "M104 122C103 153 113 181 140 184C164 187 183 168 184 139C185 113 169 96 145 93C120 90 105 102 104 122Z",
    head: "M93 78C105 53 134 40 166 48C197 56 219 77 222 101C225 124 205 139 175 134C143 128 110 130 89 115C75 105 78 91 93 78Z",
    snout: "M148 78C181 73 220 82 228 103C236 124 206 140 171 132C145 126 132 112 135 97C137 87 141 81 148 78Z",
  },
  round: {
    viewBox: "0 0 240 240",
    body: "M73 196C48 176 48 126 63 91C79 52 116 36 154 45C196 56 218 95 209 140C199 190 159 211 113 204C96 202 82 201 73 196Z",
    belly: "M98 123C96 154 112 181 141 184C169 186 190 164 188 133C186 105 165 90 139 93C114 96 99 107 98 123Z",
    head: "M78 78C94 51 128 39 166 49C197 57 217 79 218 101C219 124 198 137 165 132C134 127 101 129 82 114C68 103 68 90 78 78Z",
    snout: "M140 75C174 72 213 80 224 101C235 121 207 139 171 132C143 127 129 112 132 96C134 85 137 79 140 75Z",
  },
  tall: {
    viewBox: "0 0 240 240",
    body: "M88 204C67 184 65 135 76 93C88 49 117 28 151 40C185 52 204 91 200 137C196 184 168 209 127 210C108 210 96 208 88 204Z",
    belly: "M110 120C108 154 121 185 145 186C168 187 183 164 181 132C179 103 163 88 142 91C122 94 111 105 110 120Z",
    head: "M84 76C99 48 128 34 160 43C188 51 207 74 208 98C209 120 190 133 160 129C130 125 103 128 87 113C75 101 75 88 84 76Z",
    snout: "M138 72C169 69 204 78 213 98C222 118 197 133 164 127C139 123 126 109 129 94C131 83 134 76 138 72Z",
  },
  tiny: {
    viewBox: "0 0 240 240",
    body: "M82 198C61 182 58 145 69 111C82 70 115 49 151 56C186 64 206 93 208 130C210 174 184 202 143 206C119 208 97 207 82 198Z",
    belly: "M107 129C107 154 119 178 142 180C165 182 182 164 181 137C180 114 165 101 144 99C121 97 108 107 107 129Z",
    head: "M91 90C104 66 131 53 161 60C190 67 209 88 211 109C213 130 195 143 167 138C139 133 110 136 92 122C79 112 79 101 91 90Z",
    snout: "M143 88C174 85 209 93 217 111C225 130 199 144 168 137C144 132 132 120 134 106C136 96 138 91 143 88Z",
  },
  long: {
    viewBox: "0 0 260 220",
    body: "M77 185C49 169 45 128 63 94C84 54 123 46 158 60C199 77 219 100 220 130C221 168 190 190 141 195C113 198 92 194 77 185Z",
    belly: "M105 116C101 143 116 169 146 171C175 174 194 155 190 128C187 104 166 92 140 94C118 97 108 103 105 116Z",
    head: "M83 79C102 55 137 47 179 56C217 64 247 83 253 105C259 128 232 143 191 136C154 129 115 132 88 116C70 105 69 91 83 79Z",
    snout: "M159 75C199 70 244 80 257 102C270 125 236 143 193 135C159 129 143 116 147 99C149 87 153 79 159 75Z",
  },
  abstract: {
    viewBox: "0 0 240 240",
    body: "M73 201C50 185 51 143 63 103C75 64 102 40 139 45C180 51 207 80 212 119C219 166 190 200 145 206C112 210 88 208 73 201Z",
    belly: "M95 126C94 155 110 181 141 184C169 187 189 166 188 137C187 108 166 94 138 96C111 98 96 111 95 126Z",
    head: "M79 84C95 57 124 44 158 50C190 56 214 78 218 101C222 126 199 140 166 134C133 128 103 132 83 118C69 108 68 96 79 84Z",
    snout: "M139 79C170 73 212 81 225 102C238 123 208 141 171 133C143 127 128 114 131 98C133 88 136 82 139 79Z",
  },
};

const EYES = {
  friendly: [
    { cx: 106, cy: 72, rx: 7, ry: 10 },
    { cx: 139, cy: 72, rx: 7, ry: 10 },
  ],
  sleepy: [
    { type: "path", d: "M100 73C106 79 114 79 120 73" },
    { type: "path", d: "M134 73C140 79 148 79 154 73" },
  ],
  curious: [
    { cx: 106, cy: 71, rx: 7, ry: 10 },
    { cx: 142, cy: 75, rx: 7, ry: 10 },
  ],
  tiny: [
    { cx: 108, cy: 74, rx: 5, ry: 7 },
    { cx: 140, cy: 74, rx: 5, ry: 7 },
  ],
};

export const CROCO_SHAPES = Object.keys(SHAPES);
export const CROCO_COLORS = Object.keys(COLORS);
export const CROCO_EYES = Object.keys(EYES);

export function buildCrocoAvatar({
  shape = "classic",
  color = "mint",
  eyes = "friendly",
  spikes = "classic",
  cheeks = true,
} = {}) {
  return { shape, color, eyes, spikes, cheeks };
}

function ScaleSpikes({ palette, variant }) {
  const fill = palette.spikes;

  if (variant === "soft") {
    return (
      <>
        <circle cx="94" cy="55" r="8" fill={fill} opacity="0.74" />
        <circle cx="74" cy="83" r="9" fill={fill} opacity="0.70" />
        <circle cx="62" cy="116" r="9" fill={fill} opacity="0.66" />
        <circle cx="64" cy="151" r="8" fill={fill} opacity="0.58" />
      </>
    );
  }

  if (variant === "ridge") {
    return (
      <>
        <path d="M93 47L79 68L105 65Z" fill={fill} />
        <path d="M73 76L57 98L85 96Z" fill={fill} />
        <path d="M61 108L43 131L74 129Z" fill={fill} />
        <path d="M61 143L43 164L74 163Z" fill={fill} />
      </>
    );
  }

  return (
    <>
      <path d="M98 48C91 53 86 59 82 68C92 68 102 65 110 59C107 53 103 50 98 48Z" fill={fill} />
      <path d="M78 75C68 79 61 87 57 99C70 101 82 98 92 90C89 82 84 77 78 75Z" fill={fill} />
      <path d="M63 109C52 114 45 123 42 136C56 137 69 133 78 124C75 116 70 111 63 109Z" fill={fill} />
      <path d="M63 145C52 151 46 160 45 172C58 172 70 169 80 160C76 152 71 147 63 145Z" fill={fill} />
    </>
  );
}

function Eyes({ variant }) {
  const eyeSet = EYES[variant] || EYES.friendly;

  return (
    <g>
      {eyeSet.map((eye, index) =>
        eye.type === "path" ? (
          <path
            key={index}
            d={eye.d}
            fill="none"
            stroke="#081225"
            strokeWidth="5"
            strokeLinecap="round"
          />
        ) : (
          <ellipse key={index} {...eye} fill="#081225" />
        )
      )}
    </g>
  );
}

export default function CrocoAvatar({
  avatar,
  size = 140,
  className = "",
  showShadow = true,
}) {
  const settings = buildCrocoAvatar(avatar);
  const shape = SHAPES[settings.shape] || SHAPES.classic;
  const palette = COLORS[settings.color] || COLORS.mint;

  return (
    <svg
      width={size}
      height={size}
      viewBox={shape.viewBox}
      className={className}
      role="img"
      aria-label="Avatar crocodile Troco"
    >
      <defs>
        <linearGradient id={`body-${settings.shape}-${settings.color}`} x1="25%" y1="10%" x2="80%" y2="95%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="38%" stopColor={palette.body} />
          <stop offset="100%" stopColor={palette.body} stopOpacity="0.88" />
        </linearGradient>
        <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="10" stdDeviation="8" floodColor="#0f172a" floodOpacity="0.10" />
        </filter>
      </defs>

      {showShadow && <ellipse cx="128" cy="208" rx="70" ry="13" fill="#0f172a" opacity="0.08" />}

      <g filter={showShadow ? "url(#softShadow)" : undefined}>
        <ScaleSpikes palette={palette} variant={settings.spikes} />

        <path d={shape.body} fill={`url(#body-${settings.shape}-${settings.color})`} />
        <path d={shape.belly} fill={palette.belly} opacity="0.82" />
        <path d={shape.head} fill={`url(#body-${settings.shape}-${settings.color})`} />
        <path d={shape.snout} fill={`url(#body-${settings.shape}-${settings.color})`} />

        <Eyes variant={settings.eyes} />

        <circle cx="189" cy="99" r="3.2" fill="#081225" opacity="0.55" />
        <circle cx="208" cy="103" r="3.2" fill="#081225" opacity="0.55" />

        {settings.cheeks && (
          <>
            <circle cx="87" cy="112" r="9" fill={palette.cheek} opacity="0.50" />
            <circle cx="164" cy="112" r="7" fill={palette.cheek} opacity="0.34" />
          </>
        )}

        <path
          d="M145 121C154 130 168 130 177 121"
          fill="none"
          stroke="#081225"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.72"
        />

        <path
          d="M148 126L153 136L160 127"
          fill="#ffffff"
          opacity="0.82"
        />

        <circle cx="112" cy="61" r="3.5" fill="#ffffff" opacity="0.58" />
        <circle cx="82" cy="129" r="5" fill="#ffffff" opacity="0.18" />
      </g>
    </svg>
  );
}
