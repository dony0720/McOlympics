interface TeamAvatarProps {
  color: string;
  initial: string;
  size?: number;
  ring?: boolean;
}

export function TeamAvatar({ color, initial, size = 34, ring = false }: TeamAvatarProps) {
  const radius = Math.round(size * 0.32);
  const fontSize = Math.round(size * 0.42);
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: color,
        boxShadow: ring ? '0 0 0 3px rgba(255,209,88,.4)' : undefined,
      }}
    >
      <span className="font-extrabold text-white" style={{ fontSize }}>{initial}</span>
    </div>
  );
}
