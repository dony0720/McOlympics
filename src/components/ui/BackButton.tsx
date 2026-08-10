interface BackButtonProps {
  onClick: () => void;
  stroke?: string;
}

export function BackButton({ onClick, stroke = '#191f28' }: BackButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex h-10 w-10 flex-shrink-0 cursor-pointer items-center justify-center border-none bg-transparent p-0"
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M15 5l-7 7 7 7" stroke={stroke} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
