import type { VizSpec } from "@/lib/method-viz";

// 「一图看懂」—— 按方法的结构图型渲染 SVG，主题自适应（currentColor + text-* 分组）。

export function MethodViz({
  spec,
  caption = "一图看懂",
}: {
  spec: VizSpec;
  caption?: string;
}) {
  return (
    <figure className="rounded-xl border border-fog-2 bg-soot/40 p-5 sm:p-6">
      <figcaption className="mb-4 flex items-center gap-2 text-xs font-medium tracking-wide text-volt">
        <span className="inline-block size-1.5 rounded-full bg-volt" /> {caption}
      </figcaption>
      <div className="mx-auto max-w-md">
        {spec.type === "matrix2x2" && <Matrix2x2 s={spec} />}
        {spec.type === "pyramid" && <Pyramid layers={spec.layers} />}
        {spec.type === "funnel" && <Funnel stages={spec.stages} />}
        {spec.type === "cycle" && <Cycle nodes={spec.nodes} />}
        {spec.type === "radial" && (
          <Radial center={spec.center} nodes={spec.nodes} />
        )}
        {spec.type === "flow" && <Flow steps={spec.steps} />}
        {spec.type === "grid" && (
          <Grid
            cols={spec.cols}
            cells={spec.cells}
            rowLabels={spec.rowLabels}
            hot={spec.hot}
          />
        )}
        {spec.type === "bmc" && <Bmc />}
        {spec.type === "kano" && <Kano />}
        {spec.type === "porter" && <Porter />}
        {spec.type === "journey" && <Journey stages={spec.stages} />}
      </div>
    </figure>
  );
}

// ── 2×2 矩阵 ──────────────────────────────────────────────
function Matrix2x2({ s }: { s: Extract<VizSpec, { type: "matrix2x2" }> }) {
  const cells: { key: "tl" | "tr" | "bl" | "br"; x: number; y: number }[] = [
    { key: "tl", x: 160, y: 116 },
    { key: "tr", x: 320, y: 116 },
    { key: "bl", x: 160, y: 264 },
    { key: "br", x: 320, y: 264 },
  ];
  const rect: Record<string, [number, number]> = {
    tl: [80, 40],
    tr: [240, 40],
    bl: [80, 190],
    br: [240, 190],
  };
  return (
    <svg viewBox="0 0 420 392" className="w-full" role="img">
      {/* 高亮象限 */}
      {s.hot && (
        <rect
          x={rect[s.hot][0]}
          y={rect[s.hot][1]}
          width={160}
          height={150}
          className="text-volt"
          fill="currentColor"
          fillOpacity={0.12}
        />
      )}
      {/* 外框 + 十字轴 */}
      <g className="text-fog-1" stroke="currentColor" strokeWidth={1.5}>
        <rect x={80} y={40} width={320} height={300} fill="none" />
        <line x1={240} y1={40} x2={240} y2={340} />
        <line x1={80} y1={190} x2={400} y2={190} />
      </g>
      {/* 象限文字 */}
      <g
        fill="currentColor"
        textAnchor="middle"
        fontSize={15}
        fontWeight={600}
      >
        {cells.map((c) => (
          <text
            key={c.key}
            x={c.x}
            y={c.y}
            className={s.hot === c.key ? "text-volt" : "text-bone"}
          >
            {s.q[c.key]}
          </text>
        ))}
      </g>
      {/* 轴标签 */}
      <g className="text-dust" fill="currentColor" fontSize={12}>
        <text x={240} y={372} textAnchor="middle">
          {s.x.label} →
        </text>
        <text x={88} y={356} textAnchor="start">
          {s.x.lo}
        </text>
        <text x={392} y={356} textAnchor="end">
          {s.x.hi}
        </text>
        <text
          x={28}
          y={190}
          textAnchor="middle"
          transform="rotate(-90 28 190)"
        >
          {s.y.label} →
        </text>
        <text x={52} y={336} textAnchor="middle">
          {s.y.lo}
        </text>
        <text x={52} y={52} textAnchor="middle">
          {s.y.hi}
        </text>
      </g>
    </svg>
  );
}

// ── 金字塔（自底向上）──────────────────────────────────────
function Pyramid({ layers }: { layers: string[] }) {
  const apexX = 210,
    apexY = 24,
    baseY = 300,
    halfBase = 175;
  const n = layers.length;
  const H = (baseY - apexY) / n;
  const hw = (y: number) => (halfBase * (baseY - y)) / (baseY - apexY);
  return (
    <svg viewBox="0 0 420 324" className="w-full" role="img">
      {layers.map((label, i) => {
        const yBot = baseY - i * H;
        const yTop = baseY - (i + 1) * H;
        const top = i === n - 1;
        const pts = `${apexX - hw(yBot)},${yBot} ${apexX + hw(yBot)},${yBot} ${apexX + hw(yTop)},${yTop} ${apexX - hw(yTop)},${yTop}`;
        return (
          <g key={i}>
            <polygon
              points={pts}
              className={top ? "text-volt" : "text-fog-1"}
              fill="currentColor"
              fillOpacity={top ? 0.18 : 0.05 + i * 0.03}
              stroke="currentColor"
              strokeWidth={1.5}
            />
            <text
              x={apexX}
              y={(yBot + yTop) / 2 + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={13}
              fontWeight={top ? 700 : 500}
              fill="currentColor"
              className={top ? "text-volt" : "text-bone"}
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── 漏斗（自顶向下）────────────────────────────────────────
function Funnel({ stages }: { stages: string[] }) {
  const topY = 26,
    botY = 312,
    cx = 210,
    wTop = 170,
    wBot = 55;
  const n = stages.length;
  const H = (botY - topY) / n;
  const hw = (y: number) =>
    wTop + ((wBot - wTop) * (y - topY)) / (botY - topY);
  return (
    <svg viewBox="0 0 420 332" className="w-full" role="img">
      {stages.map((label, i) => {
        const yTop = topY + i * H;
        const yBot = topY + (i + 1) * H;
        const pts = `${cx - hw(yTop)},${yTop} ${cx + hw(yTop)},${yTop} ${cx + hw(yBot)},${yBot} ${cx - hw(yBot)},${yBot}`;
        return (
          <g key={i}>
            <polygon
              points={pts}
              className="text-volt"
              fill="currentColor"
              fillOpacity={0.16 - i * 0.022}
              stroke="currentColor"
              strokeWidth={1.5}
              strokeOpacity={0.5}
            />
            <text
              x={cx}
              y={(yTop + yBot) / 2 + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={12.5}
              fontWeight={500}
              fill="currentColor"
              className="text-bone"
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── 闭环飞轮 ──────────────────────────────────────────────
function Cycle({ nodes }: { nodes: string[] }) {
  const cx = 190,
    cy = 190,
    R = 118,
    nodeR = 46;
  const n = nodes.length;
  const pos = (i: number) => {
    const a = (-90 + (i * 360) / n) * (Math.PI / 180);
    return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
  };
  return (
    <svg viewBox="0 0 380 380" className="w-full" role="img">
      <defs>
        <marker
          id="arrowCycle"
          markerWidth={9}
          markerHeight={9}
          refX={5}
          refY={3}
          orient="auto"
        >
          <path d="M0,0 L6,3 L0,6 Z" className="text-volt" fill="currentColor" />
        </marker>
      </defs>
      {/* 弧线箭头：相邻节点之间顺时针 */}
      <g
        className="text-volt"
        stroke="currentColor"
        strokeWidth={2}
        fill="none"
        strokeOpacity={0.55}
      >
        {nodes.map((_, i) => {
          const a0 = -90 + (i * 360) / n;
          const a1 = -90 + ((i + 1) * 360) / n;
          const gap = 16; // 留出节点圆的缺口（度）
          const s = ((a0 + gap) * Math.PI) / 180;
          const e = ((a1 - gap) * Math.PI) / 180;
          const rArc = R;
          const x1 = cx + rArc * Math.cos(s),
            y1 = cy + rArc * Math.sin(s);
          const x2 = cx + rArc * Math.cos(e),
            y2 = cy + rArc * Math.sin(e);
          return (
            <path
              key={i}
              d={`M${x1},${y1} A${rArc},${rArc} 0 0 1 ${x2},${y2}`}
              markerEnd="url(#arrowCycle)"
            />
          );
        })}
      </g>
      {/* 节点 */}
      {nodes.map((label, i) => {
        const { x, y } = pos(i);
        return (
          <g key={i}>
            <circle
              cx={x}
              cy={y}
              r={nodeR}
              className="text-volt"
              fill="currentColor"
              fillOpacity={0.12}
              stroke="currentColor"
              strokeWidth={1.5}
              strokeOpacity={0.6}
            />
            <text
              x={x}
              y={y + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={12.5}
              fontWeight={600}
              fill="currentColor"
              className="text-bone"
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── 线性流程（自上而下分步）──────────────────────────────
function Flow({ steps }: { steps: string[] }) {
  const n = steps.length;
  const boxH = 50,
    gap = 26,
    top = 6;
  const H = top + n * boxH + (n - 1) * gap + 6;
  return (
    <svg viewBox={`0 0 360 ${H}`} className="w-full" role="img">
      <defs>
        <marker
          id="arrowFlow"
          markerWidth={9}
          markerHeight={9}
          refX={5}
          refY={3}
          orient="auto"
        >
          <path d="M0,0 L6,3 L0,6 Z" className="text-volt" fill="currentColor" />
        </marker>
      </defs>
      {steps.map((label, i) => {
        const y = top + i * (boxH + gap);
        return (
          <g key={i}>
            {i > 0 && (
              <line
                x1={180}
                y1={y - gap + 2}
                x2={180}
                y2={y - 4}
                className="text-volt"
                stroke="currentColor"
                strokeWidth={2}
                strokeOpacity={0.55}
                markerEnd="url(#arrowFlow)"
              />
            )}
            <rect
              x={30}
              y={y}
              width={300}
              height={boxH}
              rx={10}
              className="text-volt"
              fill="currentColor"
              fillOpacity={0.1}
              stroke="currentColor"
              strokeWidth={1.5}
              strokeOpacity={0.5}
            />
            <circle
              cx={58}
              cy={y + boxH / 2}
              r={13}
              className="text-volt"
              fill="currentColor"
              fillOpacity={0.2}
            />
            <text
              x={58}
              y={y + boxH / 2 + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={12}
              fontWeight={700}
              fill="currentColor"
              className="text-volt"
            >
              {i + 1}
            </text>
            <text
              x={84}
              y={y + boxH / 2 + 1}
              textAnchor="start"
              dominantBaseline="middle"
              fontSize={13}
              fontWeight={500}
              fill="currentColor"
              className="text-bone"
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── 网格（如九宫格、十种创新）────────────────────────────
function Grid({
  cols,
  cells,
  rowLabels,
  hot,
}: {
  cols: number;
  cells: string[];
  rowLabels?: string[];
  hot?: number;
}) {
  const W = 420,
    gap = 8,
    top = 6,
    cellH = 54;
  const gutter = rowLabels ? 60 : 10;
  const right = 410;
  const cellW = (right - gutter - (cols - 1) * gap) / cols;
  const rows = Math.ceil(cells.length / cols);
  const H = top + rows * cellH + (rows - 1) * gap + 6;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img">
      {rowLabels?.map((rl, r) => (
        <text
          key={`rl${r}`}
          x={gutter / 2 + 2}
          y={top + r * (cellH + gap) + cellH / 2 + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={11}
          fontWeight={600}
          fill="currentColor"
          className="text-volt"
        >
          {rl}
        </text>
      ))}
      {cells.map((label, i) => {
        const r = Math.floor(i / cols),
          c = i % cols;
        const x = gutter + c * (cellW + gap);
        const y = top + r * (cellH + gap);
        const isHot = hot === i;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={cellW}
              height={cellH}
              rx={9}
              className={isHot ? "text-volt" : "text-fog-1"}
              fill="currentColor"
              fillOpacity={isHot ? 0.16 : 0.05}
              stroke="currentColor"
              strokeWidth={1.5}
              strokeOpacity={isHot ? 0.7 : 0.45}
            />
            <text
              x={x + cellW / 2}
              y={y + cellH / 2 + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={12}
              fontWeight={isHot ? 700 : 500}
              fill="currentColor"
              className={isHot ? "text-volt" : "text-bone"}
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── 中心辐射（如波特五力）──────────────────────────────────
function Radial({ center, nodes }: { center: string; nodes: string[] }) {
  const cx = 210,
    cy = 195,
    R = 140,
    cR = 56,
    nodeR = 42;
  const n = nodes.length;
  const pos = (i: number) => {
    const a = (-90 + (i * 360) / n) * (Math.PI / 180);
    return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a), a };
  };
  return (
    <svg viewBox="0 0 420 390" className="w-full" role="img">
      <defs>
        <marker
          id="arrowRadial"
          markerWidth={9}
          markerHeight={9}
          refX={5}
          refY={3}
          orient="auto"
        >
          <path d="M0,0 L6,3 L0,6 Z" className="text-dust" fill="currentColor" />
        </marker>
      </defs>
      {/* 指向中心的箭头 */}
      <g className="text-dust" stroke="currentColor" strokeWidth={1.5} strokeOpacity={0.5}>
        {nodes.map((_, i) => {
          const { x, y, a } = pos(i);
          const sx = x - nodeR * Math.cos(a),
            sy = y - nodeR * Math.sin(a);
          const ex = cx + (cR + 8) * Math.cos(a),
            ey = cy + (cR + 8) * Math.sin(a);
          return (
            <line
              key={i}
              x1={sx}
              y1={sy}
              x2={ex}
              y2={ey}
              markerEnd="url(#arrowRadial)"
            />
          );
        })}
      </g>
      {/* 中心 */}
      <circle
        cx={cx}
        cy={cy}
        r={cR}
        className="text-volt"
        fill="currentColor"
        fillOpacity={0.15}
        stroke="currentColor"
        strokeWidth={1.5}
      />
      <text
        x={cx}
        y={cy + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={13}
        fontWeight={700}
        fill="currentColor"
        className="text-volt"
      >
        {center}
      </text>
      {/* 周边节点 */}
      {nodes.map((label, i) => {
        const { x, y } = pos(i);
        return (
          <g key={i}>
            <circle
              cx={x}
              cy={y}
              r={nodeR}
              className="text-bone"
              fill="var(--color-soot, #1a1a1a)"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeOpacity={0.25}
            />
            <text
              x={x}
              y={y + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={12}
              fontWeight={600}
              fill="currentColor"
              className="text-ash"
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── 商业模式画布（还原 Osterwalder 九模块经典布局）──────────────
function Bmc() {
  const blocks: {
    x: number;
    y: number;
    w: number;
    h: number;
    t: string;
    hot?: boolean;
  }[] = [
    { x: 6, y: 6, w: 86, h: 204, t: "重要伙伴" },
    { x: 96, y: 6, w: 86, h: 100, t: "关键业务" },
    { x: 96, y: 110, w: 86, h: 100, t: "核心资源" },
    { x: 186, y: 6, w: 86, h: 204, t: "价值主张", hot: true },
    { x: 276, y: 6, w: 86, h: 100, t: "客户关系" },
    { x: 276, y: 110, w: 86, h: 100, t: "渠道通路" },
    { x: 366, y: 6, w: 86, h: 204, t: "客户细分" },
    { x: 6, y: 214, w: 220, h: 78, t: "成本结构" },
    { x: 230, y: 214, w: 222, h: 78, t: "收入来源" },
  ];
  return (
    <svg viewBox="0 0 464 300" className="w-full" role="img">
      {blocks.map((b, i) => (
        <g key={i}>
          <rect
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            rx={6}
            className={b.hot ? "text-volt" : "text-fog-1"}
            fill="currentColor"
            fillOpacity={b.hot ? 0.14 : 0.04}
            stroke="currentColor"
            strokeWidth={1.5}
            strokeOpacity={b.hot ? 0.7 : 0.45}
          />
          <text
            x={b.x + b.w / 2}
            y={b.y + (b.h > 120 ? 18 : b.h / 2 + 1)}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={11}
            fontWeight={b.hot ? 700 : 600}
            fill="currentColor"
            className={b.hot ? "text-volt" : "text-bone"}
          >
            {b.t}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ── KANO 模型（满意度 × 功能实现，三类需求曲线）──────────────
function Kano() {
  return (
    <svg viewBox="0 0 440 330" className="w-full" role="img">
      <g className="text-fog-1" stroke="currentColor" strokeWidth={1.5}>
        <line x1={64} y1={36} x2={64} y2={300} />
        <line x1={64} y1={168} x2={416} y2={168} />
      </g>
      <g className="text-dust" fill="currentColor" fontSize={11}>
        <text x={64} y={26} textAnchor="middle">
          满意 ↑
        </text>
        <text x={50} y={304} textAnchor="middle">
          不满
        </text>
        <text x={416} y={186} textAnchor="end">
          功能实现 →
        </text>
      </g>
      {/* 期望型：线性 */}
      <path
        d="M64,294 L410,44"
        className="text-ash"
        stroke="currentColor"
        strokeWidth={2}
        fill="none"
      />
      {/* 基本型：升后趋平（封顶于中性线下方）*/}
      <path
        d="M64,294 Q116,182 410,174"
        className="text-dust"
        stroke="currentColor"
        strokeWidth={2}
        strokeDasharray="5 4"
        fill="none"
      />
      {/* 魅力型：平后陡升 */}
      <path
        d="M64,164 Q322,150 410,48"
        className="text-volt"
        stroke="currentColor"
        strokeWidth={2.5}
        fill="none"
      />
      <g fontSize={11} fontWeight={600} fill="currentColor">
        <text x={296} y={70} className="text-volt">
          魅力型
        </text>
        <text x={332} y={150} className="text-ash">
          期望型
        </text>
        <text x={250} y={190} className="text-dust">
          基本型
        </text>
      </g>
    </svg>
  );
}

// ── 波特五力（四力围绕中心竞争）────────────────────────────
function Porter() {
  const boxes = [
    { x: 140, y: 22, w: 160, h: 54, t: "潜在进入者" },
    { x: 140, y: 304, w: 160, h: 54, t: "替代品威胁" },
    { x: 6, y: 163, w: 122, h: 54, t: "供应商议价力" },
    { x: 312, y: 163, w: 122, h: 54, t: "购买者议价力" },
  ];
  return (
    <svg viewBox="0 0 440 384" className="w-full" role="img">
      <defs>
        <marker
          id="aPorter"
          markerWidth={9}
          markerHeight={9}
          refX={5}
          refY={3}
          orient="auto"
        >
          <path d="M0,0 L6,3 L0,6 Z" className="text-dust" fill="currentColor" />
        </marker>
      </defs>
      <g
        className="text-dust"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeOpacity={0.6}
      >
        <line x1={220} y1={76} x2={220} y2={156} markerEnd="url(#aPorter)" />
        <line x1={220} y1={304} x2={220} y2={226} markerEnd="url(#aPorter)" />
        <line x1={128} y1={190} x2={138} y2={190} markerEnd="url(#aPorter)" />
        <line x1={312} y1={190} x2={302} y2={190} markerEnd="url(#aPorter)" />
      </g>
      <rect
        x={140}
        y={158}
        width={160}
        height={66}
        rx={8}
        className="text-volt"
        fill="currentColor"
        fillOpacity={0.14}
        stroke="currentColor"
        strokeWidth={1.5}
      />
      <text
        x={220}
        y={191}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={12.5}
        fontWeight={700}
        fill="currentColor"
        className="text-volt"
      >
        现有竞争者的竞争
      </text>
      {boxes.map((b, i) => (
        <g key={i}>
          <rect
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            rx={8}
            className="text-bone"
            fill="var(--color-soot, #16181d)"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeOpacity={0.3}
          />
          <text
            x={b.x + b.w / 2}
            y={b.y + b.h / 2 + 1}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={12}
            fontWeight={600}
            fill="currentColor"
            className="text-ash"
          >
            {b.t}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ── 客户旅程（阶段 + 情绪曲线，旅程不是漏斗）──────────────────
function Journey({ stages }: { stages: string[] }) {
  const n = stages.length;
  const x0 = 44,
    x1 = 416;
  const xi = (i: number) => (n === 1 ? (x0 + x1) / 2 : x0 + (i * (x1 - x0)) / (n - 1));
  // 情绪高度（0..1，越大越正向）：好奇→纠结→谷底→满意→高
  const preset: Record<number, number[]> = {
    3: [0.5, 0.35, 0.85],
    4: [0.55, 0.35, 0.65, 0.88],
    5: [0.55, 0.4, 0.28, 0.72, 0.9],
    6: [0.55, 0.42, 0.3, 0.5, 0.75, 0.9],
  };
  const emo = preset[n] ?? stages.map((_, i) => 0.4 + 0.5 * (i / (n - 1 || 1)));
  const topY = 46,
    botY = 150;
  const yi = (i: number) => topY + (1 - emo[i]) * (botY - topY);
  const pts = stages.map((_, i) => `${xi(i)},${yi(i)}`).join(" ");
  const lowI = emo.indexOf(Math.min(...emo));
  const highI = emo.indexOf(Math.max(...emo));
  return (
    <svg viewBox="0 0 460 240" className="w-full" role="img">
      <text x={18} y={topY - 16} fontSize={11} fill="currentColor" className="text-dust">
        情绪
      </text>
      <polyline
        points={pts}
        className="text-volt"
        stroke="currentColor"
        strokeWidth={2.5}
        fill="none"
        strokeLinejoin="round"
      />
      {stages.map((s, i) => (
        <g key={i}>
          <line
            x1={xi(i)}
            y1={yi(i)}
            x2={xi(i)}
            y2={196}
            className="text-fog-1"
            stroke="currentColor"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
          <circle
            cx={xi(i)}
            cy={yi(i)}
            r={5}
            className={i === highI ? "text-volt" : i === lowI ? "text-dust" : "text-ash"}
            fill="currentColor"
          />
          <text
            x={xi(i)}
            y={214}
            textAnchor="middle"
            fontSize={12}
            fontWeight={600}
            fill="currentColor"
            className="text-bone"
          >
            {s}
          </text>
        </g>
      ))}
      <text
        x={xi(highI)}
        y={yi(highI) - 12}
        textAnchor="middle"
        fontSize={10}
        fill="currentColor"
        className="text-volt"
      >
        峰值
      </text>
      <text
        x={xi(lowI)}
        y={yi(lowI) + 20}
        textAnchor="middle"
        fontSize={10}
        fill="currentColor"
        className="text-dust"
      >
        低谷
      </text>
      <line
        x1={x0 - 4}
        y1={196}
        x2={x1 + 4}
        y2={196}
        className="text-fog-1"
        stroke="currentColor"
        strokeWidth={1.5}
      />
    </svg>
  );
}
