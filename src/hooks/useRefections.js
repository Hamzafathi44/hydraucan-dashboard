import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';

// Security fix (copy, 2026-10-28): Réfection entries are per-user, like
// workReports. Previously this hook fetched ALL refeccions with no owner
// filter and wrote no userId, so any signed-in employee could read, edit
// and delete every other employee's entries. Now only the current user's
// entries are read, and new entries are stamped with their userId.
// Legacy exception (2026-10-29, on Michael's decision): entries written
// before this fix carry no userId and are shown to every signed-in
// employee, as before; only entries WITH a userId are restricted to their
// owner. They were never deleted.
export const useRefections = (user) => {
  const [refections, setRefections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRefections([]);
      setLoading(false);
      return;
    }
    // Sorted client-side on purpose: orderBy(date) would need a new
    // Firestore composite index before the view works at all. No
    // server-side userId filter: legacy entries without a userId must
    // also load, so the owner check happens here (ownerless = visible
    // to everyone).
    const unsubscribe = onSnapshot(
      collection(db, 'refections'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data()
        })).filter((r) => !r.userId || r.userId === user.uid)
          .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
        setRefections(list);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading refections:', error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user]);

  const addRefection = async (data) => {
    try {
      await addDoc(collection(db, 'refections'), {
        ...data,
        userId: user?.uid,
        createdAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error adding refection:', error);
      return { success: false, error };
    }
  };

  const updateRefection = async (id, data) => {
    try {
      // 🔍 We log this to make sure the ID and data are correct
      console.log("Updating ID:", id);
      console.log("New Data:", data);
      
      const docRef = doc(db, 'refections', id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating refection:', error);
      return { success: false, error };
    }
  };

  const deleteRefection = async (id) => {
    try {
      await deleteDoc(doc(db, 'refections', id));
      return { success: true };
    } catch (error) {
      console.error('Error deleting refection:', error);
      return { success: false, error };
    }
  };

  return { refections, loading, addRefection, updateRefection, deleteRefection };
};