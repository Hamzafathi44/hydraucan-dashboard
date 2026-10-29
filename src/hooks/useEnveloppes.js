import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

// Security fix (copy, 2026-10-28): Enveloppe reports are per-user, like
// workReports. Previously this hook fetched ALL enveloppe_reports with no
// owner filter and wrote no userId, so any signed-in employee could read,
// edit and delete every other employee's financial reports and proof URLs.
// Now only the current user's reports are read, and new reports are stamped
// with their userId. Legacy exception (2026-10-29, on Michael's decision):
// reports written before this fix carry no userId and are shown to every
// signed-in employee, as before; only reports WITH a userId are restricted
// to their owner. They were never deleted.
export const useEnveloppes = (user) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setReports([]);
      setLoading(false);
      return;
    }
    // Sorted client-side on purpose: orderBy(createdAt) would need a new
    // Firestore composite index before the view works. No server-side
    // userId filter: legacy reports without a userId must also load, so
    // the owner check happens here (ownerless = visible to everyone).
    const unsubscribe = onSnapshot(collection(db, 'enveloppe_reports'), (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
        .filter((r) => !r.userId || r.userId === user.uid)
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setReports(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const addReport = async (data) => {
    try {
      await addDoc(collection(db, 'enveloppe_reports'), { ...data, userId: user?.uid, createdAt: serverTimestamp() });
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  const updateReport = async (id, data) => {
    try {
      await updateDoc(doc(db, 'enveloppe_reports', id), { ...data, updatedAt: serverTimestamp() });
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  const deleteReport = async (id) => {
    try {
      await deleteDoc(doc(db, 'enveloppe_reports', id));
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  return { reports, loading, addReport, updateReport, deleteReport };
};