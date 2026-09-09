'use client';

import React, { useState } from 'react';
import BadgeSelector from './BadgeSelector';
import { authApi } from '@/lib/api';
import type { BadgeName } from '@/types/badge';

interface UserBadgeManagementProps {
  userId: string;
  currentBadges: BadgeName[];
  availableBadges: Array<{
    name: BadgeName;
    role: string;
    displayName: string;
  }>;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function UserBadgeManagement({
  userId,
  currentBadges,
  availableBadges,
  onSuccess,
  onError,
}: UserBadgeManagementProps) {
  const [selectedBadges, setSelectedBadges] = useState<BadgeName[]>(
    currentBadges
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showMFAInput, setShowMFAInput] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const isAssigningTU = selectedBadges.includes('TU');
  const wasHavingTU = currentBadges.includes('TU');
  const requiresMFA = isAssigningTU && !wasHavingTU;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedBadges.length === 0) {
      setMessage({
        type: 'error',
        text: 'Please select at least one badge',
      });
      return;
    }

    // Check if badges have changed
    const badgesChanged = 
      selectedBadges.length !== currentBadges.length ||
      !selectedBadges.every((b) => currentBadges.includes(b));

    if (!badgesChanged) {
      setMessage({
        type: 'info',
        text: 'No changes made to badges',
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await authApi.admin.updateUserBadges(userId, selectedBadges, mfaCode || undefined);
      const data = response as any;

      if (data.requiresMFA) {
        setShowMFAInput(true);
        setMessage({
          type: 'info',
          text: 'MFA code sent to your email. Please enter it to assign TU badge.',
        });
        return;
      }

      setMessage({
        type: 'success',
        text: 'User badges updated successfully',
      });
      setMfaCode('');
      setShowMFAInput(false);
      onSuccess?.();
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to update user badges';
      setMessage({
        type: 'error',
        text: errorMessage,
      });
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <BadgeSelector
        availableBadges={availableBadges}
        selectedBadges={selectedBadges}
        onChange={setSelectedBadges}
        disabled={isLoading}
      />

      {requiresMFA && showMFAInput && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <h3 className="text-sm font-semibold text-orange-900 mb-3">
            Multi-Factor Authentication Required
          </h3>
          <p className="text-sm text-orange-800 mb-4">
            Assigning the TU (Administrative Staff) badge requires MFA verification.
            An OTP has been sent to the user's email.
          </p>
          <input
            type="text"
            placeholder="Enter MFA code"
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value)}
            maxLength={6}
            className="w-full px-3 py-2 border border-orange-300 rounded-md text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-orange-500"
            disabled={isLoading}
          />
          <p className="text-xs text-orange-700 mt-2">
            Enter the 6-digit code sent to the user's email
          </p>
        </div>
      )}

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : message.type === 'error'
                ? 'bg-red-50 border border-red-200'
                : 'bg-blue-50 border border-blue-200'
          }`}
        >
          <p
            className={
              message.type === 'success'
                ? 'text-green-800'
                : message.type === 'error'
                  ? 'text-red-800'
                  : 'text-blue-800'
            }
          >
            {message.text}
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isLoading || selectedBadges.length === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Updating...' : 'Update Badges'}
        </button>
        <button
          type="button"
          onClick={() => {
            setSelectedBadges(currentBadges);
            setShowMFAInput(false);
            setMfaCode('');
            setMessage(null);
          }}
          disabled={isLoading}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg font-medium hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Reset
        </button>
      </div>
    </form>
  );
}
