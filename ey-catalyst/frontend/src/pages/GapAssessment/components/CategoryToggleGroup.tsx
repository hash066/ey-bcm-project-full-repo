interface CategoryToggleGroupProps {
  value: string;
  onValueChange: (value: string) => void;
}

export default function CategoryToggleGroup({ value, onValueChange }: CategoryToggleGroupProps) {
  return (
    <div className="flex bg-slate-900 border border-slate-700 rounded-xl p-1">
      {['Standards', 'Acts of Parliament', 'Regulations'].map((category) => (
        <button
          key={category}
          onClick={() => onValueChange(category)}
          className={`flex-1 px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
            value === category
              ? 'bg-yellow-500 text-black shadow-lg'
              : 'text-yellow-400 hover:text-yellow-300 border border-yellow-900 hover:border-yellow-600 hover:bg-slate-800'
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
