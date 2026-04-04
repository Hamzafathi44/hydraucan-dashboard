import { useMemo, useState } from 'react';
import { motion as Motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { BarChart3, PieChart as PieChartIcon, TrendingUp, Activity, AlertTriangle, Wrench, Filter } from 'lucide-react';

export const StatisticsView = ({ dataList }) => {
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

  const COLORS = ['#06b6d4', '#3b82f6', '#0ea5e9', '#6366f1', '#10b981', '#f59e0b'];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0A1020] border border-white/10 rounded-xl shadow-xl p-3">
          <p className="text-white font-medium text-sm mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs font-bold" style={{ color: entry.color || entry.fill }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Motion.div
      key="statistics"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <header className="mb-4">
        <h1 className="text-3xl font-black tracking-tight text-white mb-2">Toutes les Statistiques</h1>
        <p className="text-slate-400 text-sm font-medium">Analyse approfondie et historique global des interventions.</p>
      </header>
      
      {/* Filters */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Filtrer par Mois</h2>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide max-w-xl">
          {months.map(m => (
            <button 
              key={m} 
              onClick={() => setSelectedMonth(m)} 
              className={`px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                selectedMonth === m 
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' 
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-line'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Row 1: Area Chart (Full Width) */}
      <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-line p-8 shadow-lg">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-cyan-500" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-white">Évolution des interventions (12 Mois)</h2>
        </div>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" fontSize={11} axisLine={false} tickLine={false} stroke="#94a3b8" />
              <YAxis fontSize={11} axisLine={false} tickLine={false} stroke="#94a3b8" />
              <RechartsTooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" name="Interventions" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Type Pie Chart & Pipe Materials Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Type Distribution */}
        <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-line p-8 shadow-lg">
          <div className="flex items-center gap-2 mb-6">
            <PieChartIcon className="w-5 h-5 text-cyan-500" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">Répartition par Type</h2>
          </div>
          <div className="h-[300px]">
            {typeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.05)" />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-sm">Aucune donnée disponible</div>
            )}
          </div>
        </div>

        {/* Pipe Materials */}
        <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-line p-8 shadow-lg">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-cyan-500" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">Matériaux des Conduites (Fuites)</h2>
          </div>
          <div className="h-[300px]">
             {pipeMaterials.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pipeMaterials} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" fontSize={11} axisLine={false} tickLine={false} stroke="#94a3b8" />
                    <YAxis type="category" dataKey="name" fontSize={11} axisLine={false} tickLine={false} stroke="#94a3b8" width={100} />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                    <Bar dataKey="value" name="Occurrences" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
             ) : (
                <div className="flex items-center justify-center h-full text-slate-500 text-sm">Aucune donnée disponible</div>
             )}
          </div>
        </div>
      </div>

      {/* Row 3: Origins & Flow Rates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Consumed Materials */}
        <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-line p-8 shadow-lg">
          <div className="flex items-center gap-2 mb-6">
            <Wrench className="w-5 h-5 text-cyan-500" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">Matériels Consommés</h2>
          </div>
          <div className="h-[300px]">
             {consumedMaterials.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={consumedMaterials} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" fontSize={11} axisLine={false} tickLine={false} stroke="#94a3b8" />
                    <YAxis fontSize={11} axisLine={false} tickLine={false} stroke="#94a3b8" />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                    <Bar dataKey="value" name="Quantité" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40}>
                      {consumedMaterials.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
             ) : (
                <div className="flex items-center justify-center h-full text-slate-500 text-sm">Aucune donnée disponible</div>
             )}
          </div>
        </div>

        {/* Flow Rates (Débit) */}
        <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-line p-8 shadow-lg">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-cyan-500" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">Répartition par Débit</h2>
          </div>
          <div className="h-[300px]">
             {debitData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={debitData}
                      cx="50%"
                      cy="50%"
                      innerRadius={0}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {debitData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#38bdf8', '#2563eb', '#1e3a8a'][index % 3]} stroke="rgba(255,255,255,0.05)" />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
             ) : (
                <div className="flex items-center justify-center h-full text-slate-500 text-sm">Aucune donnée disponible</div>
             )}
          </div>
        </div>
      </div>
    </Motion.div>
  );
};
