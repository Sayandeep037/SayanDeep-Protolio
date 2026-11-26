import { FormEvent, MouseEvent, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Send,
} from 'lucide-react';
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
} from 'motion/react';
import { PORTFOLIO_IDENTITY } from '../data/portfolioData';

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];
const WEB3FORMS_ACCESS_KEY = '6cf1d74e-5a39-4b73-91a8-b8b4dafb5324';

export function ContactPage() {
  const infoCardRef = useRef<HTMLElement | null>(null);
  const formCardRef = useRef<HTMLElement | null>(null);
  const [name, setName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState('');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'submitting' | 'success' | 'error'
  >('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const infoSpotX = useMotionValue(50);
  const infoSpotY = useMotionValue(50);
  const infoSpringX = useSpring(infoSpotX, { stiffness: 200, damping: 28 });
  const infoSpringY = useSpring(infoSpotY, { stiffness: 200, damping: 28 });
  const infoSpotlight = useMotionTemplate`radial-gradient(280px circle at ${infoSpringX}% ${infoSpringY}%, rgba(54, 214, 126, 0.14), transparent 72%)`;

  const formSpotX = useMotionValue(50);
  const formSpotY = useMotionValue(50);
  const formSpringX = useSpring(formSpotX, { stiffness: 200, damping: 28 });
  const formSpringY = useSpring(formSpotY, { stiffness: 200, damping: 28 });
  const formSpotlight = useMotionTemplate`radial-gradient(340px circle at ${formSpringX}% ${formSpringY}%, rgba(54, 214, 126, 0.12), transparent 72%)`;

  const handleCardSpot = (
    e: MouseEvent<HTMLElement>,
    ref: { current: HTMLElement | null },
    xVal: ReturnType<typeof useMotionValue<number>>,
    yVal: ReturnType<typeof useMotionValue<number>>
  ) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    xVal.set(((e.clientX - rect.left) / rect.width) * 100);
    yVal.set(((e.clientY - rect.top) / rect.height) * 100);
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(PORTFOLIO_IDENTITY.email);
      setCopiedEmail(true);
      window.setTimeout(() => setCopiedEmail(false), 2000);
    } catch {
      // Clipboard blocked in restricted contexts
    }
  };

  const buildMailtoHref = () => {
    const mailSubject = encodeURIComponent(
      subject.trim() || `Portfolio Inquiry from ${name.trim() || 'Visitor'}`
    );
    const bodyLines = [
      name.trim() ? `From: ${name.trim()}` : '',
      senderEmail.trim() ? `Reply-To: ${senderEmail.trim()}` : '',
      '',
      message.trim(),
    ]
      .filter(Boolean)
      .join('\n');
    return `mailto:${PORTFOLIO_IDENTITY.email}?subject=${mailSubject}&body=${encodeURIComponent(bodyLines)}`;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitStatus === 'submitting') return;

    setSubmitStatus('submitting');
    setStatusMessage('');

    const resolvedSubject =
      subject.trim() || `Portfolio Message from ${name.trim() || 'Visitor'}`;

    try {
      const formData = new FormData();
      formData.set('access_key', WEB3FORMS_ACCESS_KEY);
      formData.set('name', name.trim());
      formData.set('email', senderEmail.trim());
      formData.set('replyto', senderEmail.trim());
      formData.set('from_name', name.trim());
      formData.set('subject', resolvedSubject);
      formData.set('message', message.trim());
      formData.set('botcheck', website);

      const apiResponse = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(10000),
      });

      const apiData = (await apiResponse.json().catch(() => ({}))) as {
        success?: boolean;
        message?: string;
      };

      if (apiResponse.ok && apiData.success) {
        setSubmitStatus('success');
        setStatusMessage(`Your message was sent to ${PORTFOLIO_IDENTITY.email}.`);
        setName('');
        setSenderEmail('');
        setSubject('');
        setMessage('');
        setWebsite('');
        return;
      }

      setSubmitStatus('error');
      setStatusMessage(
        apiData.message ||
          'Web3Forms could not send your message. Please try again or use the email link.'
      );
    } catch {
      setSubmitStatus('error');
      setStatusMessage(
        'Unable to reach the mail service right now. Please use the email app link below.'
      );
    }
  };

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
        className="relative overflow-hidden rounded-2xl border border-[#1f3b2c] bg-[#07110c]/92 p-7 sm:p-10 shadow-[0_18px_45px_rgba(0,0,0,0.45)]"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-12 right-12 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(82,232,150,0.22),transparent_70%)]"
        />
        <p className="relative z-10 text-xs font-semibold uppercase tracking-[0.2em] text-[#52e896] mb-3">
          Contact
        </p>
        <h1 className="relative z-10 text-3xl sm:text-5xl font-semibold tracking-[-0.03em] text-white mb-4">
          Let&apos;s Connect.
        </h1>
        <p className="relative z-10 text-base sm:text-lg text-[#dce8e1] max-w-2xl leading-relaxed">
          Open to full-stack development roles, Java and Python engineering opportunities, and technical collaborations.
        </p>
      </motion.section>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Direct Channels */}
        <motion.div
          className="lg:col-span-2"
        >
          <motion.section
            ref={infoCardRef}
            onMouseMove={(e) => handleCardSpot(e, infoCardRef, infoSpotX, infoSpotY)}
            onMouseLeave={() => {
              infoSpotX.set(50);
              infoSpotY.set(50);
            }}
            initial={{ opacity: 0, x: -28, rotateY: 6 }}
            whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
            whileHover={{ borderColor: 'rgba(54, 214, 126, 0.55)' }}
            style={{ transformPerspective: 1000 }}
            className="relative h-full overflow-hidden rounded-2xl border border-[#1f3b2c] bg-[#07110c]/92 p-7 space-y-6 transition-colors shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
          >
            {/* Interactive emerald cursor spotlight */}
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{ background: infoSpotlight }}
            />

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1, ease: EASE_OUT_EXPO }}
            whileHover={{ x: 4 }}
            className="relative z-10"
          >
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#52e896] mb-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 rounded-full bg-[#36d67e]/45" />
                <span className="relative h-2 w-2 rounded-full bg-[#36d67e]" />
              </span>
              Email
            </div>
            <div className="flex items-center justify-between gap-2">
              <a
                href={`mailto:${PORTFOLIO_IDENTITY.email}`}
                className="inline-flex items-center gap-2 text-sm sm:text-base font-semibold text-white hover:text-[#52e896] transition-colors break-all"
              >
                <span className="inline-flex">
                  <Mail className="w-4 h-4 text-[#52e896] shrink-0" />
                </span>
                {PORTFOLIO_IDENTITY.email}
              </a>
              <motion.button
                type="button"
                onClick={handleCopyEmail}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                aria-label="Copy email address"
                className="rounded-lg border border-[#234734] bg-[#0c1d14] p-2 text-white/80 hover:border-[#36d67e] hover:text-[#52e896] transition-colors cursor-pointer shrink-0"
              >
                {copiedEmail ? (
                  <Check className="w-4 h-4 text-[#52e896]" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </motion.button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.18, ease: EASE_OUT_EXPO }}
            whileHover={{ x: 4 }}
            className="relative z-10 border-t border-white/12 pt-5"
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-[#52e896] mb-2">
              Phone
            </div>
            <a
              href={`tel:${PORTFOLIO_IDENTITY.phone.replace(/\s+/g, '')}`}
              className="inline-flex items-center gap-2 text-sm sm:text-base font-semibold text-white hover:text-[#52e896] transition-colors"
            >
              <span className="inline-flex">
                <Phone className="w-4 h-4 text-[#52e896] shrink-0" />
              </span>
              {PORTFOLIO_IDENTITY.phone}
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.26, ease: EASE_OUT_EXPO }}
            whileHover={{ x: 4 }}
            className="relative z-10 border-t border-white/12 pt-5"
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-[#52e896] mb-2">
              Location
            </div>
            <div className="inline-flex items-center gap-2 text-sm sm:text-base font-medium text-[#dce8e1]">
              <span className="inline-flex">
                <MapPin className="w-4 h-4 text-[#52e896] shrink-0" />
              </span>
              Bangalore, Karnataka
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.34, ease: EASE_OUT_EXPO }}
            className="relative z-10 border-t border-white/12 pt-5 space-y-3"
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-[#52e896]">
              Links &amp; Resume
            </div>
            <div className="flex flex-wrap gap-3">
              <motion.a
                href={PORTFOLIO_IDENTITY.github}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -2, scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#234734] bg-[#0c1d14] px-3.5 py-2 text-sm font-semibold text-white hover:border-[#36d67e] hover:text-[#52e896] transition-colors"
              >
                GitHub
                <ExternalLink className="w-3.5 h-3.5" />
              </motion.a>
              <motion.a
                href={PORTFOLIO_IDENTITY.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -2, scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#234734] bg-[#0c1d14] px-3.5 py-2 text-sm font-semibold text-white hover:border-[#36d67e] hover:text-[#52e896] transition-colors"
              >
                LinkedIn
                <ExternalLink className="w-3.5 h-3.5" />
              </motion.a>
              <motion.a
                href={PORTFOLIO_IDENTITY.resumeUrl}
                download="Sayan_Deep_Roy_Resume.pdf"
                whileHover={{ y: -2, scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="relative overflow-hidden inline-flex items-center gap-1.5 rounded-lg bg-[#36d67e] px-3.5 py-2 text-sm font-semibold text-[#031109] hover:bg-[#52e896] transition-colors"
              >
                <Download className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Resume PDF</span>
              </motion.a>
            </div>
          </motion.div>
          </motion.section>
        </motion.div>

        {/* Direct Message Form */}
        <motion.div
          className="lg:col-span-3"
        >
          <motion.section
            ref={formCardRef}
            onMouseMove={(e) => handleCardSpot(e, formCardRef, formSpotX, formSpotY)}
            onMouseLeave={() => {
              formSpotX.set(50);
              formSpotY.set(50);
            }}
            initial={{ opacity: 0, x: 28, rotateY: -6 }}
            whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.55, delay: 0.08, ease: EASE_OUT_EXPO }}
            whileHover={{ borderColor: 'rgba(54, 214, 126, 0.55)' }}
            style={{ transformPerspective: 1000 }}
            className="relative h-full overflow-hidden rounded-2xl border border-[#1f3b2c] bg-[#07110c]/92 p-7 transition-colors shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
          >
          {/* Interactive emerald cursor spotlight */}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ background: formSpotlight }}
          />

          {/* Top-edge gliding emerald beam */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-0 h-[2px] w-40 bg-gradient-to-r from-transparent via-[#52e896] to-transparent shadow-[0_0_14px_rgba(54,214,126,0.85)]"
          />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.12, ease: EASE_OUT_EXPO }}
            className="relative z-10"
          >
            <div className="flex items-center gap-2.5 mb-2">
              <h2 className="text-xl font-semibold text-white">
                Send a Message
              </h2>
              <span className="h-2 w-2 rounded-full bg-[#36d67e]" />
            </div>
            <p className="text-sm text-[#dce8e1] mb-6">
              Submit your message below to send it directly to {PORTFOLIO_IDENTITY.email}.
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
            <input
              type="text"
              name="botcheck"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.18, ease: EASE_OUT_EXPO }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <div className="relative">
                <label
                  htmlFor="contact-name"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#52e896] mb-1.5"
                >
                  Your Name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  value={name}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Sharma"
                  className="w-full rounded-lg border border-[#234734] bg-[#0a1710] px-3.5 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-[#36d67e] focus:outline-none transition-colors"
                />
                <motion.span
                  aria-hidden="true"
                  animate={{ scaleX: focusedField === 'name' ? 1 : 0 }}
                  transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
                  className="pointer-events-none absolute bottom-0 inset-x-2 h-[2px] rounded-full bg-[#52e896]"
                />
              </div>
              <div className="relative">
                <label
                  htmlFor="contact-email"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#52e896] mb-1.5"
                >
                  Your Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={senderEmail}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-[#234734] bg-[#0a1710] px-3.5 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-[#36d67e] focus:outline-none transition-colors"
                />
                <motion.span
                  aria-hidden="true"
                  animate={{ scaleX: focusedField === 'email' ? 1 : 0 }}
                  transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
                  className="pointer-events-none absolute bottom-0 inset-x-2 h-[2px] rounded-full bg-[#52e896]"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.24, ease: EASE_OUT_EXPO }}
              className="relative"
            >
              <label
                htmlFor="contact-subject"
                className="block text-xs font-semibold uppercase tracking-wider text-[#52e896] mb-1.5"
              >
                Subject
              </label>
              <input
                id="contact-subject"
                type="text"
                value={subject}
                onFocus={() => setFocusedField('subject')}
                onBlur={() => setFocusedField(null)}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Full-Stack Developer Opportunity"
                className="w-full rounded-lg border border-[#234734] bg-[#0a1710] px-3.5 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-[#36d67e] focus:outline-none transition-colors"
              />
              <motion.span
                aria-hidden="true"
                animate={{ scaleX: focusedField === 'subject' ? 1 : 0 }}
                transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
                className="pointer-events-none absolute bottom-0 inset-x-2 h-[2px] rounded-full bg-[#52e896]"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3, ease: EASE_OUT_EXPO }}
              className="relative"
            >
              <label
                htmlFor="contact-message"
                className="block text-xs font-semibold uppercase tracking-wider text-[#52e896] mb-1.5"
              >
                Message
              </label>
              <textarea
                id="contact-message"
                rows={4}
                required
                value={message}
                onFocus={() => setFocusedField('message')}
                onBlur={() => setFocusedField(null)}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share details about your team, role, or project..."
                className="w-full rounded-lg border border-[#234734] bg-[#0a1710] px-3.5 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-[#36d67e] focus:outline-none resize-none transition-colors"
              />
              <motion.span
                aria-hidden="true"
                animate={{ scaleX: focusedField === 'message' ? 1 : 0 }}
                transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
                className="pointer-events-none absolute bottom-1 inset-x-2 h-[2px] rounded-full bg-[#52e896]"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.36, ease: EASE_OUT_EXPO }}
              className="flex flex-wrap items-center justify-between gap-4 pt-2"
            >
              <motion.button
                type="submit"
                disabled={submitStatus === 'submitting'}
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                className="relative overflow-hidden group inline-flex items-center gap-2 rounded-lg bg-[#36d67e] px-5 py-2.5 text-sm font-semibold text-[#031109] hover:bg-[#52e896] disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {submitStatus === 'submitting' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin relative z-10" />
                    <span className="relative z-10">Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 relative z-10 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    <span className="relative z-10">Submit</span>
                  </>
                )}
              </motion.button>
            </motion.div>

            <AnimatePresence mode="wait">
              {submitStatus === 'success' && (
                <motion.div
                  key="contact-success"
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
                  className="flex items-start gap-2.5 rounded-xl border border-[#36d67e]/50 bg-[#0d2418] px-4 py-3 text-xs sm:text-sm font-medium text-[#52e896]"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{statusMessage}</span>
                </motion.div>
              )}

              {submitStatus === 'error' && (
                <motion.div
                  key="contact-error"
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-400/35 bg-amber-950/35 px-4 py-3 text-xs sm:text-sm text-amber-200"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-300" />
                    <span>{statusMessage}</span>
                  </div>
                  <a
                    href={buildMailtoHref()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300/40 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-400/15 shrink-0"
                  >
                    Open Email App
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
          </motion.section>
        </motion.div>
      </div>
      </motion.div>
    </MotionConfig>
  );
}
