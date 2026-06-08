interface TamilNaduSVGProps {
  className?: string;
  color?: string;
}

export default function TamilNaduSVG({ className = '', color = 'currentColor' }: TamilNaduSVGProps) {
  return (
    <svg
      viewBox="0 0 100 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M45 2L48 5L52 4L55 7L58 6L62 9L65 8L68 11L72 10L75 14L78 13L80 18L78 22L80 26L78 30L80 34L78 38L80 42L78 46L80 50L78 54L80 58L78 62L80 66L78 70L80 74L78 78L80 82L78 86L80 90L78 94L80 98L78 102L80 106L78 110L80 114L78 118L75 122L72 121L68 124L65 123L62 126L58 125L55 128L52 127L48 128L45 125L42 126L38 123L35 124L32 121L28 122L25 118L28 114L25 110L28 106L25 102L28 98L25 94L28 90L25 86L28 82L25 78L28 74L25 70L28 66L25 62L28 58L25 54L28 50L25 46L28 42L25 38L28 34L25 30L28 26L25 22L28 18L25 14L28 10L32 11L35 8L38 9L42 6L45 7L48 5L45 2Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
