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
          {/* Green laser perimeter, diagonal beam & scanline effects */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
          >
            {/* Top edge racing green laser */}
            <motion.span
              animate={{ left: ['-20%', '115%'] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
              className="absolute top-0 h-[2px] w-44 bg-gradient-to-r from-transparent via-[#6bffb0] to-transparent shadow-[0_0_16px_2px_rgba(54,214,126,0.95)]"
            />

            {/* Bottom edge counter-racing green laser */}
            <motion.span
              animate={{ left: ['115%', '-20%'] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
              className="absolute bottom-0 h-[2px] w-44 bg-gradient-to-r from-transparent via-[#6bffb0] to-transparent shadow-[0_0_16px_2px_rgba(54,214,126,0.95)]"
            />

            {/* Left & right vertical edge lasers */}
            <motion.span
              animate={{ top: ['115%', '-35%'] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'linear' }}
              className="absolute left-0 w-[2px] h-28 bg-gradient-to-b from-transparent via-[#6bffb0] to-transparent shadow-[0_0_14px_2px_rgba(54,214,126,0.9)]"
            />
            <motion.span
              animate={{ top: ['-35%', '115%'] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'linear' }}
              className="absolute right-0 w-[2px] h-28 bg-gradient-to-b from-transparent via-[#6bffb0] to-transparent shadow-[0_0_14px_2px_rgba(54,214,126,0.9)]"
            />

            {/* Diagonal sweeping green laser beam with emerald trail */}
            <motion.div
              animate={{ left: ['-20%', '120%'] }}
              transition={{
                duration: 3.6,
                repeat: Infinity,
                repeatDelay: 0.9,
                ease: [0.4, 0, 0.2, 1],
              }}
              className="absolute inset-y-[-20%] w-28 -skew-x-12 bg-gradient-to-r from-transparent via-[#36d67e]/20 to-transparent"
            >
              <span className="absolute right-0 inset-y-0 w-[2px] bg-gradient-to-b from-transparent via-[#7effb8] to-transparent shadow-[0_0_24px_4px_rgba(82,232,150,0.9)]" />
            </motion.div>

            {/* Horizontal laser scanline moving vertically */}
            <motion.span
              animate={{
                top: ['-4%', '104%'],
                opacity: [0, 0.95, 0.95, 0],
              }}
              transition={{
                duration: 4.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#52e896]/85 to-transparent shadow-[0_0_18px_2px_rgba(54,214,126,0.65)]"
            />
          </div>

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.08, ease: EASE_OUT_EXPO }}
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#52e896] mb-3"
            >
              <motion.span
                animate={{ scale: [1, 1.45, 1], opacity: [0.65, 1, 0.65] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                className="h-2 w-2 rounded-full bg-[#36d67e]"
              />
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
                onMouseEnter={() => triggerFlip(idx)}
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
                      animate={
                        isActive
                          ? idx === 0
                            ? { y: [0, -3, 0] }
                            : idx === 1
                              ? { rotateY: [0, 180, 360] }
                              : { rotate: [0, 90, 180, 270, 360] }
                          : { y: 0, rotate: 0, rotateY: 0 }
                      }
                      transition={
                        isActive
                          ? {
                              duration: idx === 2 ? 7 : 3,
                              repeat: Infinity,
                              ease: idx === 2 ? 'linear' : 'easeInOut',
                            }
                          : { duration: 0.3 }
                      }
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
          {/* Animated Emerald Wave Backdrop */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-32 overflow-hidden rounded-b-2xl"
          >
            {/* Primary flowing emerald wave */}
            <motion.div
              animate={{ x: ['0%', '-50%'] }}
              transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
              className="absolute bottom-0 left-0 flex w-[200%] h-24"
            >
              {[0, 1].map((copy) => (
                <svg
                  key={`wave-a-${copy}`}
                  viewBox="0 0 1200 120"
                  preserveAspectRatio="none"
                  className="h-full w-1/2"
                >
                  <path
                    d="M0,64 C200,110 400,18 600,64 C800,110 1000,18 1200,64 L1200,120 L0,120 Z"
                    fill="rgba(54, 214, 126, 0.12)"
                  />
                  <path
                    d="M0,64 C200,110 400,18 600,64 C800,110 1000,18 1200,64"
                    fill="none"
                    stroke="rgba(82, 232, 150, 0.45)"
                    strokeWidth="2"
                  />
                </svg>
              ))}
            </motion.div>

            {/* Secondary counter-phase emerald wave */}
            <motion.div
              animate={{ x: ['-50%', '0%'] }}
              transition={{ duration: 13, repeat: Infinity, ease: 'linear' }}
              className="absolute bottom-0 left-0 flex w-[200%] h-20"
            >
              {[0, 1].map((copy) => (
                <svg
                  key={`wave-b-${copy}`}
                  viewBox="0 0 1200 120"
                  preserveAspectRatio="none"
                  className="h-full w-1/2"
                >
                  <path
                    d="M0,56 C240,12 480,104 720,56 C960,12 1080,88 1200,56 L1200,120 L0,120 Z"
                    fill="rgba(54, 214, 126, 0.08)"
                  />
                  <path
                    d="M0,56 C240,12 480,104 720,56 C960,12 1080,88 1200,56"
                    fill="none"
                    stroke="rgba(54, 214, 126, 0.35)"
                    strokeWidth="1.5"
                  />
                </svg>
              ))}
            </motion.div>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2.5 text-[#52e896] text-xs font-semibold uppercase tracking-[0.18em]">
              <motion.span
                animate={{ scale: [1, 1.18, 1] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                className="inline-flex"
              >
                <Code2 className="w-4 h-4" />
              </motion.span>
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
                      animate={{
                        y: [0, -5, 0],
                        borderColor: [
                          'rgba(35, 71, 52, 1)',
                          'rgba(82, 232, 150, 0.72)',
                          'rgba(35, 71, 52, 1)',
                        ],
                      }}
                      transition={{
                        duration: 2.6,
                        repeat: Infinity,
                        delay: itemIdx * 0.22,
                        ease: 'easeInOut',
                      }}
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
