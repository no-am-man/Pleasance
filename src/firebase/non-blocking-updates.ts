// src/firebase/non-blocking-updates.ts
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
 * Sets data for a document reference without awaiting the result on the client.
 * It handles permission errors by emitting them globally.
 */
export function setDocumentNonBlocking(docRef: DocumentReference, data: any, options?: SetOptions): void {
  setDoc(docRef, data, options || {})
    .catch(error => {
      const operation = options && 'merge' in options ? 'update' : 'create';
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: operation, 
          requestResourceData: data,
        })
      );
    });
}

/**
 * Adds a document to a collection without awaiting the result.
 */
export function addDocumentNonBlocking(colRef: CollectionReference, data: any): void {
  addDoc(colRef, data)
    .catch(error => {
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
 * Updates a document without awaiting the result.
 */
export function updateDocumentNonBlocking(docRef: DocumentReference, data: any): void {
  updateDoc(docRef, data)
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: data,
        })
      );
    });
}

/**
 * Deletes a document without awaiting the result.
 */
export function deleteDocumentNonBlocking(docRef: DocumentReference): void {
  deleteDoc(docRef)
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        })
      );
    });
}
