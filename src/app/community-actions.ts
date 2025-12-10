// src/app/community-actions.ts
'use server';

import { initializeAdminApp } from '@/firebase/config-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import type { Form } from '@/lib/types';
import { z } from 'zod';

const EchoFormInputSchema = z.object({
    sourceCommunityId: z.string(),
    sourceFormId: z.string(),
    targetCommunityId: z.string(),
    userId: z.string(),
    userName: z.string(),
    userAvatarUrl: z.string().optional(),
});

type EchoFormInput = z.infer<typeof EchoFormInputSchema>;

export async function echoThoughtForm(input: EchoFormInput): Promise<{ newFormId: string }> {
    const validatedInput = EchoFormInputSchema.safeParse(input);
    if (!validatedInput.success) {
        throw new Error(`Invalid input for echoThoughtForm: ${validatedInput.error.message}`);
    }

    const adminApp = initializeAdminApp();
    const firestore = getFirestore(adminApp);
    const { sourceCommunityId, sourceFormId, targetCommunityId, userId, userName, userAvatarUrl } = validatedInput.data;

    const sourceFormRef = firestore.collection(`communities/${sourceCommunityId}/forms`).doc(sourceFormId);
    const targetFormsColRef = firestore.collection(`communities/${targetCommunityId}/forms`);
    const newFormRef = targetFormsColRef.doc();

    return firestore.runTransaction(async (transaction) => {
        const sourceFormDoc = await transaction.get(sourceFormRef);
        if (!sourceFormDoc.exists) {
            throw new Error('Original thought-form not found.');
        }
        const sourceFormData = sourceFormDoc.data() as Form;

        // Create the new "echo" form
        const newForm: Omit<Form, 'id'> = {
            ...sourceFormData,
            communityId: targetCommunityId, // Set the new community ID
            originFormId: sourceFormData.originFormId || sourceFormId, // Link back to the original
            originCommunityId: sourceFormData.originCommunityId,
            userId: userId, // The user who echoed it
            userName: userName,
            userAvatarUrl: userAvatarUrl,
            createdAt: FieldValue.serverTimestamp(),
            lastEchoAt: FieldValue.serverTimestamp(), // Mark the echo time
            echoCount: 0, // Echoes of an echo don't count initially
        };

        transaction.set(newFormRef, newForm);

        // Update the original form's echo count and timestamp
        transaction.update(sourceFormRef, {
            echoCount: FieldValue.increment(1),
            lastEchoAt: FieldValue.serverTimestamp(),
        });

        return { newFormId: newFormRef.id };
    });
}
