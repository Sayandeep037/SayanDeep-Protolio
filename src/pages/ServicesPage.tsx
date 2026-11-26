import { useState } from 'react';
import { Code2, Cpu, Database, Layers } from 'lucide-react';
import { MotionConfig, motion } from 'motion/react';
import {
  SERVICES_DATA,
  SKILL_GROUPS,
} from '../data/portfolioData';

const SERVICE_ICONS = [Layers, Database, Cpu];
const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function ServicesPage() {
  const [activeServiceIdx, setActiveServiceIdx] = useState(0);
  const [flipTurns, setFlipTurns] = useState<number[]>(() =>
    SERVICES_DATA.map(() => 0)
  );

  const triggerFlip = (idx: number) => {
    setActiveServiceIdx(idx);
    setFlipTurns((prev) =>
      prev.map((turns, i) => (i === idx ? turns + 1 : turns))
    );
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        {/* 1. Header: Blueprint Scan Beam + Clip-Path Reveal */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
          className="relative overflow-hidden rounded-2xl border border-[#1f3b2c] bg-[#07110c]/92 p-7 sm:p-10 shadow-[0_24px_60px_rgba(0,0,0,0.4)]"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#52e896]/40 to-transparent"
          />

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.08, ease: EASE_OUT_EXPO }}
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#52e896] mb-3"
            >
              <span className="h-2 w-2 rounded-full bg-[#36d67e]" />
              Services &amp; Capabilities
            </motion.div>

            <motion.h1
              initial={{ clipPath: 'inset(0 100% 0 0)', opacity: 0.2 }}
              animate={{ clipPath: 'inset(0 0% 0 0)', opacity: 1 }}
              transition={{ duration: 0.65, delay: 0.14, ease: EASE_OUT_EXPO }}
              className="text-3xl sm:text-5xl font-semibold tracking-[-0.03em] text-white mb-4"
            >
              What I Build &amp; Deliver.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.28, ease: EASE_OUT_EXPO }}
              className="text-base sm:text-lg text-[#dce8e1] max-w-3xl leading-relaxed"
            >
              I build modern, responsive web experiences using React, JavaScript, HTML, and CSS, supported by backend development with Python and Django, database management with SQL, and interactive, data-driven applications.
            </motion.p>
          </div>
        </motion.section>

        {/* 2. Service Pillars: 360-Degree 3D Flip + Directional Convergence + Icon Kinetics */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 [perspective:1200px]">
          {SERVICES_DATA.map((service, idx) => {
            const Icon = SERVICE_ICONS[idx % SERVICE_ICONS.length];
            const isActive = activeServiceIdx === idx;
            const entryX = idx === 0 ? -26 : 26;
            const entryY = 12;

            return (
              <motion.article
                key={service.title}
                onClick={() => triggerFlip(idx)}
                initial={{ opacity: 0, x: entryX, y: entryY, scale: 0.96 }}
                whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                animate={{ rotateY: flipTurns[idx] * 360 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{
                  duration: 0.52,
                  delay: idx * 0.1,
                  ease: EASE_OUT_EXPO,
                  rotateY: {
                    duration: 0.85,
                    delay: 0,
                    ease: [0.22, 1, 0.36, 1],
                  },
                }}
                whileHover={{ y: -6 }}
                style={{ transformPerspective: 1100, transformStyle: 'preserve-3d' }}
                className="group relative overflow-hidden rounded-2xl border border-[#1f3b2c] bg-[#07110c]/92 p-7 flex flex-col justify-between cursor-pointer"
              >
                {/* Active emerald highlight frame */}
                <motion.div
                  aria-hidden="true"
                  animate={{ opacity: isActive ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="pointer-events-none absolute inset-0 rounded-2xl border border-[#36d67e]/75 bg-gradient-to-b from-[#123322]/45 to-transparent"
                />

                {/* Animated top accent beam */}
                <motion.span
                  aria-hidden="true"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: isActive ? 1 : 0 }}
                  transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
                  style={{ originX: 0 }}
                  className="pointer-events-none absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-[#36d67e] via-[#52e896] to-transparent"
                />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-5">
                    <motion.div
                      animate={isActive ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                      transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
                      className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-colors ${
                        isActive
                          ? 'bg-[#123021] border-[#36d67e]/70 text-[#52e896]'
                          : 'bg-[#0d2418] border-[#28563d] text-[#52e896]'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </motion.div>

                    <span
                      className={`text-xs font-semibold tracking-widest transition-colors ${
                        isActive ? 'text-[#52e896]' : 'text-white/35'
                      }`}
                    >
                      0{idx + 1}
                    </span>
                  </div>

                  <h2 className="text-lg font-semibold text-white mb-2">
                    {service.title}
                  </h2>
                  <p className="text-xs font-semibold text-[#52e896] mb-3 leading-relaxed">
                    {service.stack}
                  </p>
                  <p className="text-sm text-[#dce8e1] leading-relaxed">
                    {service.description}
                  </p>
                </div>
              </motion.article>
            );
          })}
        </section>

        {/* 3. Technical Stack: Flowing Emerald SVG Waves + Staggered Wave Chips */}
        <motion.section
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
          className="relative overflow-hidden rounded-2xl border border-[#1f3b2c] bg-[#07110c]/92 p-7"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 rounded-b-2xl bg-gradient-to-t from-[#123322]/35 to-transparent"
          />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2.5 text-[#52e896] text-xs font-semibold uppercase tracking-[0.18em]">
              <span className="inline-flex">
                <Code2 className="w-4 h-4" />
              </span>
              Technical Stack
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-1 gap-5">
            {SKILL_GROUPS.map((group, groupIdx) => (
              <motion.div
                key={group.label}
                initial={{ opacity: 0, scale: 0.94, y: 12 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{
                  duration: 0.35,
                  delay: groupIdx * 0.05,
                  ease: EASE_OUT_EXPO,
                }}
                className="rounded-xl border border-white/10 bg-[#0a1610]/85 p-5 hover:border-[#36d67e]/45 transition-colors"
              >
                <div className="text-xs font-semibold uppercase tracking-wider text-[#52e896] mb-3.5">
                  {group.label}
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {group.items.map((item, itemIdx) => (
                    <motion.span
                      key={item}
                      whileHover={{
                        y: -8,
                        scale: 1.07,
                        borderColor: '#52e896',
                      }}
                      className="rounded-md border border-[#234734] bg-[#0f2419]/90 px-3 py-1.5 text-xs font-medium text-white cursor-default"
                    >
                      {item}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>
    </MotionConfig>
  );
}
