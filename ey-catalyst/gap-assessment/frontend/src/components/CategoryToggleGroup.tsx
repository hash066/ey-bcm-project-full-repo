interface CategoryToggleGroupProps {
  value: string;
  onValueChange: (value: string) => void;
}

export default function CategoryToggleGroup({ value, onValueChange }: CategoryToggleGroupProps) {
  return (
    <div className="flex bg-black border border-zinc-800 rounded-lg p-1">
      {['Standards', 'Acts of Parliament', 'Regulations'].map((category) => (
        <button
          key={category}
          onClick={() => onValueChange(category)}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            value === category
              ? 'bg-yellow-500 text-black'
              : 'text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800'
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
