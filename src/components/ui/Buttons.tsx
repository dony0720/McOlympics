import type { ButtonHTMLAttributes } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function PrimaryButton({ className = '', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`w-full cursor-pointer rounded-[14px] border-none bg-brand py-[17px] text-[17px] font-semibold text-white active:bg-brand-dark ${className}`}
    />
  );
}

export function DarkButton({ className = '', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-[14px] border-none bg-ink py-[17px] text-[17px] font-semibold text-white active:bg-ink-soft ${className}`}
    />
  );
}

export function SoftButton({ className = '', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`w-full cursor-pointer rounded-[14px] border-none bg-brand-soft py-[15px] text-[16px] font-bold text-brand active:bg-brand-soft-dark ${className}`}
    />
  );
}

export function PlainButton({ className = '', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`cursor-pointer border-none bg-transparent text-muted-3 ${className}`}
    />
  );
}
