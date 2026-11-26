import { ArrowRight, CheckCircle2, Download, ExternalLink, FolderGit2 } from 'lucide-react';
import { MotionConfig, motion } from 'motion/react';
import {
  DetailSection,
  PORTFOLIO_IDENTITY,
  PROJECTS_DATA,
} from '../data/portfolioData';

interface PortfolioPageProps {
  onNavigate: (section: DetailSection) => void;
}

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function PortfolioPage({ onNavigate }: PortfolioPageProps) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
        className="mx-auto w-full max-w-5xl space-y-8 [perspective:1200px]"
      >
        {/* Header */}
        <motion.section
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 5.6, repeat: Infinity, ease: 'easeInOut' }}
          className="relative overflow-hidden rounded-2xl border border-[#1f3b2c] bg-[#07110c]/92 p-7 sm:p-10 shadow-[0_18px_45px_rgba(0,0,0,0.45)]"
        >
          <motion.span
            aria-hidden="true"
            animate={{ y: [0, -10, 0], x: [0, 8, 0], opacity: [0.16, 0.34, 0.16] }}
            transition={{ duration: 6.4, repeat: Infinity, ease: 'easeInOut' }}
            className="pointer-events-none -top-12 right-12 absolute h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(82,232,150,0.22),transparent_70%)]"
          />

          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#52e896] mb-3">
                Portfolio · Selected Work
              </p>
              <h1 className="text-3xl sm:text-5xl font-semibold tracking-[-0.03em] text-white mb-3">
                Built &amp; Shipped Projects.
              </h1>
              <p className="text-base text-[#dce8e1] max-w-2xl leading-relaxed">
                Full-stack web applications, modular React interfaces, and Python data visualization tools crafted for real-world usability.
              </p>
            </div>

            <motion.a
              href={PORTFOLIO_IDENTITY.github}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ y: -3, scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 rounded-lg border border-[#2a4d3a] bg-[#0b1b13] px-4 py-2.5 text-sm font-semibold text-white hover:border-[#36d67e] hover:text-[#52e896] transition-colors shrink-0"
            >
              <FolderGit2 className="w-4 h-4" />
              GitHub Profile
              <ExternalLink className="w-3.5 h-3.5" />
            </motion.a>
          </div>
        </motion.section>

        {/* Project Cards with staggered floating animation */}
        <section className="grid grid-cols-1 gap-6">
          {PROJECTS_DATA.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.5, delay: index * 0.08, ease: EASE_OUT_EXPO }}
            >
              <motion.article
                animate={{
                  y: [0, -7, 0],
                  rotateX: [0, 0.9, 0],
                }}
                transition={{
                  duration: 4.8 + index * 0.55,
                  repeat: Infinity,
                  delay: index * 0.45,
                  ease: 'easeInOut',
                }}
                whileHover={{
                  y: -10,
                  scale: 1.01,
                  borderColor: 'rgba(54, 214, 126, 0.65)',
                }}
                style={{ transformPerspective: 1200 }}
                className="relative overflow-hidden rounded-2xl border border-[#1f3b2c] bg-[#07110c]/92 p-7 sm:p-9 transition-colors shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
              >
                <motion.span
                  aria-hidden="true"
                  animate={{
                    y: [0, 10, 0],
                    x: [0, -10, 0],
                    opacity: [0.12, 0.28, 0.12],
                  }}
                  transition={{
                    duration: 5.5 + index * 0.5,
                    repeat: Infinity,
                    delay: index * 0.4,
                    ease: 'easeInOut',
                  }}
                  className="pointer-events-none absolute -bottom-12 -right-8 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(54,214,126,0.18),transparent_72%)]"
                />

                <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#52e896]">
                        0{index + 1} · {project.category}
                      </span>
                    </div>
                    <h2 className="text-2xl font-semibold text-white">
                      {project.title}
                    </h2>
                    <p className="text-sm font-medium text-[#98d8b5] mt-1">
                      {project.stack}
                    </p>
                  </div>

                  <motion.a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ y: -2, scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#2a4d3a] bg-[#0c1d14] px-4 py-2 text-sm font-semibold text-[#52e896] hover:bg-[#36d67e] hover:text-[#031109] transition-colors shrink-0 self-start"
                  >
                    View on GitHub
                    <ExternalLink className="w-4 h-4" />
                  </motion.a>
                </div>

                <p className="relative z-10 text-base text-[#dce8e1] leading-relaxed mb-5">
                  {project.summary}
                </p>

                <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-white/12">
                  {project.highlights.map((highlight, hIdx) => (
                    <div
                      key={highlight}
                      className="flex items-start gap-2.5 text-sm text-white/90"
                    >
                      <motion.span
                        animate={{ y: [0, -2.5, 0] }}
                        transition={{
                          duration: 2.8,
                          repeat: Infinity,
                          delay: hIdx * 0.25 + index * 0.2,
                          ease: 'easeInOut',
                        }}
                        className="inline-flex shrink-0 mt-0.5"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#52e896]" />
                      </motion.span>
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>
              </motion.article>
            </motion.div>
          ))}
        </section>

        {/* Bottom CTA */}
        <motion.section
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 5.2, repeat: Infinity, delay: 0.35, ease: 'easeInOut' }}
          className="rounded-2xl border border-[#1f3b2c] bg-[#07110c]/92 p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_18px_45px_rgba(0,0,0,0.45)]"
        >
          <div>
            <h3 className="text-lg font-semibold text-white">
              Interested in working together?
            </h3>
            <p className="text-sm text-[#dce8e1] mt-1">
              Download the full CV or reach out directly for engineering roles and collaborations.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <motion.a
              href={PORTFOLIO_IDENTITY.resumeUrl}
              download="Sayan_Deep_Roy_Resume.pdf"
              whileHover={{ y: -2, scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 rounded-lg border border-[#2a4d3a] bg-[#0b1b13] px-4 py-2.5 text-sm font-semibold text-white hover:border-[#36d67e] transition-colors"
            >
              <Download className="w-4 h-4" />
              Resume PDF
            </motion.a>
            <motion.button
              type="button"
              onClick={() => onNavigate('contact')}
              whileHover={{ y: -2, scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 rounded-lg bg-[#36d67e] px-4 py-2.5 text-sm font-semibold text-[#031109] hover:bg-[#52e896] transition-colors cursor-pointer"
            >
              Contact Me
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.section>
      </motion.div>
    </MotionConfig>
  );
}
