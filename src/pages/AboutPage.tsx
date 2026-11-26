import { MouseEvent, useRef } from 'react';
import {
  ArrowRight,
  Briefcase,
  Download,
  GraduationCap,
  Terminal,
} from 'lucide-react';
import {
  MotionConfig,
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from 'motion/react';
import {
  CREDENTIALS_DATA,
  DetailSection,
  EXPERIENCES_DATA,
  PORTFOLIO_IDENTITY,
} from '../data/portfolioData';

interface AboutPageProps {
  onNavigate: (section: DetailSection) => void;
}

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];
const MARQUEE_SKILLS = ['HTML', 'CSS', 'JavaScript', 'Java', 'SQL', 'Python'];

export function AboutPage({ onNavigate }: AboutPageProps) {
  const heroCardRef = useRef<HTMLElement | null>(null);

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const spotX = useMotionValue(50);
  const spotY = useMotionValue(50);

  const springX = useSpring(pointerX, { stiffness: 180, damping: 24 });
  const springY = useSpring(pointerY, { stiffness: 180, damping: 24 });
  const springSpotX = useSpring(spotX, { stiffness: 200, damping: 28 });
  const springSpotY = useSpring(spotY, { stiffness: 200, damping: 28 });

  const rotateY = useTransform(springX, [-0.5, 0.5], [-2.8, 2.8]);
  const rotateX = useTransform(springY, [-0.5, 0.5], [2.8, -2.8]);
  const spotlightBg = useMotionTemplate`radial-gradient(380px circle at ${springSpotX}% ${springSpotY}%, rgba(54, 214, 126, 0.13), transparent 72%)`;

  const handleHeroMouseMove = (e: MouseEvent<HTMLElement>) => {
    const el = heroCardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    pointerX.set(nx - 0.5);
    pointerY.set(ny - 0.5);
    spotX.set(nx * 100);
    spotY.set(ny * 100);
  };

  const handleHeroMouseLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
    spotX.set(50);
    spotY.set(50);
  };

  const headingWords = ['About', 'Me'];

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto w-full max-w-5xl space-y-8 [perspective:1200px]">
        {/* 1. Hero Intro Card: 3D Tilt + Cursor Spotlight + Orbiting Portrait Rings + Masked Word Reveal */}
        <motion.section
          ref={heroCardRef}
          onMouseMove={handleHeroMouseMove}
          onMouseLeave={handleHeroMouseLeave}
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.52, ease: EASE_OUT_EXPO }}
          style={{
            rotateX,
            rotateY,
            transformStyle: 'preserve-3d',
          }}
          className="relative overflow-hidden rounded-2xl border border-[#1f3b2c] bg-[#07110c]/92 p-7 sm:p-10 shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
        >
          {/* Cursor-following emerald spotlight */}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ background: spotlightBg }}
          />

          <div className="relative flex flex-col md:flex-row md:items-center gap-8">
            {/* Portrait Block with Counter-Rotating Orbital Rings */}
            <motion.div
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.08, ease: EASE_OUT_EXPO }}
              className="relative shrink-0 flex flex-col items-center gap-2.5"
            >
              {/* Outer dashed orbital ring */}
              <motion.svg
                aria-hidden="true"
                viewBox="0 0 220 220"
                animate={{ rotate: 360 }}
                transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
                className="pointer-events-none absolute -inset-4 h-[calc(100%+1rem)] w-[calc(100%+2rem)] opacity-35"
              >
                <circle
                  cx="110"
                  cy="110"
                  r="98"
                  fill="none"
                  stroke="#36d67e"
                  strokeWidth="1"
                  strokeDasharray="6 10"
                />
              </motion.svg>

              <motion.div
                whileHover={{ y: -5, scale: 1.03 }}
                transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                className="group relative w-40 h-48 overflow-hidden"
              >
                <img
                  src={`${import.meta.env.BASE_URL}sayandeep_professional_pfp.jpg`}
                  alt={PORTFOLIO_IDENTITY.fullName}
                  className="w-full h-full object-cover object-[50%_28%] contrast-110 brightness-90 saturate-75 transition-transform duration-500 group-hover:scale-105"
                />
              </motion.div>
            </motion.div>

              {/* Word-by-word masked headline reveal */}
            <div className="flex-1 min-w-0 space-y-4">
              <h1 className="flex flex-wrap gap-x-3 text-3xl sm:text-5xl font-semibold tracking-[-0.03em] text-white leading-tight">
                {headingWords.map((word, idx) => (
                  <span key={word} className="inline-block overflow-hidden">
                    <motion.span
                      className="inline-block"
                      initial={{ y: '115%', opacity: 0 }}
                      animate={{ y: '0%', opacity: 1 }}
                      transition={{
                        duration: 0.55,
                        delay: 0.12 + idx * 0.09,
                        ease: EASE_OUT_EXPO,
                      }}
                    >
                      {word}
                    </motion.span>
                  </span>
                ))}
              </h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.34, ease: EASE_OUT_EXPO }}
                className="text-base sm:text-lg text-[#dce8e1] leading-relaxed"
              >
                Hi, I'm Sayan Deep Roy, a Computer Science graduate from Acharya Institute of Technology with a strong interest in frontend web development. I have knowledge of HTML, CSS, JavaScript, React.js, Core Java, and SQL. I have worked on projects like a React-based Book Review Platform and a full-stack Carbon Footprint Tracker using React and Django. I'm passionate about learning new technologies, solving problems, and building user-friendly web applications.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.42, ease: EASE_OUT_EXPO }}
                className="flex flex-wrap items-center gap-4 pt-2"
              >
                <motion.a
                  href={PORTFOLIO_IDENTITY.resumeUrl}
                  download="Sayan_Deep_Roy_Resume.pdf"
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#36d67e] px-4 py-2.5 text-sm font-semibold text-[#031109] hover:bg-[#52e896] transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Resume PDF
                </motion.a>
                <motion.button
                  type="button"
                  onClick={() => onNavigate('portfolio')}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  className="group inline-flex items-center gap-2 rounded-lg border border-[#2a4d3a] bg-[#0b1b13] px-4 py-2.5 text-sm font-semibold text-white hover:border-[#36d67e] hover:text-[#52e896] transition-colors cursor-pointer"
                >
                  View Portfolio
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </motion.button>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* 2. Continuous Horizontal Tech Stack Marquee */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          aria-label="Core technical stack"
          className="relative overflow-hidden rounded-xl border border-[#1f3b2c] bg-[#07110c]/85 py-3.5"
        >
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#07110c] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#07110c] to-transparent" />
          <motion.div
            className="flex w-max items-center gap-6 whitespace-nowrap"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          >
            {[
              ...MARQUEE_SKILLS,
              ...MARQUEE_SKILLS,
            ].map((skill, idx) => (
              <div
                key={`${skill}-${idx}`}
                className="flex items-center gap-6 text-xs sm:text-sm font-semibold tracking-wide text-[#dce8e1]"
              >
                <span className="inline-flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-[#52e896]" />
                  {skill}
                </span>
                <span className="h-1 w-1 rounded-full bg-[#36d67e]/60" />
              </div>
            ))}
          </motion.div>
        </motion.section>

        {/* 3. Experience (Animated Timeline + Live Beacon) & Education (3D Flip-In) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.48, ease: EASE_OUT_EXPO }}
            className="rounded-2xl border border-[#1f3b2c] bg-[#07110c]/92 p-7"
          >
            <div className="flex items-center gap-2.5 text-[#52e896] text-xs font-semibold uppercase tracking-[0.18em] mb-5">
              <Briefcase className="w-4 h-4" />
              Experience &amp; Training
            </div>

            <div className="relative pl-5 space-y-6">
              <motion.span
                aria-hidden="true"
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.75, ease: EASE_OUT_EXPO }}
                style={{ originY: 0 }}
                className="absolute left-[5px] top-2 bottom-2 w-px bg-gradient-to-b from-[#36d67e] to-[#214531]"
              />

              {EXPERIENCES_DATA.map((exp, idx) => (
                <motion.div
                  key={exp.organization}
                  initial={{ opacity: 0, x: -18 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: 0.48,
                    delay: idx * 0.14,
                    ease: EASE_OUT_EXPO,
                  }}
                  className="relative"
                >
                  <motion.span
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      type: 'spring',
                      stiffness: 340,
                      damping: 18,
                      delay: idx * 0.14 + 0.1,
                    }}
                    className="absolute -left-5 top-1.5 h-2.5 w-2.5 rounded-full bg-[#36d67e] ring-4 ring-[#07110c]"
                  />

                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-base font-semibold text-white">
                      {exp.organization}
                    </h3>
                    <span className="text-xs font-semibold text-[#52e896]">
                      {exp.period}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-white/90 mt-0.5">
                    {exp.role} · {exp.location}
                  </p>
                  <p className="text-sm text-[#dce8e1] mt-2 leading-relaxed">
                    {exp.detail}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, rotateX: -18, y: 22 }}
            whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.55, delay: 0.08, ease: EASE_OUT_EXPO }}
            style={{ transformPerspective: 900 }}
            className="rounded-2xl border border-[#1f3b2c] bg-[#07110c]/92 p-7"
          >
            <div className="flex items-center gap-2.5 text-[#52e896] text-xs font-semibold uppercase tracking-[0.18em] mb-5">
              <GraduationCap className="w-4 h-4" />
              Education &amp; Extracurricular
            </div>

            <div className="space-y-4">
              {CREDENTIALS_DATA.education.map((line, idx) => (
                <motion.div
                  key={line}
                  initial={{ opacity: 0, rotateX: -25, y: 12 }}
                  whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: 0.45,
                    delay: idx * 0.1,
                    ease: EASE_OUT_EXPO,
                  }}
                  whileHover={{ x: 6, color: '#ffffff' }}
                  className="border-t border-white/12 pt-3.5 first:border-t-0 first:pt-0 text-sm text-[#dce8e1] leading-relaxed transition-colors"
                >
                  {line}
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: 0.28, ease: EASE_OUT_EXPO }}
                whileHover={{ borderColor: 'rgba(54, 214, 126, 0.55)' }}
                className="mt-2 rounded-xl border border-[#234734] bg-[#0b1b13] p-4 transition-colors"
              >
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#52e896] mb-1">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#36d67e]" />
                  Hackathon Activity
                </div>
                <p className="text-sm text-white font-medium">
                  {CREDENTIALS_DATA.extracurricular}
                </p>
              </motion.div>
            </div>
          </motion.section>
        </div>
      </div>
    </MotionConfig>
  );
}
