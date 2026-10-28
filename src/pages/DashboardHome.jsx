import { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, PieChart as PieChartIcon, Activity, BarChart3, FileText, TrendingUp, Clock } from 'lucide-react';
import { motion as Motion, animate } from 'motion/react';
import { getChartPalette, getAccent } from '../lib/accent';

// Taste Skill v2, app sheet framed-sheet: the dashboard is an app
// screen, not a landing page. KPIs are type in one container split
// by 1px dividers (no tiles, no icon chips, no sparklines), colour
// goes on data only (one navy hue, not a rainbow), surfaces are
// flat with a 1px line, tables are rules with right-aligned
// tabular figures, and nothing performs an entrance. All data
// computations below are unchanged from the original.
//
// Amicro batch (copy only): the two Recharts charts below are
// replaced by local pure-SVG charts in the Amicro Mono style
// (monochrome navy shades, rounded pillars / rounded donut ring,
// lucide icons, a motion spring on the chart marks on first render
// only). No Amicro code was copied verbatim — these are original
// SVG components written in that style. Amicro itself is MIT
// licensed; see amicro.dev. No new dependencies were added.
//
// PanelUI Batch 1 (copy only): the KPI strip below is replaced by
// PanelUI-Web-style KPI panels (icon + French title, animated
// value, breakdown caption). PanelUI Web (panelui.dev) is MIT
// licensed; this is structure/style inspiration only, not a
// verbatim copy of PanelUI code, written in .jsx with only
// dependencies already in package.json (motion, lucide-react).
// No new KPI, trend, or previous-month figure is introduced here.
// Chart palette follows the chosen theme accent (and light/dark mode),
// via src/lib/accent.js — navy stays the default.

// Fallback icons, matching exactly the icons useDashboardData
// already attaches to each stat (FileText / TrendingUp / Clock).
// Used only if a stat arrives without its icon field.
const FALLBACK_KPI_ICONS = {
  'Total des Rapports': FileText,
  'Ce Mois': TrendingUp,
  'Dernière Entrée': Clock
};

// Rolling Number in the PanelUI Web style: a numeric value counts
// up once on mount (or when it changes) via motion, with no loop.
// Non-numeric values (e.g. the "Dernière Entrée" date string) are
// rendered exactly as passed in, never forced into a number.
const RollingNumber = ({ value }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (typeof value !== 'number') return undefined;
    const controls = animate(0, value, {
      duration: 0.9,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(Math.round(v))
    });
    return () => controls.stop();
  }, [value]);
  if (typeof value !== 'number') return <span>{value}</span>;
  return <span>{display}</span>;
};

export const DashboardHome = ({ stats, dataList, chartData, theme = 'light', accent = 'navy' }) => {
  const NAVY_SHADES = getChartPalette(accent, theme);
  // Work-per-day computation, copied exactly from the previous
  // Recharts version: one entry per day of the current month,
  // counted from dataList items dated in the current month.
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const schedule = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    count: 0
  }));
  dataList.forEach(item => {
    const d = new Date(item.date);
    if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
      const day = d.getDate();
      if (schedule[day - 1]) schedule[day - 1].count++;
    }
  });
  const maxCount = Math.max(1, ...schedule.map(s => s.count));

  // Mono Pill Pillars geometry (pure SVG, light theme / white sheet).
  const gutter = 32;
  const slot = 20;
  const pillarWidth = 12;
  const baselineY = 220;
  const plotTop = 20;
  const plotHeight = baselineY - plotTop;
  const pillarChartWidth = gutter + daysInMonth * slot;
  const yTicks = maxCount === 1 ? [0, 1] : [0, Math.ceil(maxCount / 2), maxCount];

  // Mono Rounded Donut Ring geometry (pure SVG). chartData and
  // its values/percentages are used exactly as passed in.
  const donutTotal = (chartData || []).reduce((sum, entry) => sum + (entry.value || 0), 0);
  const donutRadius = 70;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const donutGap = 4;
  let donutCursor = 0;
  const donutSegments = (chartData || []).map((entry, index) => {
    const fraction = donutTotal > 0 ? (entry.value || 0) / donutTotal : 0;
    const dash = Math.max(0, fraction * donutCircumference - donutGap);
    const start = donutCursor + donutGap / 2;
    donutCursor += fraction * donutCircumference;
    return {
      ...entry,
      index,
      color: NAVY_SHADES[index % NAVY_SHADES.length],
      dash,
      offset: donutTotal > 0 ? (donutCircumference - start) % donutCircumference : 0,
      percent: fraction * 100
    };
  });

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900 leading-tight">Tableau de bord</h1>
        <p className="text-sm text-slate-500 mt-1">Mois en cours · Travaux hydrauliques, Fquih Ben Salah.</p>
      </header>

      {/* PanelUI Batch 1: KPI panels in place of the old KPI strip.
          One panel per stat already passed in, same labels, values
          and breakdowns. No trend line is shown: this file computes
          no previous-period comparison for these KPIs (the
          "Évolution vs mois précédent" column below belongs to the
          per-nature table, not to these totals), so no trend is
          invented. The breakdown rows are the existing captions. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon || FALLBACK_KPI_ICONS[stat.label];
          const isNumeric = typeof stat.value === 'number';
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-line p-5">
              <div className="flex items-center gap-2">
                {Icon ? <Icon className="w-4 h-4 text-accent" /> : null}
                <span className="text-sm text-slate-500">{stat.label}</span>
              </div>
              <span className={`mt-2 block font-semibold text-slate-900 tabular-nums ${isNumeric ? 'text-3xl' : 'text-2xl'}`}>
                <RollingNumber value={stat.value} />
              </span>
              {stat.breakdown && (
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 tabular-nums">
                  <span>RNVL: {stat.breakdown.RNVL || 0}</span>
                  <span>FUITE: {stat.breakdown.FUITE || 0}</span>
                  <span>F. SP: {stat.breakdown['F. SP'] || 0}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Work Schedule Chart: Mono Pill Pillars (Amicro Mono style) */}
        <div className="bg-white rounded-xl border border-line p-6">
          <div className="flex items-center gap-2 mb-6">
            <CalendarIcon className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-semibold text-slate-900">Calendrier de travail (mois en cours)</h2>
          </div>
          <div className="h-[300px]">
            <svg
              viewBox={`0 0 ${pillarChartWidth} 260`}
              width="100%"
              height="100%"
              preserveAspectRatio="xMidYMid meet"
              role="img"
              aria-label="Nombre de travaux par jour du mois en cours"
            >
              {yTicks.map((tick) => {
                const y = baselineY - (tick / maxCount) * plotHeight;
                return (
                  <g key={tick}>
                    <line x1={gutter} x2={pillarChartWidth} y1={y} y2={y} stroke="#EDEDED" strokeDasharray="3 3" />
                    <text x={gutter - 8} y={y + 4} fontSize={11} fill="#64748b" textAnchor="end" style={{ fontVariantNumeric: 'tabular-nums' }}>{tick}</text>
                  </g>
                );
              })}
              <line x1={gutter} x2={pillarChartWidth} y1={baselineY} y2={baselineY} stroke="#E2E6EA" />
              {schedule.map((entry, i) => {
                const height = (entry.count / maxCount) * plotHeight;
                if (height <= 0) {
                  return (
                    <text key={entry.day} x={gutter + i * slot + slot / 2} y={baselineY + 18} fontSize={11} fill="#64748b" textAnchor="middle" style={{ fontVariantNumeric: 'tabular-nums' }}>{entry.day}</text>
                  );
                }
                const x = gutter + i * slot + (slot - pillarWidth) / 2;
                const y = baselineY - height;
                const radius = Math.min(6, pillarWidth / 2, height);
                // Shade by intensity within the one navy family:
                // busier days are darker, quiet days are paler.
                const shadeIndex = Math.min(
                  NAVY_SHADES.length - 1,
                  Math.ceil((entry.count / maxCount) * NAVY_SHADES.length) - 1
                );
                const path = `M ${x} ${baselineY} L ${x} ${y + radius} Q ${x} ${y} ${x + radius} ${y} L ${x + pillarWidth - radius} ${y} Q ${x + pillarWidth} ${y} ${x + pillarWidth} ${y + radius} L ${x + pillarWidth} ${baselineY} Z`;
                return (
                  <g key={entry.day}>
                    <Motion.path
                      d={path}
                      fill={NAVY_SHADES[shadeIndex]}
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ type: 'spring', stiffness: 120, damping: 20, delay: i * 0.01 }}
                      style={{ transformBox: 'fill-box', transformOrigin: 'bottom' }}
                    >
                      <title>{`Jour ${entry.day} : ${entry.count} travaux`}</title>
                    </Motion.path>
                    <text x={x + pillarWidth / 2} y={y - 6} fontSize={11} fontWeight={600} fill={getAccent(accent).light} textAnchor="middle" style={{ fontVariantNumeric: 'tabular-nums' }}>{entry.count}</text>
                    <text x={gutter + i * slot + slot / 2} y={baselineY + 18} fontSize={11} fill="#64748b" textAnchor="middle" style={{ fontVariantNumeric: 'tabular-nums' }}>{entry.day}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Nature Distribution Chart: Mono Rounded Donut Ring, one navy hue family, not rainbow */}
        <div className="bg-white rounded-xl border border-line p-6">
          <div className="flex items-center gap-2 mb-6">
            <PieChartIcon className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-semibold text-slate-900">Répartition par nature</h2>
          </div>
          <div className="h-[300px]">
            {donutTotal > 0 ? (
              <div className="flex h-full flex-col">
                <svg
                  viewBox="0 0 200 200"
                  className="mx-auto h-[190px] w-[190px] shrink-0"
                  role="img"
                  aria-label="Répartition des travaux par nature"
                >
                  <Motion.g
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                    style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                  >
                    <g transform="rotate(-90 100 100)">
                      {donutSegments.map((segment) => (
                        segment.dash > 0 ? (
                          <circle
                            key={segment.index}
                            cx={100}
                            cy={100}
                            r={donutRadius}
                            fill="none"
                            stroke={segment.color}
                            strokeWidth={26}
                            strokeLinecap="round"
                            strokeDasharray={`${segment.dash} ${donutCircumference - segment.dash}`}
                            strokeDashoffset={segment.offset}
                          >
                            <title>{`${segment.name} : ${segment.value} (${segment.percent.toFixed(0)}%)`}</title>
                          </circle>
                        ) : null
                      ))}
                    </g>
                  </Motion.g>
                  <text x={100} y={98} fontSize={26} fontWeight={600} fill={getAccent(accent).light} textAnchor="middle" style={{ fontVariantNumeric: 'tabular-nums' }}>{donutTotal}</text>
                  <text x={100} y={118} fontSize={11} fill="#64748b" textAnchor="middle">travaux</text>
                </svg>
                <ul className="mt-2 space-y-1.5 overflow-y-auto">
                  {donutSegments.map((segment) => (
                    <li key={segment.index} className="flex items-center gap-2 text-sm">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} />
                      <span className="text-slate-700">{segment.name}</span>
                      <span className="ml-auto font-semibold text-slate-900 tabular-nums">{segment.value}</span>
                      <span className="w-12 text-right text-slate-500 tabular-nums">{segment.percent.toFixed(0)}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-slate-500 text-sm italic">Aucune donnée à afficher.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Material Consumption */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-line p-6">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-semibold text-slate-900">Consommation de matériel</h2>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {(() => {
              const now = new Date();
              const materials = dataList
                .filter(item => {
                  const d = new Date(item.date);
                  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                })
                .reduce((acc, curr) => {
                  if (curr.material) {
                    const mats = curr.material.split(',').map(m => m.trim());
                    mats.forEach(m => {
                      acc[m] = (acc[m] || 0) + 1;
                    });
                  }
                  return acc;
                }, {});

              const sortedMats = Object.entries(materials).sort((a, b) => b[1] - a[1]);

              if (sortedMats.length === 0) return <p className="text-slate-500 text-sm italic">Aucun matériel enregistré ce mois-ci.</p>;

              return sortedMats.map(([name, count]) => (
                <div key={name} className="flex items-center justify-between py-3 border-b border-line last:border-b-0">
                  <span className="text-sm font-medium text-slate-700">{name}</span>
                  <span className="text-sm text-slate-900 tabular-nums">{count} fois</span>
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Nature Summary Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-line p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-semibold text-slate-900">Résumé des travaux par nature</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left">
              <thead>
                <tr className="border-b border-line">
                  <th className="pb-4 text-xs font-medium text-slate-500">Nature du travail</th>
                  <th className="pb-4 text-xs font-medium text-slate-500 text-right">Nombre</th>
                  <th className="pb-4 text-xs font-medium text-slate-500 text-right">Évolution vs mois précédent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(() => {
                  const now = new Date();
                  const thisMonthNatures = dataList
                    .filter(item => {
                      const d = new Date(item.date);
                      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                    })
                    .reduce((acc, curr) => {
                      acc[curr.nature] = (acc[curr.nature] || 0) + 1;
                      return acc;
                    }, {});

                  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                  const lastMonthNatures = dataList
                    .filter(item => {
                      const d = new Date(item.date);
                      return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
                    })
                    .reduce((acc, curr) => {
                      acc[curr.nature] = (acc[curr.nature] || 0) + 1;
                    }, {});

                  return Object.entries(thisMonthNatures).map(([name, count]) => {
                    const prevCount = lastMonthNatures[name] || 0;
                    const diff = count - prevCount;
                    return (
                      <tr key={name} className="group hover:bg-slate-50 transition-colors">
                        <td className="py-4 text-sm font-medium text-slate-700">{name}</td>
                        <td className="py-4 text-sm font-semibold text-slate-900 text-right tabular-nums">{count}</td>
                        <td className="py-4 text-right">
                          <span className="text-xs font-medium text-slate-500 tabular-nums">
                            {diff >= 0 ? '+' : ''}{diff}
                          </span>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
