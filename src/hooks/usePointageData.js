import { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { 
  collection, addDoc, onSnapshot, query, where, updateDoc, doc, deleteDoc, writeBatch
} from "firebase/firestore";
import { toast } from 'sonner';

export const usePointageData = (user) => {
  const [workers, setWorkers] = useState([]);
  const [pointageList, setPointageList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('Tous');

  // 1. Fetch Workers
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "workers"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const w = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setWorkers(w.sort((a, b) => a.name.localeCompare(b.name)));
    });
    return () => unsubscribe();
  }, [user]);

  // 2. Fetch Pointages
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "pointages"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let records = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      records.sort((a, b) => new Date(b.checkIn || b.date).getTime() - new Date(a.checkIn || a.date).getTime());
      setPointageList(records);
    });
    return () => unsubscribe();
  }, [user]);

  // Derived: Find active sessions per worker
  const activeSessions = useMemo(() => {
    const sessions = {};
    pointageList.forEach(p => {
      if (!p.checkOut && !p.isManual) {
        if (!sessions[p.workerId]) {
          sessions[p.workerId] = p;
        }
      }
    });
    return sessions;
  }, [pointageList]);

  // 3. Worker Management
  const addWorker = async (name) => {
    if (!name.trim() || !user) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "workers"), {
        name: name.trim(),
        userId: user.uid,
        createdAt: new Date().toISOString()
      });
      toast.success("Ouvrier ajouté");
    } catch (e) {
      console.error(e);
      toast.error("Erreur d'ajout");
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeWorker = async (workerId) => {
    if (!window.confirm("Êtes-vous sûr ? Ses pointages seront conservés.")) return;
    try {
      await deleteDoc(doc(db, "workers", workerId));
      toast.success("Ouvrier supprimé");
    } catch (e) {
      console.error(e);
      toast.error("Erreur de suppression");
    }
  };

  // 4. Timer Handling (Check-in, Bulk, Pause, Resume, Stop)
  const handleCheckIn = async (worker) => {
    if (!user) return;
    if (activeSessions[worker.id]) {
      toast.warning(`${worker.name} est déjà en service !`);
      return;
    }
    setIsSubmitting(true);
    const now = new Date();
    try {
      await addDoc(collection(db, "pointages"), {
        userId: user.uid,
        workerId: worker.id,
        workerName: worker.name,
        date: now.toLocaleDateString('fr-FR'),
        checkIn: now.toISOString(),
        checkOut: null,
        totalHours: 0,
        accumulatedHours: 0,
        isPaused: false,
        lastUnpausedAt: now.toISOString(),
        isManual: false
      });
      toast.success(`Timer démarré pour ${worker.name}`);
    } catch (e) {
      console.error(e);
      toast.error("Erreur de pointage");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkCheckIn = async (workersArray) => {
    if (!user || workersArray.length === 0) return;
    setIsSubmitting(true);
    const now = new Date();
    
    try {
      const batch = writeBatch(db);
      let added = 0;

      workersArray.forEach(w => {
        if (!activeSessions[w.id]) {
          const docRef = doc(collection(db, "pointages"));
          batch.set(docRef, {
            userId: user.uid,
            workerId: w.id,
            workerName: w.name,
            date: now.toLocaleDateString('fr-FR'),
            checkIn: now.toISOString(),
            checkOut: null,
            totalHours: 0,
            accumulatedHours: 0,
            isPaused: false,
            lastUnpausedAt: now.toISOString(),
            isManual: false
          });
          added++;
        }
      });

      if (added > 0) {
        await batch.commit();
        toast.success(`Timer démarré pour ${added} ouvrier(s)`);
      } else {
        toast.info("Aucun nouveau timer à démarrer");
      }
    } catch (e) {
      console.error(e);
      toast.error("Erreur de lancement groupé");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePause = async (worker) => {
    const session = activeSessions[worker.id];
    if (!session || !user || session.isPaused) return;

    setIsSubmitting(true);
    const now = new Date();
    
    // Calculate hours from lastUnpausedAt up to NOW
    const unpausedAt = new Date(session.lastUnpausedAt || session.checkIn);
    const diffMs = now.getTime() - unpausedAt.getTime();
    const burstHours = diffMs / (1000 * 60 * 60);
    
    const newAccumulated = (session.accumulatedHours || 0) + burstHours;

    try {
      await updateDoc(doc(db, "pointages", session.id), {
        isPaused: true,
        accumulatedHours: newAccumulated,
        lastUnpausedAt: null 
      });
      toast.success(`${worker.name} est en pause`);
    } catch (e) {
      console.error(e);
      toast.error("Erreur de pause");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResume = async (worker) => {
    const session = activeSessions[worker.id];
    if (!session || !user || !session.isPaused) return;

    setIsSubmitting(true);
    const now = new Date();

    try {
      await updateDoc(doc(db, "pointages", session.id), {
        isPaused: false,
        lastUnpausedAt: now.toISOString()
      });
      toast.success(`Reprise du travail pour ${worker.name}`);
    } catch (e) {
      console.error(e);
      toast.error("Erreur de reprise");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckOut = async (worker) => {
    const session = activeSessions[worker.id];
    if (!session || !user) return;

    setIsSubmitting(true);
    const now = new Date();
    let finalAccumulated = session.accumulatedHours || 0;

    // If they were NOT paused, we need to add the final active burst of time
    if (!session.isPaused) {
      const unpausedAt = new Date(session.lastUnpausedAt || session.checkIn);
      const diffMs = now.getTime() - unpausedAt.getTime();
      const burstHours = diffMs / (1000 * 60 * 60);
      finalAccumulated += burstHours;
    }

    try {
      await updateDoc(doc(db, "pointages", session.id), {
        checkOut: now.toISOString(),
        totalHours: parseFloat(finalAccumulated.toFixed(2)),
        isPaused: false,
        lastUnpausedAt: null
      });
      toast.success(`Timer arrêté pour ${worker.name} (${finalAccumulated.toFixed(2)}h)`);
    } catch (e) {
      console.error(e);
      toast.error("Erreur de sortie");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Manual Log & Edits
  const handleAddManualLog = async (workerId, workerName, dateStr, hours) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "pointages"), {
        userId: user.uid,
        workerId,
        workerName,
        date: new Date(dateStr).toLocaleDateString('fr-FR'),
        checkIn: new Date(`${dateStr}T08:00:00`).toISOString(),
        checkOut: new Date(`${dateStr}T16:00:00`).toISOString(),
        totalHours: parseFloat(hours),
        isManual: true
      });
      toast.success("Heures manuelles ajoutées");
    } catch (e) {
      console.error(e);
      toast.error("Erreur d'ajout");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateHours = async (logId, newHours) => {
    try {
      await updateDoc(doc(db, "pointages", logId), {
        totalHours: parseFloat(newHours)
      });
      toast.success("Heures modifiées !");
    } catch(e) {
      toast.error("Erreur de modification");
    }
  };

  const handleDeleteLog = async (logId) => {
    if (!window.confirm("Supprimer cet enregistrement ?")) return;
    try {
      await deleteDoc(doc(db, "pointages", logId));
      toast.success("Enregistrement supprimé");
    } catch (e) {
      toast.error("Erreur de suppression");
    }
  };

  // 6. Pagination & Filtering
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  const months = ['Tous', ...new Set(pointageList.map(item => {
    const d = item.checkIn ? new Date(item.checkIn) : new Date();
    return d.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
  }))];

  useEffect(() => setCurrentPage(1), [selectedMonth]);

  const filteredList = useMemo(() => {
    if (selectedMonth === 'Tous') return pointageList;
    return pointageList.filter(item => {
      const d = item.checkIn ? new Date(item.checkIn) : new Date();
      return d.toLocaleString('fr-FR', { month: 'long', year: 'numeric' }) === selectedMonth;
    });
  }, [pointageList, selectedMonth]);

  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredList.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredList, currentPage]);

  const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE);

  // 7. Monthly Aggregation
  const monthlySummary = useMemo(() => {
    if (selectedMonth === 'Tous') return [];
    
    const stats = {};
    filteredList.forEach(item => {
      if (!stats[item.workerId]) {
        stats[item.workerId] = { name: item.workerName, totalHours: 0, daysCount: 0 };
      }
      stats[item.workerId].totalHours += (item.totalHours || 0);
      stats[item.workerId].daysCount += 1;
    });

    Object.values(stats).forEach(s => {
      s.totalHours = parseFloat(s.totalHours.toFixed(2));
    });

    return Object.values(stats).sort((a,b) => b.totalHours - a.totalHours);
  }, [filteredList, selectedMonth]);

  return {
    workers, pointageList, filteredList, paginatedList, activeSessions,
    currentPage, setCurrentPage, totalPages, ITEMS_PER_PAGE,
    months, selectedMonth, setSelectedMonth, monthlySummary,
    addWorker, removeWorker, 
    handleCheckIn, handleBulkCheckIn, handlePause, handleResume, handleCheckOut,
    handleAddManualLog, handleUpdateHours, handleDeleteLog,
    isSubmitting
  };
};
