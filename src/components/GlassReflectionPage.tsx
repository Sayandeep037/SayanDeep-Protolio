import { ReactNode, useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { DetailSection } from '../data/portfolioData';

interface GlassReflectionPageProps {
  id: DetailSection;
  index: number;
  label: string;
  sectionRef: (el: HTMLElement | null) => void;
  children: ReactNode;
}

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function GlassReflectionPage({
  id,
  index,
  label,
  sectionRef,
  children,
}: GlassReflectionPageProps) {
  const localRef = useRef<HTMLElement | null>(null);
  const inView = useInView(localRef, { once: false, amount: 0.12 });

  const setRefs = (el: HTMLElement | null) => {
    localRef.current = el;
    sectionRef(el);
  };

  return (
    <motion.div
      ref={setRefs}
      id={`page-${id}`}
      data-section={id}
      initial={{ opacity: 0, y: 48, scale: 0.96, rotateX: 6 }}
      whileInView={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
      viewport={{ once: true, amount: 0.04 }}
      transition={{ duration: 0.65, ease: EASE_OUT_EXPO }}
      style={{ transformPerspective: 1400 }}
      className="relative mx-auto w-full max-w-5xl scroll-mt-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-3 -z-10 rounded-[28px] border border-[#52e896]/15 bg-[radial-gradient(ellipse_at_50%_0%,rgba(82,232,150,0.12),rgba(54,214,126,0.04)_45%,transparent_75%)]"
      />

      {/* Outward top-edge specular prism rim rays */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-px inset-x-8 z-20 h-px overflow-visible"
      >
        <span className="block h-full w-full bg-gradient-to-r from-transparent via-white/45 to-transparent shadow-[0_0_16px_2px_rgba(82,232,150,0.3)]" />
      </div>

      {/* Sequential Page Divider Header (Next-to-Next marker) */}
      <div className="mb-4 flex items-center gap-3 px-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#52e896]">
          0{index + 1} · {label}
        </span>
        <motion.span
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
          style={{ originX: 0 }}
          className="h-px flex-1 bg-gradient-to-r from-[#36d67e]/55 via-[#1f3b2c] to-transparent"
        />
      </div>

      {/* Smoked-Glass Specular Frame wrapping page content */}
      <div className="relative overflow-hidden rounded-3xl border border-white/12 bg-[#050d09]/45 p-2 sm:p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_28px_80px_rgba(0,0,0,0.55)]">
        {/* One transform-based glass sweep plays when the section enters view. */}
        <motion.div
          aria-hidden="true"
          initial={{ x: '-45%' }}
          animate={inView ? { x: '145%' } : { x: '-45%' }}
          transition={{
            duration: 2.3,
            ease: [0.3, 0, 0.2, 1],
          }}
          className="pointer-events-none absolute inset-y-[-15%] z-20 flex w-44 -skew-x-[22deg]"
        >
          <span className="h-full w-4 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <span className="h-full w-16 bg-gradient-to-r from-white/12 via-[#52e896]/14 to-transparent" />
          <span className="h-full w-24 bg-gradient-to-r from-[#36d67e]/8 to-transparent" />
        </motion.div>

        {/* Corner specular glass ray glints radiating outward */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-12 -right-10 z-20 h-44 w-44 rotate-12 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.1)_0%,rgba(82,232,150,0.08)_35%,transparent_72%)]"
        />

        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-14 -left-10 z-20 h-44 w-44 -rotate-12 rounded-full bg-[radial-gradient(circle,rgba(82,232,150,0.09)_0%,rgba(54,214,126,0.04)_40%,transparent_72%)]"
        />

        <div className="relative z-10">{children}</div>
      </div>
    </motion.div>
  );
}
