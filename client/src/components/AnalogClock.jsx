import React from "react";

function pad2(n) {
  return String(n).padStart(2, "0");
}

export default function AnalogClock({ hour, minute, size = 320 }) {
  const r = size / 2;
  const cx = r;
  const cy = r;

  const minuteAngle = minute * 6; // 360/60
  const hourAngle = (hour % 12) * 30 + minute * 0.5; // 360/12 + minute influence

  const ticks = Array.from({ length: 60 }, (_, i) => i);
  const numbers = Array.from({ length: 12 }, (_, i) => i + 1);

  const hand = (len, width, angle) => {
    const x2 = cx + len * Math.sin((Math.PI * angle) / 180);
    const y2 = cy - len * Math.cos((Math.PI * angle) / 180);
    return (
      <line
        x1={cx}
        y1={cy}
        x2={x2}
        y2={y2}
        stroke="black"
        strokeWidth={width}
        strokeLinecap="round"
      />
    );
  };

  return (
    <div style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={r - 6} fill="white" stroke="black" strokeWidth="3" />

        {/* ticks */}
        {ticks.map((i) => {
          const angle = i * 6;
          const isHourTick = i % 5 === 0;
          const outer = r - 10;
          const inner = isHourTick ? r - 30 : r - 22;

          const x1 = cx + outer * Math.sin((Math.PI * angle) / 180);
          const y1 = cy - outer * Math.cos((Math.PI * angle) / 180);
          const x2 = cx + inner * Math.sin((Math.PI * angle) / 180);
          const y2 = cy - inner * Math.cos((Math.PI * angle) / 180);

          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="black"
              strokeWidth={isHourTick ? 3 : 1}
              strokeLinecap="round"
            />
          );
        })}

        {/* numbers */}
        {numbers.map((n) => {
          const angle = n * 30; // 12 numbers
          const dist = r - 55;
          const x = cx + dist * Math.sin((Math.PI * angle) / 180);
          const y = cy - dist * Math.cos((Math.PI * angle) / 180) + 8;

          return (
            <text
              key={n}
              x={x}
              y={y}
              textAnchor="middle"
              fontSize="20"
              fontFamily="Arial"
            >
              {n}
            </text>
          );
        })}

        {/* hands */}
        {hand(r * 0.55, 6, hourAngle)}
        {hand(r * 0.75, 4, minuteAngle)}

        {/* center dot */}
        <circle cx={cx} cy={cy} r="6" fill="black" />

        {/* (không hiển thị digital time theo yêu cầu) */}
      </svg>
    </div>
  );
}
