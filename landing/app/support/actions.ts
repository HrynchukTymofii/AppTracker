'use server';

import { createSupportMessage } from '@/lib/db';

export async function submitSupportMessage(data: {
  name: string;
  email: string;
  message: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (!data.name.trim() || !data.email.trim() || !data.message.trim()) {
      return { success: false, error: 'All fields are required' };
    }

    await createSupportMessage({
      name: data.name.trim(),
      email: data.email.trim(),
      message: data.message.trim(),
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to submit support message:', error);
    return { success: false, error: 'Failed to submit message' };
  }
}
