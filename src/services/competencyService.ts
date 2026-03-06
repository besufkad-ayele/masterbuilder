import { db } from "@/lib/firebase";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp
} from "firebase/firestore";
import { CompetencyDictionary, CompetencyLibrary } from "@/types";

const DICTIONARY_COLLECTION = "competency_dictionary";
const LIBRARY_COLLECTION = "competency_library";

export const competencyService = {
    // --- Competency Dictionary ---
    async getDictionary(): Promise<CompetencyDictionary[]> {
        const q = query(collection(db, DICTIONARY_COLLECTION), orderBy("name", "asc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CompetencyDictionary));
    },

    async getDictionaryItem(id: string): Promise<CompetencyDictionary | null> {
        const docRef = doc(db, DICTIONARY_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as CompetencyDictionary;
        }
        return null;
    },

    async createDictionaryItem(item: Omit<CompetencyDictionary, "id" | "created_at" | "updated_at">): Promise<string> {
        const docRef = await addDoc(collection(db, DICTIONARY_COLLECTION), {
            ...item,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp()
        });
        return docRef.id;
    },

    async updateDictionaryItem(id: string, item: Partial<CompetencyDictionary>): Promise<void> {
        const docRef = doc(db, DICTIONARY_COLLECTION, id);
        await updateDoc(docRef, {
            ...item,
            updated_at: serverTimestamp()
        });
    },

    async deleteDictionaryItem(id: string): Promise<void> {
        await deleteDoc(doc(db, DICTIONARY_COLLECTION, id));
    },

    // --- Competency Library ---
    async getLibrary(): Promise<CompetencyLibrary[]> {
        const q = collection(db, LIBRARY_COLLECTION);
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CompetencyLibrary));
    },

    async getLibraryByCompany(companyId: string): Promise<CompetencyLibrary[]> {
        const q = query(collection(db, LIBRARY_COLLECTION), where('company_id', '==', companyId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CompetencyLibrary));
    },

    async getLibraryItem(id: string): Promise<CompetencyLibrary | null> {
        const docRef = doc(db, LIBRARY_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as CompetencyLibrary;
        }
        return null;
    },

    async createLibraryItem(item: Omit<CompetencyLibrary, "id" | "created_at" | "updated_at">): Promise<string> {
        const docRef = await addDoc(collection(db, LIBRARY_COLLECTION), {
            ...item,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp()
        });
        return docRef.id;
    },

    async updateLibraryItem(id: string, item: Partial<CompetencyLibrary>): Promise<void> {
        const docRef = doc(db, LIBRARY_COLLECTION, id);
        await updateDoc(docRef, {
            ...item,
            updated_at: serverTimestamp()
        });
    },

    async deleteLibraryItem(id: string): Promise<void> {
        await deleteDoc(doc(db, LIBRARY_COLLECTION, id));
    }
};
