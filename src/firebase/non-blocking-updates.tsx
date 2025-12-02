
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
export function setDocumentNonBlocking(docRef: DocumentReference, data: any, options: SetOptions) {
  setDoc(docRef, data, options).catch(error => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: docRef.path,
        operation: 'write', // or 'create'/'update' based on options
        requestResourceData: data,
      })
    )
  })
  // Execution continues immediately
}

/**
 * Initiates an addDoc operation for a collection reference.
 * Does NOT await the write operation internally.
 */
export function addDocumentNonBlocking(colRef: CollectionReference, data: any) {
    addDoc(colRef, data).catch(error => {
        errorEmitter.emit(
        'permission-error',
            new FirestorePermissionError({
                path: colRef.path,
                operation: 'create',
                requestResourceData: data,
            })
        );
    });
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
 * Does NOT await the write operation internally.
 */
export function updateDocumentNonBlocking(docRef: DocumentReference, data: any) {
  updateDoc(docRef, data)
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: data,
        })
      )
    });
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
