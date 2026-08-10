import type { ChangeEvent } from 'react';

interface ScoreStepperProps {
  value: number;
  onDec: () => void;
  onInc: () => void;
  onInput: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function ScoreStepper({ value, onDec, onInc, onInput }: ScoreStepperProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onDec}
        className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] border-none bg-line p-0 text-[22px] font-semibold text-muted-3 active:bg-line-dark"
      >
        −
      </button>
      <input
        value={value}
        onChange={onInput}
        inputMode="numeric"
        className="h-[38px] w-[58px] rounded-[10px] border-none bg-surface text-center text-[17px] font-bold text-ink shadow-[inset_0_0_0_1.5px_#e5e8eb] outline-none focus:shadow-[inset_0_0_0_1.6px_#03b26c]"
      />
      <button
        onClick={onInc}
        className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] border-none bg-brand-soft p-0 text-[22px] font-semibold text-brand active:bg-brand-soft-dark"
      >
        +
      </button>
    </div>
  );
}
