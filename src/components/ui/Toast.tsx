export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-[34px] left-1/2 z-50 max-w-[340px] -translate-x-1/2 animate-toast-up rounded-[14px] bg-[rgba(25,31,40,.94)] px-5 py-[14px] text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,.24)]">
      {message}
    </div>
  );
}
