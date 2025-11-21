import React, { useState, useEffect } from 'react';
import { ClauseMapping } from '../types';
import { X, Save, Lock } from 'lucide-react';

interface ClauseEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  clause: ClauseMapping | null;
  onSave: (clauseId: string, data: Partial<ClauseMapping>) => void;
}

export default function ClauseEditModal({
  isOpen,
  onClose,
  clause,
  onSave
}: ClauseEditModalProps) {
  const [formData, setFormData] = useState({
    requirement: clause?.requirement || '',
    observation: clause?.observation || ''
  });

  // Reset form data when clause changes
  useEffect(() => {
    if (clause) {
      setFormData({
        requirement: clause.requirement,
        observation: clause.observation
      });
    }
  }, [clause]);

  if (!isOpen || !clause) return null;

  const handleSave = () => {
    onSave(clause.id, formData);
    onClose();
  };

  const handleInputChange = (field: 'requirement' | 'observation', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="fixed inset-0 z-[65] flex">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="ml-auto w-full max-w-lg bg-zinc-900 shadow-2xl relative flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div>
            <h2 className="text-2xl font-bold text-white">Edit Clause {clause.clause}</h2>
            <p className="text-zinc-400 mt-1">Make changes to requirement and observation</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-zinc-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Requirement
            </label>
            <textarea
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500 resize-y min-h-24"
              value={formData.requirement}
              onChange={(e) => handleInputChange('requirement', e.target.value)}
              placeholder="Enter the requirement..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Observation
            </label>
            <textarea
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500 resize-y min-h-24"
              value={formData.observation}
              onChange={(e) => handleInputChange('observation', e.target.value)}
              placeholder="Enter your observation..."
            />
          </div>

          {/* Non-editable fields shown for reference */}
          <div className="bg-zinc-950/50 rounded-lg p-4 space-y-4">
            <h3 className="text-yellow-400 font-semibold flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Read-only Fields
            </h3>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Compliance %
                </label>
                <div className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-500 cursor-not-allowed">
                  {clause.compliancePercent}%
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Key Strength/Gap
                </label>
                <div className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-500 cursor-not-allowed">
                  {clause.keyStrengthOrGap}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Difficulty
                </label>
                <div className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-500 cursor-not-allowed">
                  {clause.difficulty}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-800 p-6">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-zinc-800 text-white py-3 rounded-lg hover:bg-zinc-700 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-yellow-500 text-black py-3 rounded-lg hover:bg-yellow-400 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Submit Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
