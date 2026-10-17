import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';

export const useRefections = () => {
  const [refections, setRefections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'refections'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data()
        }));
        setRefections(list);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading refections:', error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const addRefection = async (data) => {
    try {
      await addDoc(collection(db, 'refections'), {
        ...data,
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
      await updateDoc(doc(db, 'refections', id), {
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
};.