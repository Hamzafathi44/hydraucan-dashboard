import { useState, useEffect, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { db, auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, setDoc, getDoc } from "firebase/firestore";
import { LoginForm } from './components/LoginForm';
import { DashboardPreview } from './components/DashboardPreview';
import { motion as Motion, AnimatePresence } from 'motion/react';
import { 
  Trash2, Download, Plus, FileText, Calendar as CalendarIcon, 
  Filter, Search, LayoutDashboard, Settings, LogOut, 
  TrendingUp, CheckCircle2, AlertCircle, Clock,
  ChevronLeft, ChevronRight, PlusCircle, BarChart3, PieChart as PieChartIcon, Activity, Menu, X
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Toaster, toast } from 'sonner';

// Helper to convert images to Base64
const toBase64 = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });
};

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dataList, setDataList] = useState([]);
  const [formData, setFormData] = useState({ 
    date: '', reference: '', type: '', material: '', nature: '' 
  });
  const [selectedMonth, setSelectedMonth] = useState('Tous');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeView, setActiveView] = useState('home'); // 'home', 'rapport', 'database', 'settings'
  const [typeOptions, setTypeOptions] = useState(['RNVL', 'Fuite', 'FUITE SPECIALE']);
  const [natureOptions, setNatureOptions] = useState(['faience', 'revsol', 'beton', 'C.D', 'T.N', 'lamozik']);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Load options from Firestore
    const loadOptions = async () => {
      const docRef = doc(db, "appSettings", "options");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.typeOptions) setTypeOptions(data.typeOptions);
        if (data.natureOptions) setNatureOptions(data.natureOptions);
      }
    };
    loadOptions();
  }, []);

  const saveOptions = async (newTypeOptions, newNatureOptions) => {
    try {
      await setDoc(doc(db, "appSettings", "options"), {
        typeOptions: newTypeOptions || typeOptions,
        natureOptions: newNatureOptions || natureOptions
      });
    } catch (err) {
      console.error("Error saving options:", err);
    }
  };

  const handleAddOption = (category) => {
    const newOption = prompt(`Entrez une nouvelle option pour ${category === 'type' ? 'le Type' : 'la Nature'}:`);
    if (newOption && newOption.trim()) {
      if (category === 'type') {
        const updated = [...typeOptions, newOption.trim()];
        setTypeOptions(updated);
        saveOptions(updated, natureOptions);
      } else {
        const updated = [...natureOptions, newOption.trim()];
        setNatureOptions(updated);
        saveOptions(typeOptions, updated);
      }
      toast.success(`Option "${newOption}" ajoutée à ${category}`);
    }
  };

  const handleRemoveOption = (category, optToRemove) => {
    if (category === 'type') {
      const updated = typeOptions.filter(o => o !== optToRemove);
      setTypeOptions(updated);
      saveOptions(updated, natureOptions);
    } else {
      const updated = natureOptions.filter(o => o !== optToRemove);
      setNatureOptions(updated);
      saveOptions(typeOptions, updated);
    }
    toast.success(`Option "${optToRemove}" supprimée de ${category}`);
  };

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "workReports"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reports = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setDataList(reports);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, searchTerm]);

  const filteredList = useMemo(() => {
    let list = dataList;
    
    if (selectedMonth !== 'Tous') {
      list = list.filter(item => 
        new Date(item.date).toLocaleString('fr-FR', { month: 'long', year: 'numeric' }) === selectedMonth
      );
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(item => 
        item.reference?.toLowerCase().includes(term) ||
        item.type?.toLowerCase().includes(term) ||
        item.nature?.toLowerCase().includes(term)
      );
    }

    return list;
  }, [dataList, selectedMonth, searchTerm]);

  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredList.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredList, currentPage]);

  const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE);

  const stats = useMemo(() => {
    const total = dataList.length;
    
    // Normalize string: remove accents and convert to uppercase
    const normalize = (str) => {
      if (!str) return '';
      return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    };
    
    const getCount = (type) => {
      const target = normalize(type);
      return dataList.filter(i => normalize(i.type) === target).length;
    };
    
    const totalRNVL = getCount('RNVL');
    const totalFUITE = getCount('FUITE');
    const totalFUITESP = getCount('FUITE SPECIALE');

    const thisMonthData = dataList.filter(item => {
      const date = new Date(item.date);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });

    const getMonthCount = (type) => {
      const target = normalize(type);
      return thisMonthData.filter(i => normalize(i.type) === target).length;
    };

    const thisMonth = thisMonthData.length;
    const monthRNVL = getMonthCount('RNVL');
    const monthFUITE = getMonthCount('FUITE');
    const monthFUITESP = getMonthCount('FUITE SPECIALE');

    const lastEntry = dataList[0]?.date || 'N/A';
    
    return [
      { 
        label: 'Total des Rapports', 
        value: total, 
        icon: FileText, 
        color: 'text-blue-600',
        breakdown: { RNVL: totalRNVL, FUITE: totalFUITE, 'F. SP': totalFUITESP }
      },
      { 
        label: 'Ce Mois', 
        value: thisMonth, 
        icon: TrendingUp, 
        color: 'text-accent',
        breakdown: { RNVL: monthRNVL, FUITE: monthFUITE, 'F. SP': monthFUITESP }
      },
      { label: 'Dernière Entrée', value: lastEntry, icon: Clock, color: 'text-slate-400' },
    ];
  }, [dataList]);

  const chartData = useMemo(() => {
    const natureMap = dataList.reduce((acc, curr) => {
      acc[curr.nature] = (acc[curr.nature] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(natureMap).map(([name, value]) => ({ name, value }));
  }, [dataList]);

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value });

  const handleAdd = async (e) => {
    e.preventDefault();
    if(!formData.date) {
      toast.error("Veuillez sélectionner une date");
      return;
    }
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "workReports"), formData);
      setFormData({ date: '', reference: '', type: '', material: '', nature: '' });
      toast.success("Rapport ajouté avec succès");
    } catch (e) { 
      console.error("Error: ", e); 
      toast.error("Échec de l'ajout du rapport");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "workReports", id));
      toast.success("Rapport supprimé");
    } catch (e) {
      console.error("Delete error:", e);
      toast.error("Échec de la suppression");
    }
  };

  const generatePDF = async () => {
    const doc = new jsPDF();
    const loadingToast = toast.loading("Génération du PDF...");
    
    try {
      const logoData = await toBase64('/logo-hydracane.png');
      doc.addImage(logoData, 'PNG', 15, 10, 45, 15); 
    } catch {
      console.warn("Logo non trouvé");
    }

    const title = selectedMonth === 'Tous' ? "Rapport Mensuel - Global" : `Rapport Mensuel - ${selectedMonth}`;
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(title, 105, 25, { align: 'center' });

    const bodyData = filteredList.map(item => [
      item.date, 
      item.reference, 
      item.type, 
      item.material, 
      item.nature
    ]);

    autoTable(doc, {
      head: [["DATE", "Références", "Type", "Matériel Utilisé", "Nature"]],
      body: bodyData,
      startY: 40,
      theme: 'grid',
      didParseCell: function(data) {
        if (data.column.index === 0 && data.cell.section === 'body') {
          const rowIndex = data.row.index;
          const currentDate = data.cell.raw;
          let rowSpan = 1;
          for (let i = rowIndex + 1; i < data.table.body.length; i++) {
            if (data.table.body[i].cells[0].raw === currentDate) { rowSpan++; } else { break; }
          }
          if (rowSpan > 1) { data.cell.rowSpan = rowSpan; }
          if (rowIndex > 0 && data.table.body[rowIndex - 1].cells[0].raw === currentDate) { data.cell.text = ['']; }
        }
      },
      styles: { valign: 'middle', halign: 'center', fontSize: 10 }
    });
    
    doc.save(`${title}.pdf`);
    toast.dismiss(loadingToast);
    toast.success("PDF exporté avec succès");
  };

  const months = ['Tous', ...new Set(dataList.map(item => new Date(item.date).toLocaleString('fr-FR', { month: 'long', year: 'numeric' })))];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-[#1A2B56]/30 border-t-[#1A2B56] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 lg:p-12" style={{ backgroundImage: "radial-gradient(circle at 50% 50%, #1A2B56 0%, #050505 100%)", backgroundColor: "#0F0F0F" }}>
        <Toaster position="top-right" richColors />
        <div className="uisocial-card w-full max-w-7xl flex flex-col md:flex-row min-h-[800px]">
          <div className="w-full md:w-[45%] lg:w-[42%] relative flex items-stretch">
            <DashboardPreview />
          </div>
          <div className="flex-1 bg-white flex items-center justify-center h-full">
            <LoginForm />
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="dashboard-layout relative">
      <Toaster position="top-right" richColors />

      {/* Mobile Menu Toggle */}
      <button 
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-6 right-6 z-30 p-2.5 bg-white border border-line shadow-sm text-ink rounded-xl"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 z-40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-between px-2 mb-4">
          <img src="/logo-hydracane.png" alt="HYDRAUCAN" className="h-16 w-auto object-contain" referrerPolicy="no-referrer" />
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-slate-700 bg-slate-50 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => { setActiveView('home'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeView === 'home' ? 'bg-accent/10 text-ink' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            TABLEAU DE BORD
          </button>
          <button 
            onClick={() => { setActiveView('rapport'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeView === 'rapport' ? 'bg-accent/10 text-ink' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
          >
            <FileText className="w-5 h-5" />
            RAPPORT MENSUEL
          </button>
          <button 
            onClick={() => { setActiveView('database'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeView === 'database' ? 'bg-accent/10 text-ink' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
          >
            <TrendingUp className="w-5 h-5" />
            Base de données
          </button>
          <button 
            onClick={() => { setActiveView('settings'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeView === 'settings' ? 'bg-accent/10 text-ink' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
          >
            <Settings className="w-5 h-5" />
            Paramètres
          </button>
        </nav>

        <div className="pt-6 border-t border-line">
          <button onClick={() => signOut(auth)} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl font-bold text-sm transition-all">
            <LogOut className="w-5 h-5" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <AnimatePresence mode="wait">
          {activeView === 'home' ? (
            <Motion.div
              key="home"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <header className="mb-8">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2">Tableau de Bord Analytique</h1>
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
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900">{stat.value}</span>
                    </div>
                  </Motion.div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Work Schedule Chart */}
                <div className="bg-white rounded-2xl border border-line p-8 shadow-sm">
                  <div className="flex items-center gap-2 mb-6">
                    <CalendarIcon className="w-4 h-4 text-accent" />
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900">Calendrier de Travail (Mois en cours)</h2>
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
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="day" fontSize={10} axisLine={false} tickLine={false} />
                        <YAxis fontSize={10} axisLine={false} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          cursor={{ fill: '#f8fafc' }}
                        />
                        <Bar dataKey="count" fill="#F27D26" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Nature Distribution Chart */}
                <div className="bg-white rounded-2xl border border-line p-8 shadow-sm">
                  <div className="flex items-center gap-2 mb-6">
                    <PieChartIcon className="w-4 h-4 text-accent" />
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900">Répartition par Nature</h2>
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
                            <Cell key={`cell-${index}`} fill={['#F27D26', '#141414', '#94a3b8', '#3b82f6', '#10b981', '#f59e0b'][index % 6]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Material Consumption */}
                <div className="lg:col-span-1 bg-white rounded-2xl border border-line p-8 shadow-sm">
                  <div className="flex items-center gap-2 mb-6">
                    <Activity className="w-4 h-4 text-accent" />
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900">Consommation de Matériel</h2>
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
                        <div key={name} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-line">
                          <span className="text-sm font-medium text-slate-700">{name}</span>
                          <span className="px-2 py-1 bg-white rounded-lg text-[10px] font-bold text-accent border border-line">{count} fois</span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Nature Summary Table */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-line p-8 shadow-sm">
                  <div className="flex items-center gap-2 mb-6">
                    <BarChart3 className="w-4 h-4 text-accent" />
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900">Résumé des Travaux par Nature</h2>
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
                              <tr key={name} className="group hover:bg-slate-50/50 transition-colors">
                                <td className="py-4 text-sm font-medium text-slate-700">{name}</td>
                                <td className="py-4 text-sm font-black text-slate-900 text-center">{count}</td>
                                <td className="py-4 text-right">
                                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${diff >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
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
          ) : activeView === 'settings' ? (
            <Motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto"
            >
              <header className="mb-12">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2">Paramètres de l'Application</h1>
                <p className="text-slate-400 text-sm font-medium">Gérez vos options de menu déroulant et vos préférences système.</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Type Options */}
                <div className="bg-white rounded-2xl border border-line p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <PlusCircle className="w-4 h-4 text-accent" />
                      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900">Options de Type</h2>
                    </div>
                    <button onClick={() => handleAddOption('type')} className="text-[10px] font-bold uppercase tracking-widest text-accent hover:text-ink">Ajouter</button>
                  </div>
                  <div className="space-y-2">
                    {typeOptions.map(opt => (
                      <div key={opt} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-line group">
                        <span className="text-sm font-medium text-slate-700">{opt}</span>
                        <button onClick={() => handleRemoveOption('type', opt)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Nature Options */}
                <div className="bg-white rounded-2xl border border-line p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <PlusCircle className="w-4 h-4 text-accent" />
                      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900">Options de Nature</h2>
                    </div>
                    <button onClick={() => handleAddOption('nature')} className="text-[10px] font-bold uppercase tracking-widest text-accent hover:text-ink">Ajouter</button>
                  </div>
                  <div className="space-y-2">
                    {natureOptions.map(opt => (
                      <div key={opt} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-line group">
                        <span className="text-sm font-medium text-slate-700">{opt}</span>
                        <button onClick={() => handleRemoveOption('nature', opt)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Motion.div>
          ) : activeView === 'database' ? (
            <Motion.div
              key="database"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2">Base de données complète</h1>
                  <p className="text-slate-400 text-sm font-medium">Consultez l'historique complet de tous les travaux enregistrés.</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="search-bar">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Rechercher dans la base..." 
                      className="bg-transparent border-none outline-none text-sm w-full"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </header>

              <div className="bg-white rounded-2xl border border-line overflow-hidden shadow-sm">
                <div className="data-row bg-slate-50/50 border-b-2 border-line">
                  <div className="col-header">Date</div>
                  <div className="col-header">Références</div>
                  <div className="col-header">Type</div>
                  <div className="col-header">Matériel</div>
                  <div className="col-header">Nature</div>
                  <div className="col-header text-right">Action</div>
                </div>
                <div className="data-grid min-h-[600px]">
                  <AnimatePresence mode="popLayout">
                    {paginatedList.map((item) => (
                      <Motion.div 
                        key={item.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="data-row group"
                      >
                        <div className="data-value data-mono flex items-center gap-2">
                          <CalendarIcon className="w-3 h-3 text-slate-300" />
                          {item.date}
                        </div>
                        <div className="data-value truncate pr-4">{item.reference || '-'}</div>
                        <div className="data-value truncate pr-4">{item.type || '-'}</div>
                        <div className="data-value truncate pr-4">{item.material || '-'}</div>
                        <div className="data-value truncate pr-4">{item.nature || '-'}</div>
                        <div className="flex justify-end">
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </Motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* Pagination Controls for Database View */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-6">
                  <p className="text-xs font-medium text-slate-400">
                    Affichage de <span className="text-slate-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> à <span className="text-slate-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredList.length)}</span> sur <span className="text-slate-900">{filteredList.length}</span> résultats
                  </p>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-2 border border-line rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-1">
                      {[...Array(totalPages)].map((_, i) => {
                        const page = i + 1;
                        if (totalPages > 7) {
                          if (page !== 1 && page !== totalPages && Math.abs(page - currentPage) > 1) {
                            if (page === 2 || page === totalPages - 1) return <span key={page} className="text-slate-300">...</span>;
                            return null;
                          }
                        }
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-8 h-8 text-xs font-bold rounded-lg transition-all ${currentPage === page ? 'bg-ink text-white' : 'hover:bg-slate-50 text-slate-400'}`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-2 border border-line rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </Motion.div>
          ) : (
            <Motion.div
              key="rapport"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Top Header */}
              <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2">RAPPORT MENSUEL</h1>
                  <p className="text-slate-400 text-sm font-medium">Gérez et exportez vos rapports de travail mensuels avec précision.</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="search-bar">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Rechercher des rapports..." 
                      className="bg-transparent border-none outline-none text-sm w-full"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button onClick={generatePDF} disabled={filteredList.length === 0} className="btn-accent">
                    <Download className="w-4 h-4" />
                    Exporter
                  </button>
                </div>
              </header>

              {/* Stats & Charts Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {stats.map((stat, i) => (
                    <Motion.div 
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="stat-card"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{stat.label}</span>
                        <stat.icon className={`w-5 h-5 ${stat.color}`} />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900">{stat.value}</span>
                        {stat.subValue && <span className="text-[10px] font-bold text-slate-400">{stat.subValue}</span>}
                      </div>
                      {stat.breakdown && (
                        <div className="mt-3 pt-3 border-t border-line grid grid-cols-3 gap-2">
                          {Object.entries(stat.breakdown).map(([key, val]) => (
                            <div key={key} className="text-center">
                              <p className="text-[8px] font-bold text-slate-400 uppercase mb-0.5">{key}</p>
                              <p className="text-xs font-black text-slate-700">{val}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </Motion.div>
                  ))}
                </div>

                {/* Nature Stats Chart */}
                <div className="bg-white rounded-2xl border border-line p-6 shadow-sm flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <PieChartIcon className="w-4 h-4 text-accent" />
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900">Distribution par Nature</h2>
                  </div>
                  <div className="flex-1 h-[150px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={55}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#F27D26', '#141414', '#94a3b8', '#3b82f6', '#10b981', '#f59e0b'][index % 6]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Entry Form */}
              <Motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-line p-8 mb-12 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-6">
                  <Plus className="w-4 h-4 text-accent" />
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900">Créer un Nouveau Rapport</h2>
                </div>
                
                <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Date</label>
                    <input name="date" type="date" required onChange={handleChange} value={formData.date} className="input-field" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Référence</label>
                    <input name="reference" placeholder="Réf #" onChange={handleChange} value={formData.reference} className="input-field" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Type</label>
                      <button type="button" onClick={() => handleAddOption('type')} className="text-accent hover:text-ink">
                        <PlusCircle className="w-3 h-3" />
                      </button>
                    </div>
                    <select name="type" onChange={handleChange} value={formData.type} className="input-field appearance-none">
                      <option value="">Sélectionner le Type</option>
                      {typeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Matériel</label>
                    <input name="material" placeholder="Matériels" onChange={handleChange} value={formData.material} className="input-field" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nature</label>
                      <button type="button" onClick={() => handleAddOption('nature')} className="text-accent hover:text-ink">
                        <PlusCircle className="w-3 h-3" />
                      </button>
                    </div>
                    <select name="nature" onChange={handleChange} value={formData.nature} className="input-field appearance-none">
                      <option value="">Sélectionner la Nature</option>
                      {natureOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <button type="submit" disabled={isSubmitting} className="btn-primary">
                    {isSubmitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
                    Ajouter
                  </button>
                </form>
              </Motion.section>

              {/* Filters & Table */}
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Filtrer les Enregistrements</h2>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide max-w-md">
                    {months.map(m => (
                      <button 
                        key={m} 
                        onClick={() => setSelectedMonth(m)} 
                        className={`month-pill whitespace-nowrap ${selectedMonth === m ? 'month-pill-active' : ''}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-line overflow-hidden shadow-sm">
                  <div className="data-row bg-slate-50/50 border-b-2 border-line">
                    <div className="col-header">Date</div>
                    <div className="col-header">Références</div>
                    <div className="col-header">Type</div>
                    <div className="col-header">Matériel</div>
                    <div className="col-header">Nature</div>
                    <div className="col-header text-right">Action</div>
                  </div>
                  
                  <div className="data-grid min-h-[400px]">
                    <AnimatePresence mode="popLayout">
                      {paginatedList.length > 0 ? (
                        paginatedList.map((item) => (
                          <Motion.div 
                            key={item.id}
                            layout
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="data-row group"
                          >
                            <div className="data-value data-mono flex items-center gap-2">
                              <CalendarIcon className="w-3 h-3 text-slate-300" />
                              {item.date}
                            </div>
                            <div className="data-value truncate pr-4">{item.reference || '-'}</div>
                            <div className="data-value truncate pr-4">{item.type || '-'}</div>
                            <div className="data-value truncate pr-4">{item.material || '-'}</div>
                            <div className="data-value truncate pr-4">{item.nature || '-'}</div>
                            <div className="flex justify-end">
                              <button 
                                onClick={() => handleDelete(item.id)}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </Motion.div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center h-[400px] text-slate-300">
                          {searchTerm ? (
                            <>
                              <AlertCircle className="w-12 h-12 mb-4 opacity-10" />
                              <p className="text-sm font-medium">Aucun résultat pour "{searchTerm}"</p>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-12 h-12 mb-4 opacity-10" />
                              <p className="text-sm font-medium">Tout est à jour ! Aucun rapport pour cette période.</p>
                            </>
                          )}
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4">
                    <p className="text-xs font-medium text-slate-400">
                      Affichage de <span className="text-slate-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> à <span className="text-slate-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredList.length)}</span> sur <span className="text-slate-900">{filteredList.length}</span> résultats
                    </p>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-2 border border-line rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-1">
                        {[...Array(totalPages)].map((_, i) => {
                          const page = i + 1;
                          if (totalPages > 7) {
                            if (page !== 1 && page !== totalPages && Math.abs(page - currentPage) > 1) {
                              if (page === 2 || page === totalPages - 1) return <span key={page} className="text-slate-300">...</span>;
                              return null;
                            }
                          }
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`w-8 h-8 text-xs font-bold rounded-lg transition-all ${currentPage === page ? 'bg-ink text-white' : 'hover:bg-slate-50 text-slate-400'}`}
                            >
                              {page}
                            </button>
                          );
                        })}
                      </div>
                      <button 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="p-2 border border-line rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </Motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;