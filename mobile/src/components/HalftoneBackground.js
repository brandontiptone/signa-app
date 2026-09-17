import React from 'react';
import Svg, { Defs, Pattern, Circle, Rect } from 'react-native-svg';

// Fond en trame de points (façon BD/pop-art), discret, derrière la mascotte.
export default function HalftoneBackground({ width, height, opacity = 0.35 }) {
  return (
    <Svg width={width} height={height} style={{ position: 'absolute', top: 0, left: 0 }}>
      <Defs>
        <Pattern id="dots" width={13} height={13} patternUnits="userSpaceOnUse">
          <Circle cx={2} cy={2} r={1.4} fill="#ffffff" opacity={opacity} />
        </Pattern>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill="url(#dots)" />
    </Svg>
  );
}
