'use client';
    
import {
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  CollectionReference,
  DocumentReference,
  SetOptions,
  doc,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import {FirestorePermissionError} from '@/firebase/errors';

/**
 * Initiates a setDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function setDocumentNonBlocking(docRef: DocumentReference, data: any, options?: SetOptions) {
  setDoc(docRef, data, options || {}).catch(error => {
    const operation = options && 'merge' in options ? 'update' : 'create';
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: docRef.path,
        operation: operation, 
        requestResourceData: data,
      })
    )
  })
  // Execution continues immediately
}

/**
 * Initiates an addDoc operation for a collection reference.
 * It now awaits the operation and returns the document reference.
 */
export async function addDocument(colRef: CollectionReference, data: any): Promise<DocumentReference> {
  try {
    const docRef = await addDoc(colRef, data);
    return docRef;
  } catch (error) {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: colRef.path,
          operation: 'create',
          requestResourceData: data,
        })
      );
      // Re-throw the error after emitting so the caller knows it failed
      throw error;
  }
}


/**
 * Initiates an updateDoc operation for a document reference.
 * It now awaits the operation.
 */
export async function updateDocument(docRef: DocumentReference, data: any) {
  try {
    await updateDoc(docRef, data);
  } catch (error) {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: data,
        })
      )
      throw error; // Re-throw to let the caller know it failed
    };
}


/**
 * Initiates a deleteDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function deleteDocumentNonBlocking(docRef: DocumentReference) {
  deleteDoc(docRef)
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        })
      )
    });
}
