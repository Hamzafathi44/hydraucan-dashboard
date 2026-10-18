import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export const useEnveloppes = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'enveloppe_reports'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setReports(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const addReport = async (data) => {
    try {
      await addDoc(collection(db, 'enveloppe_reports'), { ...data, createdAt: serverTimestamp() });
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