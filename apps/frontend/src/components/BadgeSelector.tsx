'use client';

import React, { useState, useEffect } from 'react';
import { BADGE_ROLE_MAP, type BadgeName, type UserRole } from '@/types/badge';

interface BadgeSelectorProps {
  availableBadges: Array<{
    name: BadgeName;
    role: string;
    displayName: string;
  }>;
  selectedBadges: BadgeName[];
  onChange: (badges: BadgeName[]) => void;
  disabled?: boolean;
  showRoleInfo?: boolean;
}

export default function BadgeSelector({
  availableBadges,
  selectedBadges,
  onChange,
  disabled = false,
  showRoleInfo = true,
}: BadgeSelectorProps) {
  const [disabledBadges, setDisabledBadges] = useState<Set<BadgeName>>(new Set());

  // Determine which badges should be disabled based on selected badges
  useEffect(() => {
    if (selectedBadges.length === 0) {
      setDisabledBadges(new Set());
      return;
    }

    // Get the role(s) of selected badges
    const selectedRoles = new Set(
      selectedBadges.map((badge) => BADGE_ROLE_MAP[badge])
    );

    // If we have a role, disable badges with different roles
    if (selectedRoles.size === 1) {
      const selectedRole = Array.from(selectedRoles)[0];
      const disabled = new Set<BadgeName>();

      availableBadges.forEach((badge) => {
        if (BADGE_ROLE_MAP[badge.name] !== selectedRole) {
          disabled.add(badge.name);
        }
      });

      setDisabledBadges(disabled);
    }
  }, [selectedBadges, availableBadges]);

  const handleBadgeChange = (badgeName: BadgeName, checked: boolean) => {
    const newBadges = checked
      ? [...selectedBadges, badgeName]
      : selectedBadges.filter((b) => b !== badgeName);

    onChange(newBadges);
  };

  const getCurrentRole = (): UserRole | null => {
    if (selectedBadges.length === 0) return null;
    return BADGE_ROLE_MAP[selectedBadges[0]];
  };

  const currentRole = getCurrentRole();

  return (
    <div className="space-y-4">
      {showRoleInfo && currentRole && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Current Role:</strong> {currentRole}
          </p>
          <p className="text-xs text-blue-700 mt-1">
            Select one or more badges for this role. Other roles will be disabled.
          </p>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Assign Badges</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {availableBadges.map((badge) => {
            const isDisabled =
              disabledBadges.has(badge.name) || disabled;
            const isSelected = selectedBadges.includes(badge.name);

            return (
              <label
                key={badge.name}
                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  isDisabled
                    ? 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
                    : isSelected
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) =>
                    handleBadgeChange(badge.name, e.target.checked)
                  }
                  disabled={isDisabled}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div className="ml-3 flex-1">
                  <span className="text-sm font-medium text-gray-900">
                    {badge.displayName}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({badge.name})
                  </span>
                  {isDisabled && selectedBadges.length > 0 && (
                    <p className="text-xs text-red-600 mt-1">
                      Not compatible with {currentRole}
                    </p>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {selectedBadges.length > 0 && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">
            <strong>Selected Badges:</strong> {selectedBadges.join(', ')}
          </p>
        </div>
      )}

      {selectedBadges.length === 0 && !disabled && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            Select at least one badge to assign a role.
          </p>
        </div>
      )}
    </div>
  );
}
