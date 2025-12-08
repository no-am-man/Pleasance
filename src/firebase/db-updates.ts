// src/firebase/db-updates.ts
'use client';
    
import {
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  CollectionReference,
  DocumentReference,
  SetOptions,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Asynchronously sets data for a document reference, handling permission errors.
 * This operation is now awaited.
 */
export async function setDocument(docRef: DocumentReference, data: any, options?: SetOptions): Promise<void> {
  try {
    await setDoc(docRef, data, options || {});
  } catch (error) {
    const operation = options && 'merge' in options ? 'update' : 'create';
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: docRef.path,
        operation: operation, 
        requestResourceData: data,
      })
    );
    throw error; // Re-throw to allow caller to handle failure
  }
}

/**
 * Asynchronously adds a document to a collection, handling permission errors.
 * This operation is now awaited.
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
    throw error; // Re-throw to allow caller to handle failure
  }
}

/**
 * Asynchronously updates a document, handling permission errors.
 * This operation is now awaited.
 */
export async function updateDocument(docRef: DocumentReference, data: any): Promise<void> {
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
    );
    throw error; // Re-throw to allow caller to handle failure
  }
}

/**
 * Asynchronously deletes a document, handling permission errors.
 * This operation is now awaited.
 */
export async function deleteDocument(docRef: DocumentReference): Promise<void> {
  try {
    await deleteDoc(docRef);
  } catch (error) {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: docRef.path,
        operation: 'delete',
      })
    );
    throw error; // Re-throw to allow caller to handle failure
  }
}
