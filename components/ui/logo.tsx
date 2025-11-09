export function Logo({
  size = 70,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div className={`flex items-center select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 80 80"
        xmlns="http://www.w3.org/2000/svg"
        className="translate-y-1"
      >
        <path
          d="M20 10
             C20 35 60 35 60 10
             H20Z"
          fill="#FFD27F"
        />

        <path
          d="M20 40
             C20 65 60 65 60 40
             H20Z"
          fill="#C4EB70"
        />
      </svg>

      <span
        className="font-bold"
        style={{
          fontSize: `${size * 0.45}px`,
        }}
      >
        Nutrigo
      </span>
    </div>
  );
}
