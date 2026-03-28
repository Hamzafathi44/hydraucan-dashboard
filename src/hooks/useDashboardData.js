import { useState, useEffect, useMemo } from 'react';
import { db, auth } from '../firebase';
import { 
  collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, setDoc, getDoc, where, writeBatch, getDocs 
} from "firebase/firestore";
import { toast } from 'sonner';
import { FileText, TrendingUp, Clock } from 'lucide-react';

export const useDashboardData = (user) => {
  const [dataList, setDataList] = useState([]);
  const [formData, setFormData] = useState({ 
    date: '', reference: '', type: '', material: '', nature: '' 
  });
  const [selectedMonth, setSelectedMonth] = useState('Tous');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [typeOptions, setTypeOptions] = useState(['RNVL', 'Fuite', 'FUITE SPECIALE']);
  const [natureOptions, setNatureOptions] = useState(['faience', 'revsol', 'beton', 'C.D', 'T.N', 'lamozik']);
  
  const ITEMS_PER_PAGE = 20;

  // 1. Data Migration Script (runs once on load if needed)
  useEffect(() => {
    if (!user) return;
    
    const migrateOrphanedData = async () => {
      try {
        // Find documents that don't have a userId field
        // We can't do where("userId", "==", null) easily if the field doesn't exist,
        // so we'll fetch all reports for this script (since it's a small dataset)
        // and filter client-side to find orphaned ones.
        const q = query(collection(db, "workReports"));
        const snapshot = await getDocs(q);
        
        const batch = writeBatch(db);
        let count = 0;
        
        snapshot.forEach((document) => {
          const data = document.data();
          if (!data.userId) {
            batch.update(doc(db, "workReports", document.id), { userId: user.uid });
            count++;
          }
        });
        
        if (count > 0) {
          await batch.commit();
          toast.success(`${count} anciens rapports ont été assignés à votre compte.`);
        }
      } catch (err) {
        console.error("Migration error:", err);
      }
    };
    
    migrateOrphanedData();
  }, [user]);

  // 2. Load Settings (Options)
  useEffect(() => {
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

  // 3. Load Reports (Multi-Tenant)
  useEffect(() => {
    if (!user) return;
    
    // MULTI-TENANT QUERY: Only fetch documents where userId == current user
    const q = query(
      collection(db, "workReports"), 
      where("userId", "==", user.uid)
      // Note: If you add orderBy("date", "desc") here, Firestore will require a composite index.
      // To avoid forcing the user to build an index, we fetch and sort in JavaScript for now.
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let reports = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      // Client-side sort to avoid composite index requirements
      reports.sort((a, b) => new Date(b.date) - new Date(a.date));
      setDataList(reports);
    });
    
    return () => unsubscribe();
  }, [user]);

  // 4. Pagination & Filters
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

  // 5. Derived Stats
  const stats = useMemo(() => {
    const total = dataList.length;
    
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

  const months = ['Tous', ...new Set(dataList.map(item => new Date(item.date).toLocaleString('fr-FR', { month: 'long', year: 'numeric' })))];

  // 6. Action Handlers
  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value });

  const handleAdd = async (e) => {
    e.preventDefault();
    if(!formData.date) {
      toast.error("Veuillez sélectionner une date");
      return;
    }
    if (!user) {
      toast.error("Vous devez être connecté");
      return;
    }

    setIsSubmitting(true);
    try {
      // MULTI-TENANT: Automatically append userId to all new documents
      await addDoc(collection(db, "workReports"), {
        ...formData,
        userId: user.uid
      });
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

  return {
    // State
    dataList, formData, selectedMonth, searchTerm, isSubmitting, currentPage, 
    typeOptions, natureOptions,
    // Derived
    filteredList, paginatedList, totalPages, stats, chartData, months, ITEMS_PER_PAGE,
    // Setters
    setSelectedMonth, setSearchTerm, setCurrentPage,
    // Actions
    handleChange, handleAdd, handleDelete, handleAddOption, handleRemoveOption
  };
};
