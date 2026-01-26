import React from "react";
import Svg, { Circle, Line, Path } from "react-native-svg";

import type { IconProps } from "@/types";

const DeckIcon = ({
  width = 28,
  height = 28,
  fill = "#000",
  accessibilityLabel,
}: IconProps) => (
  <Svg
    width={width}
    height={height}
    viewBox="0 0 32 32"
    accessibilityLabel={accessibilityLabel}
  >
    <Circle
      cx={11}
      cy={16}
      r={7}
      stroke={fill}
      strokeWidth={2}
      fill="none"
    />
    <Circle cx={11} cy={16} r={2} fill={fill} />
    <Line
      x1={11}
      y1={9}
      x2={11}
      y2={13}
      stroke={fill}
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Path
      d="M19 9h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-7"
      stroke={fill}
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={21.5} cy={12.5} r={1} fill={fill} />
    <Circle cx={24.5} cy={12.5} r={1} fill={fill} />
    <Path
      d="M17 16h6"
      stroke={fill}
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Path
      d="M7 23h18"
      stroke={fill}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

export default DeckIcon;
