import { motion as Motion } from 'motion/react';
import { Calendar as CalendarIcon, PieChart as PieChartIcon, Activity, BarChart3 } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

export const DashboardHome = ({ stats, dataList, chartData }) => {
  return (
    <Motion.div
      key="home"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <header className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-white mb-2">Tableau de Bord Analytique</h1>
        <p className="text-slate-400 text-sm font-medium">Analyse détaillée des performances et de la consommation du mois en cours.</p>
      </header>

      {/* Monthly Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="stat-card"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{stat.label}</span>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-black text-white">{stat.value}</span>
              {stat.breakdown && (
                <div className="flex items-center gap-3 mt-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  <span>RNVL: <span className="text-cyan-400">{stat.breakdown.RNVL || 0}</span></span>
                  <span>FUITE: <span className="text-cyan-400">{stat.breakdown.FUITE || 0}</span></span>
                  <span>F. SP: <span className="text-cyan-400">{stat.breakdown['F. SP'] || 0}</span></span>
                </div>
              )}
            </div>
          </Motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Work Schedule Chart */}
        <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-line p-8 shadow-lg">
          <div className="flex items-center gap-2 mb-6">
            <CalendarIcon className="w-4 h-4 text-cyan-500" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-white">Calendrier de Travail (Mois en cours)</h2>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(() => {
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
                return schedule;
              })()}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" fontSize={10} axisLine={false} tickLine={false} stroke="#94a3b8" />
                <YAxis fontSize={10} axisLine={false} tickLine={false} stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0A1020', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }}
                  itemStyle={{ color: '#fff' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Nature Distribution Chart */}
        <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-line p-8 shadow-lg">
          <div className="flex items-center gap-2 mb-6">
            <PieChartIcon className="w-4 h-4 text-cyan-500" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-white">Répartition par Nature</h2>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#06b6d4', '#3b82f6', '#0ea5e9', '#6366f1', '#10b981', '#f59e0b'][index % 6]} stroke="rgba(255,255,255,0.05)" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0A1020', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Material Consumption */}
        <div className="lg:col-span-1 bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-line p-8 shadow-lg">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-4 h-4 text-cyan-500" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-white">Consommation de Matériel</h2>
          </div>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
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
              
              if (sortedMats.length === 0) return <p className="text-slate-400 text-sm italic">Aucun matériel enregistré ce mois-ci.</p>;

              return sortedMats.map(([name, count]) => (
                <div key={name} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-sm font-medium text-slate-200">{name}</span>
                  <span className="px-2 py-1 bg-cyan-500/10 rounded-lg text-[10px] font-bold text-cyan-400 border border-cyan-500/20">{count} fois</span>
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Nature Summary Table */}
        <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-line p-8 shadow-lg">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-4 h-4 text-cyan-500" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-white">Résumé des Travaux par Nature</h2>
          </div>
          <div className="overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-line">
                  <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Nature du Travail</th>
                  <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Nombre</th>
                  <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Tendance</th>
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
                      return acc;
                    }, {});

                  return Object.entries(thisMonthNatures).map(([name, count]) => {
                    const prevCount = lastMonthNatures[name] || 0;
                    const diff = count - prevCount;
                    return (
                      <tr key={name} className="group hover:bg-slate-800/40 transition-colors">
                        <td className="py-4 text-sm font-medium text-slate-200">{name}</td>
                        <td className="py-4 text-sm font-black text-white text-center">{count}</td>
                        <td className="py-4 text-right">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${diff >= 0 ? 'bg-cyan-500/10 text-cyan-400' : 'bg-red-500/10 text-red-400'}`}>
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
    </Motion.div>
  );
};
