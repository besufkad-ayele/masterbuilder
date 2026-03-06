import { db, storage } from '@/lib/firebase';
import {
    collection,
    getDocs,
    getDoc,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
} from 'firebase/firestore';
import {
    ref,
    uploadBytesResumable,
    getDownloadURL
} from 'firebase/storage';
import { Company } from '@/types';

export const companyService = {
    /**
     * Get all companies
     */
    async getAll(): Promise<Company[]> {
        const snapshot = await getDocs(collection(db, 'companies'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));
    },

    /**
     * Get a single company by ID
     */
    async getById(id: string): Promise<Company | null> {
        const d = await getDoc(doc(db, 'companies', id));
        return d.exists() ? { id: d.id, ...d.data() } as Company : null;
    },

    /**
     * Create a new company
     * Rule: ID is derived from name (slugified)
     */
    async create(companyData: Omit<Company, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
        const trimmedName = companyData.name.trim();
        const id = trimmedName
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');

        const now = new Date().toISOString();
        const fullData: Company = {
            ...companyData,
            name: trimmedName,
            id,
            created_at: now,
            updated_at: now
        };

        await setDoc(doc(db, 'companies', id), fullData);
        return id;
    },

    /**
     * Update an existing company
     */
    async update(id: string, companyData: Partial<Company>): Promise<void> {
        const now = new Date().toISOString();
        await updateDoc(doc(db, 'companies', id), {
            ...companyData,
            updated_at: now
        });
    },

    /**
     * Delete a company
     */
    async delete(id: string): Promise<void> {
        await deleteDoc(doc(db, 'companies', id));
    },

    /**
     * Compress image client-side before upload
     */
    async compressLogo(file: File, maxWidth = 512, maxHeight = 512): Promise<Blob> {
        console.log("Service: Starting compression for file:", file.name, file.size, file.type);
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                console.log("Service: File read as DataURL complete");
                const img = new Image();
                img.onload = () => {
                    console.log("Service: Image object loaded successfully:", img.width, "x", img.height);
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height *= maxWidth / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width *= maxHeight / height;
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        console.error("Service: Canvas context error");
                        reject(new Error("Canvas context error"));
                        return;
                    }
                    ctx.drawImage(img, 0, 0, width, height);

                    console.log("Service: Drawing to canvas complete, converting to blob...");
                    canvas.toBlob((blob) => {
                        if (blob) {
                            console.log("Service: Compression complete! Final size:", (blob.size / 1024).toFixed(2), "KB");
                            resolve(blob);
                        } else {
                            console.error("Service: toBlob returned null");
                            reject(new Error('Canvas to Blob failed'));
                        }
                    }, 'image/jpeg', 0.85); // Switched to jpeg for broader support
                };
                img.onerror = (e) => {
                    console.error("Service: Image load error:", e);
                    reject(new Error("Image load failed"));
                };
                img.src = event.target?.result as string;
            };
            reader.onerror = (e) => {
                console.error("Service: FileReader error:", e);
                reject(e);
            };
            reader.readAsDataURL(file);
        });
    },

    /**
     * Upload organization logo with progress tracking
     */
    async uploadLogo(
        file: Blob | File,
        companyName: string,
        onProgress?: (progress: number) => void
    ): Promise<string> {
        const slug = companyName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const fileName = `logos/${slug}-${Date.now()}.webp`;
        const storageRef = ref(storage, fileName);

        console.log("Starting Firebase Storage upload to:", fileName);
        const uploadTask = uploadBytesResumable(storageRef, file);

        return new Promise((resolve, reject) => {
            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log("Upload progress:", Math.floor(progress), "%");
                    if (onProgress) onProgress(progress);
                },
                (error) => {
                    console.error("Firebase Storage upload error:", error);
                    reject(error);
                },
                async () => {
                    console.log("Upload complete, fetching download URL...");
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(downloadURL);
                }
            );
        });
    }
};
