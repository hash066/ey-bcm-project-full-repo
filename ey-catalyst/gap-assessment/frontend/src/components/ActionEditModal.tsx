import React, { useState, useEffect } from 'react';
import { ActionPlan } from '../types';
import { X, Save } from 'lucide-react';

interface ActionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: ActionPlan | null;
  onSave: (action: Partial<ActionPlan>) => void;
}

export default function ActionEditModal({
  isOpen,
  onClose,
  action,
  onSave
}: ActionEditModalProps) {
  const [formData, setFormData] = useState({
    actionDescription: '',
    assignedTo: '',
    planType: 'immediate' as 'immediate' | 'short_term' | 'long_term',
    timelineDays: 30
  });

  // Reset form data when action changes
  useEffect(() => {
    if (action) {
      setFormData({
        actionDescription: action.actionDescription,
        assignedTo: action.assignedTo,
        planType: action.planType,
        timelineDays: action.timelineDays
      });
    }
  }, [action]);

  if (!isOpen || !action) return null;

  const handleSave = () => {
    onSave({
      ...formData,
      controlId: action.controlId,
      id: action.id,
      status: 'approved', // Set to approved when modified and saved
      aiGenerated: false, // No longer AI generated after manual edit
      dueDate: new Date(Date.now() + formData.timelineDays * 24 * 60 * 60 * 1000).toISOString()
    });
    onClose();
  };

  const handleInputChange = (field: keyof typeof formData, value: string | number) => {
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
            <h2 className="text-2xl font-bold text-white">Modify Action Plan</h2>
            <p className="text-zinc-400 mt-1">Edit the action details before approval</p>
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
              Action Description
            </label>
            <textarea
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500 resize-y min-h-24"
              value={formData.actionDescription}
              onChange={(e) => handleInputChange('actionDescription', e.target.value)}
              placeholder="Enter the action description..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Assigned To
            </label>
            <input
              type="text"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500"
              value={formData.assignedTo}
              onChange={(e) => handleInputChange('assignedTo', e.target.value)}
              placeholder="Enter the person/department responsible..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Plan Type
            </label>
            <select
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
              value={formData.planType}
              onChange={(e) => handleInputChange('planType', e.target.value as any)}
            >
              <option value="immediate">Immediate (0-30 days)</option>
              <option value="short_term">Short-term (30-90 days)</option>
              <option value="long_term">Long-term (90+ days)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Timeline (days)
            </label>
            <input
              type="number"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500"
              value={formData.timelineDays}
              onChange={(e) => handleInputChange('timelineDays', parseInt(e.target.value) || 30)}
              placeholder="Enter timeline in days..."
              min="1"
            />
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
              Save & Approve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
