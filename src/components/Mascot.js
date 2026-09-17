import React from 'react';
import Svg, { G, Path, Circle, Ellipse, Rect } from 'react-native-svg';

// La mascotte technicien Signa, en style BD — portée du prototype web.
// `size` contrôle la largeur (la hauteur suit le ratio 240x300 du dessin d'origine).
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

        <Circle cx={120} cy={76} r={38} fill="#F2C9A0" />
        <Circle cx={84} cy={78} r={7} fill="#F2C9A0" />
        <Circle cx={156} cy={78} r={7} fill="#F2C9A0" />

        <Path d="M78 60 Q120 30 162 60 Q162 48 120 40 Q78 48 78 60 Z" fill="#FF6B4A" />
        <Path d="M80 62 Q120 34 160 62" fill="none" strokeWidth={4} />
        <Ellipse cx={120} cy={52} rx={6} ry={4} fill="#fff" strokeWidth={3} />

        <Circle cx={106} cy={80} r={4} fill="#1B2340" stroke="none" />
        <Circle cx={134} cy={80} r={4} fill="#1B2340" stroke="none" />
        <Path d="M104 96 Q120 108 136 96" fill="none" strokeWidth={4} />
        <Circle cx={92} cy={90} r={6} fill="#FFB4A0" stroke="none" opacity={0.75} />
        <Circle cx={148} cy={90} r={6} fill="#FFB4A0" stroke="none" opacity={0.75} />

        <Path d="M204 46 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 Z" fill="#FFB020" strokeWidth={2} />
        <Path d="M214 66 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z" fill="#1F9D6B" strokeWidth={2} />
      </G>
    </Svg>
  );
}
