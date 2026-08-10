import type { StatusOption } from '../../types';

const ACTIVE_CLASS: Record<StatusOption['value'], string> = {
  pending: 'bg-line-dark text-muted-3',
  live: 'bg-warn-soft text-warn-dark',
  done: 'bg-brand-soft text-brand',
};

export function SegmentedControl({ options }: { options: StatusOption[] }) {
  return (
    <div className="flex gap-[5px] rounded-[11px] bg-line p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={o.select}
          className={`flex-1 rounded-[9px] border-none py-[9px] text-[13px] font-bold ${
            o.active ? ACTIVE_CLASS[o.value] : 'bg-transparent text-muted-4'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
