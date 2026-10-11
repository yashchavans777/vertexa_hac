import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import { motion } from 'framer-motion';
import { ShieldAlert, Activity, CheckCircle2, PauseCircle } from 'lucide-react';

/* ─── Strict Color Tokens ─────────────────────────────────────── */
const C_BLOCKED  = '#F01616';       // Strict constraint
const C_ALLOWED  = '#00E676';
const C_HELD     = '#FFB800';
const C_CYAN     = '#00F5FF';
const C_BG       = '#0B0F19';
const C_SURFACE  = 'rgba(15,22,35,0.80)';
const C_BORDER   = 'rgba(0,245,255,0.10)';

/* ─── Mock Telemetry Dataset — 24-hour time series ───────────── */
const generateHourlyData = () => {
  const hours = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const t = new Date(now - i * 3600 * 1000);
    const label = t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    const base = 20 + Math.round(15 * Math.sin((i / 24) * Math.PI));
    const threat = Math.round(3 + Math.random() * 8 + (i < 4 ? 6 : 0));   // spike recent hours
    hours.push({
      time:    label,
      allowed: base + Math.round(Math.random() * 8),
      blocked: threat,
      held:    Math.round(1 + Math.random() * 4),
    });
  }
  return hours;
};

const HOURLY_DATA = generateHourlyData();

/* ─── Blast Radius Distribution ──────────────────────────────── */
const BLAST_DATA = [
  { name: 'Low',      value: 124, color: C_ALLOWED },
  { name: 'Medium',   value: 67,  color: C_HELD },
  { name: 'High',     value: 38,  color: '#FF6B35' },
  { name: 'Critical', value: 21,  color: C_BLOCKED },
];

/* ─── Aggregate KPIs ──────────────────────────────────────────── */
const totalActions    = HOURLY_DATA.reduce((s, d) => s + d.allowed + d.blocked + d.held, 0);
const totalBlocked    = HOURLY_DATA.reduce((s, d) => s + d.blocked, 0);
const totalAllowed    = HOURLY_DATA.reduce((s, d) => s + d.allowed, 0);
const totalHeld       = HOURLY_DATA.reduce((s, d) => s + d.held, 0);
const approvalRate    = ((totalAllowed / totalActions) * 100).toFixed(1);

/* ─── Stat Card Component ─────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, unit = '', color, glow = false, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="glass-panel p-5 flex flex-col gap-3 relative overflow-hidden"
      style={{
        borderColor: glow ? `${color}30` : C_BORDER,
        boxShadow: glow ? `0 0 24px ${color}18, inset 0 0 24px ${color}08` : 'none',
      }}
    >
      {/* Background accent blob */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl pointer-events-none"
        style={{ background: `${color}14` }}
      />

      <div className="flex items-center justify-between relative z-10">
        <span className="text-[10px] tracking-[0.25em] uppercase font-medium"
          style={{ color: 'var(--text-secondary)' }}>
          {label}
        </span>
        <div
          className="p-1.5 rounded-md"
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}
        >
          <Icon size={13} style={{ color }} />
        </div>
      </div>

      <div className="relative z-10">
        <motion.span
          className="text-3xl font-bold font-mono tracking-tight"
          style={{
            color,
            textShadow: glow ? `0 0 16px ${color}80` : `0 0 8px ${color}40`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: delay + 0.2 }}
        >
          {value}
        </motion.span>
        {unit && (
          <span className="ml-1 text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>
            {unit}
          </span>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Custom Tooltip ──────────────────────────────────────────── */
const CyberTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="glass-panel px-4 py-3 text-xs font-mono"
      style={{
        background: C_BG,
        border: `1px solid ${C_BORDER}`,
        borderRadius: 8,
        boxShadow: `0 8px 32px rgba(0,0,0,0.6)`,
        minWidth: 160,
      }}
    >
      <p className="mb-2 tracking-widest uppercase text-[9px]" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            <span className="capitalize" style={{ color: 'var(--text-secondary)' }}>
              {entry.dataKey}
            </span>
          </div>
          <span className="font-bold" style={{ color: entry.color }}>
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ─── Blast Radius Pie Tooltip ────────────────────────────────── */
const BlastTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div
      className="glass-panel px-3 py-2 text-xs font-mono"
      style={{ background: C_BG, border: `1px solid ${C_BORDER}`, borderRadius: 8 }}
    >
      <span style={{ color: d.payload.color }}>{d.name}</span>
      <span className="ml-3 font-bold" style={{ color: 'var(--text-primary)' }}>{d.value} actions</span>
    </div>
  );
};

/* ─── Section Header ──────────────────────────────────────────── */
function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-4">
      <h3 className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: C_CYAN }}>
        {title}
      </h3>
      {subtitle && (
        <p className="text-[10px] tracking-wider mt-0.5" style={{ color: 'var(--text-dim)' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

/* ─── Executive Analytics Dashboard ──────────────────────────── */
export default function ExecutiveAnalytics() {
  return (
    <div className="flex flex-col gap-6 h-full">

      {/* ── Row 1: KPI Stat Cards ───────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Activity}
          label="Total Actions Evaluated"
          value={totalActions}
          color={C_CYAN}
          delay={0}
        />
        <StatCard
          icon={ShieldAlert}
          label="Threats Intercepted"
          value={totalBlocked}
          color={C_BLOCKED}
          glow={true}
          delay={0.08}
        />
        <StatCard
          icon={CheckCircle2}
          label="Approval Rate"
          value={approvalRate}
          unit="%"
          color={C_ALLOWED}
          delay={0.16}
        />
        <StatCard
          icon={PauseCircle}
          label="Active Holds"
          value={totalHeld}
          color={C_HELD}
          delay={0.24}
        />
      </div>

      {/* ── Row 2: Threat Area Chart ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.3 }}
        className="glass-panel p-5 flex flex-col"
        style={{ minHeight: 280 }}
      >
        <SectionHeader
          title="24-Hour Threat Activity Timeline"
          subtitle="Allowed vs. Blocked actions over the last 24 hours"
        />

        {/* SVG gradient defs injected via recharts defs prop */}
        <div className="flex-1" style={{ minHeight: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={HOURLY_DATA} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradAllowed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C_ALLOWED} stopOpacity={0.28} />
                  <stop offset="95%" stopColor={C_ALLOWED} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradBlocked" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C_BLOCKED} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={C_BLOCKED} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradHeld" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C_HELD} stopOpacity={0.22} />
                  <stop offset="95%" stopColor={C_HELD} stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(0,245,255,0.05)"
                vertical={false}
              />

              <XAxis
                dataKey="time"
                tick={{ fill: 'var(--text-dim)', fontSize: 9, fontFamily: 'monospace' }}
                tickLine={false}
                axisLine={false}
                interval={3}
              />
              <YAxis
                tick={{ fill: 'var(--text-dim)', fontSize: 9, fontFamily: 'monospace' }}
                tickLine={false}
                axisLine={false}
              />

              <Tooltip content={<CyberTooltip />} cursor={{ stroke: `${C_CYAN}30`, strokeWidth: 1 }} />

              <Area
                type="monotone"
                dataKey="allowed"
                stroke={C_ALLOWED}
                strokeWidth={1.5}
                fill="url(#gradAllowed)"
                dot={false}
                activeDot={{ r: 4, fill: C_ALLOWED, strokeWidth: 0 }}
              />
              <Area
                type="monotone"
                dataKey="held"
                stroke={C_HELD}
                strokeWidth={1.5}
                fill="url(#gradHeld)"
                dot={false}
                activeDot={{ r: 4, fill: C_HELD, strokeWidth: 0 }}
              />
              {/* STRICT: blocked must use exactly #F01616 */}
              <Area
                type="monotone"
                dataKey="blocked"
                stroke={C_BLOCKED}
                strokeWidth={2}
                fill="url(#gradBlocked)"
                dot={false}
                activeDot={{ r: 5, fill: C_BLOCKED, strokeWidth: 0, filter: `drop-shadow(0 0 6px ${C_BLOCKED})` }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-3 pt-3"
          style={{ borderTop: `1px solid ${C_BORDER}` }}>
          {[
            { color: C_ALLOWED, label: 'Allowed' },
            { color: C_BLOCKED, label: 'Blocked (Threats)' },
            { color: C_HELD,    label: 'Held for Approval' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="w-6 h-0.5 rounded-full" style={{ background: color }} />
              <span className="text-[9px] tracking-wider uppercase" style={{ color: 'var(--text-secondary)' }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Row 3: Blast Radius Distribution ─────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.42 }}
          className="glass-panel p-5 flex flex-col"
          style={{ minHeight: 280 }}
        >
          <SectionHeader
            title="Actions by Blast Radius"
            subtitle="Distribution of impact severity across all evaluated actions"
          />
          <div className="flex-1" style={{ minHeight: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  {BLAST_DATA.map((d) => (
                    <radialGradient key={d.name} id={`pie-${d.name}`} cx="50%" cy="50%" r="50%">
                      <stop offset="0%"   stopColor={d.color} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={d.color} stopOpacity={0.5} />
                    </radialGradient>
                  ))}
                </defs>
                <Pie
                  data={BLAST_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius="45%"
                  outerRadius="70%"
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {BLAST_DATA.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={`url(#pie-${entry.name})`}
                      style={{
                        filter: entry.color === C_BLOCKED
                          ? `drop-shadow(0 0 8px ${C_BLOCKED})`
                          : undefined,
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<BlastTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value, entry) => (
                    <span
                      className="text-[10px] tracking-wider uppercase font-mono"
                      style={{ color: entry.color }}
                    >
                      {value}
                    </span>
                  )}
                  wrapperStyle={{ fontSize: 10 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Bar Chart: Action breakdown by category */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.52 }}
          className="glass-panel p-5 flex flex-col"
          style={{ minHeight: 280 }}
        >
          <SectionHeader
            title="Decision Distribution"
            subtitle="Allowed · Blocked · Held breakdown by blast-radius tier"
          />
          <div className="flex-1" style={{ minHeight: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={BLAST_DATA}
                margin={{ top: 6, right: 8, left: -20, bottom: 0 }}
                barCategoryGap="35%"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(0,245,255,0.05)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'var(--text-dim)', fontSize: 9, fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--text-dim)', fontSize: 9, fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<BlastTooltip />} cursor={{ fill: 'rgba(0,245,255,0.04)' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {BLAST_DATA.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={entry.color}
                      style={{
                        filter: entry.color === C_BLOCKED
                          ? `drop-shadow(0 0 6px ${C_BLOCKED})`
                          : `drop-shadow(0 0 3px ${entry.color}60)`,
                      }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
