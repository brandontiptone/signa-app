import React from 'react';
import Svg, { Rect, Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

// Le vrai logo Signa : signature stylisée en "S" + badge "signé" (coche verte).
export default function Logo({ size = 44 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#ffffff" stopOpacity={0.35} />
          <Stop offset="1" stopColor="#ffffff" stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Rect x={4} y={4} width={92} height={92} rx={27} fill="#FF6B4A" />
      <Rect x={4} y={4} width={92} height={92} rx={27} fill="url(#sheen)" opacity={0.5} />
      <Path
        d="M33,31 C33,31 67,24 67,40 C67,56 29,50 29,64 C29,80 69,75 69,60"
        fill="none" stroke="#FFFFFF" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round"
      />
      <Circle cx={75} cy={75} r={13} fill="#1F9D6B" stroke="#FF6B4A" strokeWidth={3} />
      <Path d="M69,75 L74,80 L82,70" fill="none" stroke="#ffffff" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
