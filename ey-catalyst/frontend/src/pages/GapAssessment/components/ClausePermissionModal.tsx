import { X, Shield, Check, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

interface ClausePermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGranted: () => void;
  userRole?: string;
}

export default function ClausePermissionModal({
  isOpen,
  onClose,
  onGranted,
  userRole = 'Editor' // Mock role - in real app this would come from auth system
}: ClausePermissionModalProps) {
  const [isChecking, setIsChecking] = useState(false);

  if (!isOpen) return null;

  const allowedRoles = ['Admin', 'Editor'];
  const canEdit = allowedRoles.includes(userRole);

  const handleRequestApproval = async () => {
    setIsChecking(true);

    // Simulate permission check/review process
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsChecking(false);
    onGranted();
  };

  return (
    <div className="fixed inset-0 z-[60] flex">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="ml-auto w-full max-w-md bg-zinc-900 shadow-2xl relative flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-950/30 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Permission Required</h2>
              <p className="text-zinc-400 mt-1">Access control for clause editing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-zinc-400" />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-6">
          <div className="bg-black border border-zinc-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-2">Role-based Access Control</h3>
                <p className="text-zinc-300 leading-relaxed mb-3">
                  Only users with Admin or Editor privileges can modify clause requirements and observations.
                  This action will be recorded in the audit trail.
                </p>

                <div className="flex items-center gap-2 text-sm">
                  <span className="text-zinc-500">Your role:</span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    userRole === 'Admin'
                      ? 'bg-red-950/30 text-red-400 border border-red-900'
                      : userRole === 'Editor'
                      ? 'bg-blue-950/30 text-blue-400 border border-blue-900'
                      : 'bg-gray-950/30 text-gray-400 border border-gray-700'
                  }`}>
                    {userRole}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {canEdit ? (
            <div className="bg-green-950/20 border border-green-900/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-green-400 font-semibold mb-1">Permission Granted</h4>
                  <p className="text-zinc-300 text-sm">
                    Your role allows you to edit this clause. You may proceed with the changes.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-red-400 font-semibold mb-1">Permission Required</h4>
                  <p className="text-zinc-300 text-sm mb-3">
                    Your current role does not have permission to edit clauses. An approval request will be sent to an Admin.
                  </p>
                  <button
                    onClick={handleRequestApproval}
                    disabled={isChecking}
                    className="w-full bg-yellow-500 text-black py-3 rounded-lg hover:bg-yellow-400 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isChecking ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        Requesting Approval...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        Request Approval
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {canEdit && (
          <div className="border-t border-zinc-800 p-6">
            <button
              onClick={onGranted}
              className="w-full bg-yellow-500 text-black py-3 rounded-lg hover:bg-yellow-400 transition-colors font-medium"
            >
              Proceed to Edit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
