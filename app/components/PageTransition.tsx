"use client";

import { usePathname } from "next/navigation";

export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="cs-page-enter">
      {children}

      <style jsx global>{`
        .cs-page-enter {
          animation: csPageEnter 260ms
            cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes csPageEnter {
          0% {
            opacity: 0;
            transform: translateY(7px);
            filter: brightness(0.72);
          }

          45% {
            opacity: 1;
          }

          100% {
            opacity: 1;
            transform: translateY(0);
            filter: brightness(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .cs-page-enter {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}