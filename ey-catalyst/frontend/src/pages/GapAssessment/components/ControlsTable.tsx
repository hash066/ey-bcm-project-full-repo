import { Control, Framework } from '../types';
import { Search, Download, Plus } from 'lucide-react';
import { useState, useMemo } from 'react';
import CategoryToggleGroup from './CategoryToggleGroup';
import FrameworkUploadModal from './FrameworkUploadModal';
import { frameworkOptions } from '../data/mockData';

interface ControlsTableProps {
  controls: Control[];
  frameworkOptions: Record<string, Framework[]>;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  frameworkFilter: string;
  onFrameworkFilterChange: (value: string) => void;
  onUploadNew: (category: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (value: string) => void;
  onRowClick: (control: Control) => void;
  onExportCSV: () => void;
}

export default function ControlsTable({
  controls,
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  frameworkFilter,
  onFrameworkFilterChange,
  onUploadNew,
  priorityFilter,
  onPriorityFilterChange,
  onRowClick,
  onExportCSV
}: ControlsTableProps) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const getStatusColor = (currentScore: number, targetScore: number) => {
    const gap = ((targetScore - currentScore) / targetScore) * 100;
    if (gap <= 10) return 'text-green-400';
    if (gap <= 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStatusText = (currentScore: number, targetScore: number) => {
    const gap = ((targetScore - currentScore) / targetScore) * 100;
    if (gap <= 10) return 'Compliant';
    if (gap <= 30) return 'Partial';
    return 'Non-Compliant';
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-950/50 text-red-400 border-red-900';
      case 'Medium':
        return 'bg-yellow-950/30 text-yellow-400 border-yellow-900';
      case 'Low':
        return 'bg-green-950/30 text-green-400 border-green-900';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  const currentFrameworksInCategory = useMemo(() => {
    return selectedCategory ? frameworkOptions[selectedCategory] || [] : [];
  }, [selectedCategory]);

  const handleFrameworkUploadComplete = (newFramework: Framework) => {
    console.log('New framework added:', newFramework);
    setIsUploadModalOpen(false);
  };

  const handleUploadNewClick = () => {
    if (selectedCategory) {
      onUploadNew(selectedCategory);
      setIsUploadModalOpen(true);
    }
  };

  const getCategoryDisplayName = (category: string) => {
    if (category === "Acts of Parliament") return "Act";
    if (category === "Regulations") return "Regulation";
    return "Standard";
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-yellow-300 drop-shadow-lg">Gap Assessment Details</h2>
          <button
            onClick={onExportCSV}
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Download className="w-5 h-5" />
            Export CSV
          </button>
        </div>

        {/* Category Toggle Group */}
        <div className="mb-6">
          <CategoryToggleGroup
            value={selectedCategory}
            onValueChange={(category) => {
              onCategoryChange(category);
              onFrameworkFilterChange(''); // Reset framework selection
            }}
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search controls..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
            />
          </div>

          {/* Framework Select */}
          <div className="w-48">
            <select
              value={frameworkFilter}
              onChange={(e) => onFrameworkFilterChange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
            >
              <option value="">{selectedCategory ? `All ${selectedCategory}` : 'All Frameworks'}</option>
              {currentFrameworksInCategory.map((framework: Framework) => (
                <option key={framework.id} value={framework.id}>
                  {framework.name}
                </option>
              ))}
            </select>
          </div>

          {/* Upload New Framework Button */}
          {selectedCategory && (
            <button
              onClick={handleUploadNewClick}
              className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New {getCategoryDisplayName(selectedCategory)}
            </button>
          )}

          <select
            value={priorityFilter}
            onChange={(e) => onPriorityFilterChange(e.target.value)}
            className="w-48 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
          >
            <option value="">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-700 border-b border-slate-600">
            <tr>
              <th className="text-left px-6 py-4 text-yellow-300 font-bold text-sm uppercase tracking-wider">Framework</th>
              <th className="text-left px-6 py-4 text-yellow-300 font-bold text-sm uppercase tracking-wider">Domain</th>
              <th className="text-left px-6 py-4 text-yellow-300 font-bold text-sm uppercase tracking-wider">Control Name</th>
              <th className="text-left px-6 py-4 text-yellow-300 font-bold text-sm uppercase tracking-wider">Current Score</th>
              <th className="text-left px-6 py-4 text-yellow-300 font-bold text-sm uppercase tracking-wider">Target Score</th>
              <th className="text-left px-6 py-4 text-yellow-300 font-bold text-sm uppercase tracking-wider">Gap %</th>
              <th className="text-left px-6 py-4 text-yellow-300 font-bold text-sm uppercase tracking-wider">Status</th>
              <th className="text-left px-6 py-4 text-yellow-300 font-bold text-sm uppercase tracking-wider">Priority</th>
            </tr>
          </thead>
          <tbody>
            {controls.map((control) => {
              const gap = ((control.targetScore - control.currentScore) / control.targetScore) * 100;
              return (
                <tr
                  key={control.id}
                  onClick={() => onRowClick(control)}
                  className="border-b border-slate-600 hover:bg-slate-700 cursor-pointer transition-all duration-200 hover:transform hover:scale-[1.002]"
                >
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-950/30 text-yellow-400 border border-yellow-900">
                      {control.frameworkCode}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-sm">{control.domain}</td>
                  <td className="px-6 py-4 text-slate-100 font-medium">{control.controlName}</td>
                  <td className="px-6 py-4 text-slate-400">{control.currentScore}%</td>
                  <td className="px-6 py-4 text-slate-400">{control.targetScore}%</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-zinc-800 rounded-full h-2 max-w-[100px]">
                        <div
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ width: `${Math.min(gap, 100)}%` }}
                        />
                      </div>
                      <span className="text-yellow-400 font-medium text-sm">{gap.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${getStatusColor(control.currentScore, control.targetScore)}`}>
                      {getStatusText(control.currentScore, control.targetScore)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getPriorityBadgeClass(control.priority)}`}>
                      {control.priority}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <FrameworkUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadComplete={handleFrameworkUploadComplete}
      />
    </div>
  );
}
