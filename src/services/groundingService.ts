import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp, where } from "firebase/firestore";
import { GroundingModule } from "@/types";

const COLLECTION = "grounding_modules";

export const groundingService = {
    async getModules(): Promise<GroundingModule[]> {
        const q = query(collection(db, COLLECTION), orderBy("name", "asc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GroundingModule));
    },

    async getModuleById(id: string): Promise<GroundingModule | null> {
        const docRef = doc(db, COLLECTION, id);
        const snapshot = await getDoc(docRef);
        return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as GroundingModule : null;
    },


    async getModulesByCompany(companyId: string): Promise<GroundingModule[]> {
        const q = query(collection(db, COLLECTION), where("company_id", "==", companyId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GroundingModule));
    },

    async createModule(item: Omit<GroundingModule, "id" | "created_at" | "updated_at">): Promise<string> {
        const docRef = await addDoc(collection(db, COLLECTION), {
            ...item,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp()
        });
        return docRef.id;
    },

    async updateModule(id: string, item: Partial<GroundingModule>): Promise<void> {
        const docRef = doc(db, COLLECTION, id);
        await updateDoc(docRef, {
            ...item,
            updated_at: serverTimestamp()
        });
    },

    async deleteModule(id: string): Promise<void> {
        await deleteDoc(doc(db, COLLECTION, id));
    }
};

