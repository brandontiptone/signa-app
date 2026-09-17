import React from 'react';
import Svg, { G, Path, Circle, Ellipse, Rect } from 'react-native-svg';

// La mascotte technicien Signa, en style BD — portée du prototype web,
// avec une vraie casquette (dôme + visière) bien visible.
export default function Mascot({ size = 200 }) {
  const height = (size / 240) * 300;
  return (
    <Svg width={size} height={height} viewBox="0 0 240 300">
      <G stroke="#1B2340" strokeWidth={5} strokeLinejoin="round" strokeLinecap="round">
        <Ellipse cx={120} cy={285} rx={62} ry={9} fill="rgba(0,0,0,0.22)" stroke="none" />
        <Path d="M178 70 L204 54" stroke="#FFB020" strokeWidth={4} opacity={0.75} />
        <Path d="M186 88 L214 78" stroke="#FFB020" strokeWidth={4} opacity={0.75} />
        <Path d="M182 106 L210 102" stroke="#FFB020" strokeWidth={4} opacity={0.75} />

        <Rect x={92} y={205} width={24} height={65} rx={10} fill="#1B2340" />
        <Rect x={128} y={205} width={24} height={65} rx={10} fill="#1B2340" />
        <Rect x={86} y={262} width={34} height={18} rx={7} fill="#E8522F" />
        <Rect x={124} y={262} width={34} height={18} rx={7} fill="#E8522F" />

        <Path d="M84 130 Q120 112 160 130 L156 208 Q120 222 88 208 Z" fill="#2A3157" />
        <Path d="M92 128 Q120 118 152 128 L148 200 Q120 210 96 200 Z" fill="#FF6B4A" />
        <Path d="M98 150 L142 150" stroke="#FFE8E1" strokeWidth={4} opacity={0.85} />

        <Rect x={90} y={196} width={64} height={14} rx={6} fill="#1B2340" />
        <Rect x={104} y={198} width={14} height={12} rx={3} fill="#FFB020" strokeWidth={3} />
        <Rect x={126} y={198} width={14} height={12} rx={3} fill="#1F9D6B" strokeWidth={3} />

        <Path d="M92 134 Q68 150 70 188" fill="none" strokeWidth={14} stroke="#2A3157" />
        <Circle cx={70} cy={192} r={12} fill="#F2C9A0" />
        <Rect x={46} y={182} width={34} height={44} rx={6} fill="#fff" />
        <Path d="M53 202 L61 210 L74 192" fill="none" stroke="#1F9D6B" strokeWidth={5} />

        <Path d="M150 132 Q182 118 186 78" fill="none" strokeWidth={14} stroke="#FF6B4A" />
        <Circle cx={188} cy={70} r={13} fill="#F2C9A0" />

        <Rect x={110} y={98} width={20} height={18} fill="#F2C9A0" stroke="none" />

        {/* Tête */}
        <Circle cx={120} cy={76} r={38} fill="#F2C9A0" />
        <Circle cx={84} cy={78} r={7} fill="#F2C9A0" />
        <Circle cx={156} cy={78} r={7} fill="#F2C9A0" />

        {/* Casquette de technicien : dôme (2 tons) + visière bien marquée */}
        <Path d="M73 60 Q73 17 120 17 Q167 17 167 60 Q167 45 120 37 Q73 45 73 60 Z" fill="#E8522F" />
        <Path d="M81 58 Q81 27 120 27 Q159 27 159 58 Q159 44 120 38 Q81 44 81 58 Z" fill="#FF6B4A" />
        <Path d="M84 56 Q120 72 156 56 Q157 65 120 78 Q83 65 84 56 Z" fill="#E8522F" />
        <Ellipse cx={120} cy={33} rx={7} ry={5} fill="#fff" strokeWidth={3} />

        {/* Visage */}
        <Circle cx={106} cy={86} r={4} fill="#1B2340" stroke="none" />
        <Circle cx={134} cy={86} r={4} fill="#1B2340" stroke="none" />
        <Path d="M104 100 Q120 112 136 100" fill="none" strokeWidth={4} />
        <Circle cx={92} cy={96} r={6} fill="#FFB4A0" stroke="none" opacity={0.75} />
        <Circle cx={148} cy={96} r={6} fill="#FFB4A0" stroke="none" opacity={0.75} />

        <Path d="M204 46 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 Z" fill="#FFB020" strokeWidth={2} />
        <Path d="M214 66 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z" fill="#1F9D6B" strokeWidth={2} />
      </G>
    </Svg>
  );
}
