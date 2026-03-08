'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Users, WifiOff, Globe, Github } from 'lucide-react'

const fade = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
}

const stagger = {
  show: { transition: { staggerChildren: 0.08 } },
}

export default function Landing() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>

      {/* Nav */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8 py-4 border-b"
        style={{ borderColor: 'var(--border)', background: 'rgba(250,250,248,0.85)', backdropFilter: 'blur(12px)' }}
      >
        <span className="font-serif italic text-3xl tracking-tight">texty</span>
        <Link
          href="/app"
          className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-md transition-opacity hover:opacity-80"
          style={{ background: 'var(--fg)', color: 'var(--bg)' }}
        >
          Start writing <ArrowRight size={14} />
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden flex flex-col items-center justify-center text-center min-h-screen px-5 pt-20">
        <div className="dot-grid absolute inset-0 opacity-50" />
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 70% 55% at 50% 50%, rgba(250,250,248,0.1) 0%, var(--bg) 72%)' }}
        />

        <motion.div
          className="relative z-10 w-full max-w-2xl mx-auto"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          <motion.div
            variants={fade}
            className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border mb-8"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)', background: 'var(--surface)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Free · No account · Open source
          </motion.div>

          <motion.h1
            variants={fade}
            className="font-serif text-5xl sm:text-6xl md:text-7xl leading-[1.05] tracking-tight mb-6"
          >
            Write together.<br />
            <em className="not-italic" style={{ color: 'var(--muted)' }}>Publish. Done.</em>
          </motion.h1>

          <motion.p
            variants={fade}
            className="text-base sm:text-lg md:text-xl leading-relaxed mb-10 max-w-lg mx-auto"
            style={{ color: 'var(--muted)' }}
          >
            Open a doc, invite anyone with a join code, write together in real time, and publish to a public link. No sign-up, ever.
          </motion.p>

          <motion.div variants={fade} className="flex items-center justify-center">
            <Link
              href="/app"
              className="flex items-center gap-2 px-7 py-3.5 rounded-md text-base font-medium transition-opacity hover:opacity-85"
              style={{ background: 'var(--fg)', color: 'var(--bg)' }}
            >
              Start writing — it&apos;s free <ArrowRight size={15} />
            </Link>
          </motion.div>

          <motion.p
            variants={fade}
            className="text-xs mt-5"
            style={{ color: 'var(--muted)' }}
          >
            No account. No setup. Open and write.
          </motion.p>
        </motion.div>
      </section>

      {/* Features */}
      <section className="px-5 py-20 md:py-24 max-w-4xl mx-auto w-full">
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
        >
          {[
            {
              icon: <Globe size={18} />,
              title: 'Publish with one click',
              desc: 'Hit publish and your doc gets a public link. Anyone can read it — no account, no app, just a URL.',
            },
            {
              icon: <Users size={18} />,
              title: 'Write with anyone',
              desc: 'Share a join code and anyone can jump in. You see each other\'s cursor as you type — like being in the same room.',
            },
            {
              icon: <WifiOff size={18} />,
              title: 'Works without internet',
              desc: 'Lost your connection? Keep writing. Everything saves and syncs back the moment you\'re online again.',
            },
          ].map((f) => (
            <motion.div
              key={f.title}
              variants={fade}
              className="p-6 rounded-xl border"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center mb-5 border"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
              >
                {f.icon}
              </div>
              <h3 className="text-sm font-semibold mb-2">{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How it works */}
      <section className="px-5 pb-20 md:pb-24 max-w-xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-10 text-center" style={{ color: 'var(--muted)' }}>
            How it works
          </p>
          <div className="space-y-8">
            {[
              { n: '1', title: 'Open a doc', desc: 'Give it a name. You get a join code — share it with whoever you\'re writing with.' },
              { n: '2', title: 'Write together', desc: 'Everyone with the join code can type at the same time. You see each other\'s cursors live.' },
              { n: '3', title: 'Publish and forget', desc: 'One click. Your doc gets a public link. Send it, close the tab. It\'s out there forever.' },
            ].map((s) => (
              <div key={s.n} className="flex gap-5 items-start">
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5"
                  style={{ background: 'var(--fg)', color: 'var(--bg)' }}
                >
                  {s.n}
                </span>
                <div>
                  <h3 className="text-sm font-semibold mb-1">{s.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Join code = edit key callout */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-12 p-5 rounded-xl border"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
          >
            <p className="text-sm font-semibold mb-2" style={{ color: 'var(--fg)' }}>Your join code is your edit key.</p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              texty has no accounts. When you create a doc, you get a join code.
              That code is the only way to come back and edit it later — from any device, any browser.
              Keep it safe. Lose it, and your doc is published as-is forever.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* CTA Banner */}
      <section className="mx-4 md:mx-6 mb-16">
        <motion.div
          className="rounded-2xl border relative overflow-hidden"
          style={{ borderColor: 'var(--border)' }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="dot-grid absolute inset-0 opacity-30" />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, rgba(250,250,248,0.5) 0%, rgba(250,250,248,0.96) 100%)' }}
          />
          <div className="relative z-10 flex flex-col items-center text-center gap-5 px-6 md:px-10 py-12 md:py-14">
            <h2 className="font-serif text-3xl md:text-4xl">Open a doc. Write. Publish.</h2>
            <p className="text-sm max-w-sm" style={{ color: 'var(--muted)' }}>
              No account. No setup. Just a doc, a join code, and a publish button.
            </p>
            <Link
              href="/app"
              className="flex items-center gap-2 px-7 py-3.5 rounded-md text-sm font-medium transition-opacity hover:opacity-85"
              style={{ background: 'var(--fg)', color: 'var(--bg)' }}
            >
              Start writing — it&apos;s free <ArrowRight size={14} />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer
        className="border-t px-5 md:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs"
        style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
      >
        <span className="font-serif italic text-lg" style={{ color: 'var(--fg)' }}>texty</span>
        <p className="text-center">
          Built by{' '}
          <a
            href="https://x.com/SarvaiyaGitesh"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 transition-colors"
            style={{ color: 'var(--fg)' }}
          >
            @SarvaiyaGitesh
          </a>
          {' '}· A weekend project · Free & open source
        </p>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/giteshsarvaiya/crdt-rooms"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:opacity-70"
          >
            Built with livetexts
          </a>
          <a
            href="https://github.com/giteshsarvaiya/crdt-rooms"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 transition-colors hover:opacity-70"
          >
            <Github size={12} /> View on GitHub
          </a>
        </div>
      </footer>
    </div>
  )
}
