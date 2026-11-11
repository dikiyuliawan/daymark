type CheckCircleProps = {
  checked: boolean;
  inProgress?: boolean;
  size?: number;
};

/**
 * The row's circle: an empty ring, a mint ring with a dot while the task is in
 * progress, a filled mint circle with a white tick when it is done.
 */
export function CheckCircle({ checked, inProgress = false, size = 22 }: CheckCircleProps) {
  if (checked) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        focusable={false}
      >
        <circle cx="12" cy="12" r="10.5" fill="var(--done)" />
        <path
          d="m7.5 12.4 3 3 6-6.6"
          stroke="#ffffff"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (inProgress) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        focusable={false}
      >
        <circle cx="12" cy="12" r="10.5" stroke="var(--mark)" strokeWidth={1.8} />
        <circle cx="12" cy="12" r="3.2" fill="var(--mark)" />
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable={false}
    >
      <circle cx="12" cy="12" r="10.5" stroke="var(--faint)" strokeWidth={1.8} />
    </svg>
  );
}
