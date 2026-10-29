// PanelUI Web style (structure/style inspiration only — no PanelUI code
// copied here). PanelUI (panelui.dev) is MIT-licensed. Only its Web
// library (React + Tailwind CSS 4, Frame / Tabs presentation) is used
// as inspiration here; the native App library is not compatible with
// this web app and is not used. The Frame and Tabs below are built
// locally in .jsx, in the Taste framed-sheet theme (frame #EDF1F5,
// white sheet in light mode, navy #16294D), using only motion and
// lucide-react, which are already in package.json.
// Amicro Mono style (style inspiration only — no Amicro code copied here).
// Amicro (amicro.dev) is MIT-licensed; its Mono Charts use a single hue
// family, rounded shapes and lucide icons. These charts below are built
// locally as pure SVG in that same mono spirit, in the Hydraucan navy
// family, so they need no new dependency and stay compatible with the
// Taste framed-sheet shell (white sheet, #EDF1F5 frame, navy #16294D)
// and with the existing dark-theme CSS overrides in src/index.css.
import { useMemo, useState } from 'react';
import { motion as Motion } from 'motion/react';
import { getChartPalette } from '../lib/accent';
import { BarChart3, PieChart as PieChartIcon, TrendingUp, Activity, AlertTriangle, Wrench, Filter } from 'lucide-react';

// Chart palette follows the chosen theme accent (and light/dark mode).

// Rounded donut ring: one SVG circle per slice, drawn with stroke-dasharray.
const MonoDonut = ({ data, title, palette = ['#16294D', '#2E4A73', '#5B7AA0', '#8AA0BC', '#C2D0E0'] }) => {
  const MONO = palette;
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const segments = data.map((d, i) => {
    const fraction = total > 0 ? d.value / total : 0;
    const length = data.length === 1 ? circumference : Math.max(0, fraction * circumference - 2);
    const segment = { ...d, length, offset, color: MONO[i % MONO.length] };
    offset += fraction * circumference;
    return segment;
  });
  return (
    <div>
      <svg viewBox="0 0 200 200" className="mx-auto w-full max-w-[240px]" role="img" aria-label={title}>
        {segments.map((s, i) => (
          <circle
            key={i}
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={s.color}
            strokeWidth="26"
            strokeDasharray={`${s.length} ${circumference - s.length}`}
            strokeDashoffset={-s.offset}
            transform="rotate(-90 100 100)"
          >
            <title>{`${s.name}: ${s.value} (${total > 0 ? ((s.value / total) * 100).toFixed(0) : 0}%)`}</title>
          </circle>
        ))}
        <text x="100" y="98" textAnchor="middle" className="text-2xl font-bold fill-current text-slate-900">{total}</text>
        <text x="100" y="118" textAnchor="middle" className="text-[11px] fill-current text-slate-500">au total</text>
      </svg>
      <ul className="mt-4 space-y-2">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2 text-sm">
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: MONO[i % MONO.length] }} />
            <span className="flex-1 text-slate-300">{d.name}</span>
            <span className="font-bold text-white tabular-nums">{d.value}</span>
            <span className="w-10 text-right text-slate-400 tabular-nums">
              {total > 0 ? `${((d.value / total) * 100).toFixed(0)}%` : '0%'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Rounded pill pillars: horizontal bars, darkest navy for the largest value.
const MonoPillars = ({ data, title, palette = ['#16294D', '#2E4A73', '#5B7AA0', '#8AA0BC', '#C2D0E0'] }) => {
  const MONO = palette;
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <ul className="space-y-3" role="img" aria-label={title}>
      {data.map((d, i) => (
        <li key={d.name} className="grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-3">
          <span className="truncate text-sm text-slate-300" title={d.name}>{d.name}</span>
          <span className="h-3.5 overflow-hidden rounded-full bg-slate-200/70">
            <span
              className="block h-full rounded-full"
              style={{ width: `${(d.value / max) * 100}%`, backgroundColor: MONO[Math.min(i, MONO.length - 1)] }}
            />
          </span>
          <span className="w-12 text-right text-sm font-bold text-white tabular-nums">{d.value}</span>
        </li>
      ))}
    </ul>
  );
};

// Mono area / sparkline for the 12-month evolution, pure SVG.
const MonoArea = ({ data, title, palette = ['#16294D', '#2E4A73', '#5B7AA0', '#8AA0BC', '#C2D0E0'] }) => {
  const width = 720;
  const height = 280;
  const padLeft = 36;
  const padRight = 12;
  const padTop = 16;
  const padBottom = 28;
  const max = Math.max(...data.map((d) => d.count), 1);
  const x = (i) => padLeft + (data.length > 1 ? (i * (width - padLeft - padRight)) / (data.length - 1) : 0);
  const y = (v) => padTop + (1 - v / max) * (height - padTop - padBottom);
  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d.count)}`).join(' ');
  const areaPath = `${linePath} L ${x(data.length - 1)} ${height - padBottom} L ${x(0)} ${height - padBottom} Z`;
  const gridValues = [0, Math.round(max / 2), max];
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" role="img" aria-label={title}>
      <defs>
        <linearGradient id="monoAreaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={palette[2]} stopOpacity={0.3} />
          <stop offset="95%" stopColor={palette[2]} stopOpacity={0} />
        </linearGradient>
      </defs>
      {gridValues.map((v) => (
        <g key={v}>
          <line x1={padLeft} x2={width - padRight} y1={y(v)} y2={y(v)} stroke="#E2E8F0" strokeDasharray="3 3" />
          <text x={padLeft - 6} y={y(v) + 4} textAnchor="end" fontSize="11" className="fill-current text-slate-400">{v}</text>
        </g>
      ))}
      <path d={areaPath} fill="url(#monoAreaFill)" />
      <path d={linePath} fill="none" stroke={palette[1]} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => (
        <g key={d.label}>
          <circle cx={x(i)} cy={y(d.count)} r="4" fill={palette[2]} stroke="#ffffff" strokeWidth="1.5">
            <title>{`${d.label}: ${d.count}`}</title>
          </circle>
          <text x={x(i)} y={y(d.count) - 10} textAnchor="middle" fontSize="11" className="fill-current text-slate-500">{d.count}</text>
          <text x={x(i)} y={height - 8} textAnchor="middle" fontSize="11" className="fill-current text-slate-400">{d.label}</text>
        </g>
      ))}
    </svg>
  );
};

// PanelUI-Web-style Frame panel: titled header, 1px border, white
// surface in light mode (via the existing light-theme overrides for
// bg-slate-900/40 in src/index.css), consistent padding, mono navy icon.
// Presentation only — it never touches the chart data it wraps.
// Transitions Batch 3 (copy only): panel reveal, in the
// transitions.dev "panel reveal" style — rebuilt locally with
// motion. Each statistics panel fades and rises in, staggered by
// its delay, when the view mounts. Presentation only; the chart
// data inside each panel is unchanged.
const PanelFrame = ({ icon: Icon, title, children, footer, delay = 0 }) => (
  <Motion.section
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay, ease: 'easeOut' }}
    className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-line p-4 sm:p-6 lg:p-8 shadow-lg"
  >
    <header className="mb-6 flex items-center gap-2">
      <Icon className="w-5 h-5 text-[#5B7AA0]" />
      <h2 className="text-sm font-bold uppercase tracking-widest text-white">{title}</h2>
    </header>
    {children}
    {footer ? (
      <footer className="mt-6 border-t border-line pt-4 text-xs text-slate-400 tabular-nums">{footer}</footer>
    ) : null}
  </Motion.section>
);

// VibePrompt Batch 4 (copy only): empty state, in the VibePrompt
// Bonus "empty state" style — icon, title, hint — rebuilt locally.
// Used wherever a chart panel genuinely has no data for the
// selected filter; it never invents data, it only presents the
// empty case more clearly than a bare sentence.
const EmptyState = ({ hint = 'Aucune donnée pour le filtre sélectionné.' }) => (
  <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
    <BarChart3 className="w-8 h-8 text-slate-400" strokeWidth={1.5} />
    <p className="text-sm font-medium text-slate-300">Aucune donnée disponible</p>
    <p className="text-xs text-slate-400">{hint}</p>
  </div>
);

// PanelUI-Web-style Tabs: one segmented control, not separate pills.
// Active tab is navy with a motion animated indicator (layoutId);
// inactive tabs are slate. Same options and same onChange behaviour
// as the previous month pills — only the presentation changes.
const PanelTabs = ({ options, value, onChange, label }) => (
  <div
    role="tablist"
    aria-label={label}
    className="flex gap-1 overflow-x-auto rounded-full border border-line bg-white/5 p-1 pb-1 scrollbar-hide max-w-full sm:max-w-xl"
  >
    {options.map((option) => {
      const active = option === value;
      return (
        <button
          key={option}
          role="tab"
          aria-selected={active}
          onClick={() => onChange(option)}
          className={`relative shrink-0 rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
            active ? 'text-white' : 'text-slate-400 hover:text-slate-900'
          }`}
        >
          {active && (
            <Motion.span
              layoutId="statistics-month-tab"
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              className="absolute inset-0 rounded-full bg-[#2E4A73] shadow-lg"
            />
          )}
          <span className="relative">{option}</span>
        </button>
      );
    })}
  </div>
);

export const StatisticsView = ({ dataList, theme = 'light', accent = 'navy' }) => {
  const MONO = getChartPalette(accent, theme);
  // 1. Évolution Mensuelle (Derniers 12 mois)
  const monthlyData = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: d.toLocaleString('fr-FR', { month: 'short', year: '2-digit' }),
        month: d.getMonth(),
        year: d.getFullYear(),
        count: 0
      });
    }

    dataList.forEach(item => {
      const d = new Date(item.date);
      const target = months.find(m => m.month === d.getMonth() && m.year === d.getFullYear());
      if (target) target.count++;
    });

    return months;
  }, [dataList]);

  const months = useMemo(() => {
    return ['Tous', ...new Set(dataList.map(item => new Date(item.date).toLocaleString('fr-FR', { month: 'long', year: 'numeric' })))];
  }, [dataList]);

  const [selectedMonth, setSelectedMonth] = useState('Tous');

  const filteredData = useMemo(() => {
    if (selectedMonth === 'Tous') return dataList;
    return dataList.filter(item =>
      new Date(item.date).toLocaleString('fr-FR', { month: 'long', year: 'numeric' }) === selectedMonth
    );
  }, [dataList, selectedMonth]);

  // 2. Répartition par Type
  const typeData = useMemo(() => {
    const counts = filteredData.reduce((acc, curr) => {
      const type = curr.type ? curr.type.toUpperCase() : 'INCONNU';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredData]);

  // 3. Matériaux de Conduites (Fuites)
  const pipeMaterials = useMemo(() => {
    let ac = 0, fg = 0, fd = 0, pe = 0, pvc = 0;
    filteredData.forEach(item => {
      if (item.mat_ac) ac++;
      if (item.mat_fg) fg++;
      if (item.mat_fd) fd++;
      if (item.mat_pe) pe++;
      if (item.mat_pvc) pvc++;
    });
    return [
      { name: 'Fonte Grise', value: fg },
      { name: 'Fonte Ductile', value: fd },
      { name: 'Amiante Ciment', value: ac },
      { name: 'PE/PEHD', value: pe },
      { name: 'PVC', value: pvc }
    ].filter(m => m.value > 0).sort((a, b) => b.value - a.value);
  }, [filteredData]);

  // 4. Matériels Consommés
  const consumedMaterials = useMemo(() => {
    const counts = {};
    filteredData.forEach(item => {
      if (item.materialsData && item.materialsData.items) {
         item.materialsData.items.forEach(mat => {
            if (mat.article) {
               const qty = parseFloat(mat.qty) || 1;
               const unit = ['Tuyau', 'tuyau'].includes(mat.article) ? 'ml' : 'u';
               const key = `${mat.article} (${unit})`;
               counts[key] = (counts[key] || 0) + qty;
            }
         });
      }
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 consumed materials
  }, [filteredData]);

  // 5. Répartition par Débit
  const debitData = useMemo(() => {
    let faible = 0, moyen = 0, fort = 0;
    filteredData.forEach(item => {
      if (item.debit_fai) faible++;
      if (item.debit_moy) moyen++;
      if (item.debit_for) fort++;
    });
    return [
      { name: 'Faible', value: faible },
      { name: 'Moyen', value: moyen },
      { name: 'Fort', value: fort }
    ].filter(d => d.value > 0);
  }, [filteredData]);

  return (
    <Motion.div
      key="statistics"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-8"
    >
      <header className="mb-4">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">Toutes les Statistiques</h1>
        <p className="text-slate-400 text-sm font-medium">Analyse approfondie et historique global des interventions.</p>
      </header>

      {/* Filters */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Filtrer par Mois</h2>
        </div>
        <PanelTabs options={months} value={selectedMonth} onChange={setSelectedMonth} label="Filtrer par Mois" />
      </div>

      {/* Row 1: Area Chart (Full Width) — VibePrompt Batch 3: chart
          card legend footer, built from the same monthly totals. */}
      <PanelFrame icon={TrendingUp} title="Évolution des interventions (12 Mois)" delay={0} footer={`Total sur 12 mois : ${monthlyData.reduce((s, m) => s + m.count, 0)} interventions`}>
        <div className="h-[350px]">
          <MonoArea data={monthlyData} palette={MONO} title="Évolution des interventions (12 Mois)" />
        </div>
      </PanelFrame>

      {/* Row 2: Type Pie Chart & Pipe Materials Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Type Distribution */}
        <PanelFrame icon={PieChartIcon} title="Répartition par Type" delay={0.05} footer={`Total : ${typeData.reduce((s, d) => s + d.value, 0)} interventions`}>
          <div>
            {typeData.length > 0 ? (
              <MonoDonut data={typeData} palette={MONO} title="Répartition par Type" />
            ) : (
              <EmptyState />
            )}
          </div>
        </PanelFrame>

        {/* Pipe Materials */}
        <PanelFrame icon={BarChart3} title="Matériaux des Conduites (Fuites)" delay={0.1} footer={`Total : ${pipeMaterials.reduce((s, d) => s + d.value, 0)} fuites`}>
          <div>
             {pipeMaterials.length > 0 ? (
                <MonoPillars data={pipeMaterials} palette={MONO} title="Matériaux des Conduites (Fuites)" />
             ) : (
                <EmptyState />
             )}
          </div>
        </PanelFrame>
      </div>

      {/* Row 3: Origins & Flow Rates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Consumed Materials */}
        <PanelFrame icon={Wrench} title="Matériels Consommés" delay={0.15} footer={`${consumedMaterials.length} matériaux affichés (top 8)`}>
          <div>
             {consumedMaterials.length > 0 ? (
                <MonoPillars data={consumedMaterials} palette={MONO} title="Matériels Consommés" />
             ) : (
                <EmptyState />
             )}
          </div>
        </PanelFrame>

        {/* Flow Rates (Débit) */}
        <PanelFrame icon={Activity} title="Répartition par Débit" delay={0.2} footer={`Total : ${debitData.reduce((s, d) => s + d.value, 0)} interventions`}>
          <div>
             {debitData.length > 0 ? (
                <MonoDonut data={debitData} palette={MONO} title="Répartition par Débit" />
             ) : (
                <EmptyState />
             )}
          </div>
        </PanelFrame>
      </div>
    </Motion.div>
  );
};
