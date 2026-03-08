"use client";

import React, { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Globe,
  GlobeLock,
  Loader2,
  Check,
  X,
  ExternalLink,
  UserPlus,
  Link2,
  MoreHorizontal,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { trackEvent } from "@/lib/analytics";
import { RoomProvider } from "@/lib/RoomContext";
import { Editor } from "@/components/Editor";
import { UserList } from "@/components/UserList";
import { useStatus, useAwarenessUsers } from "@/lib/hooks";

function getUserId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem("texty-userId");
  if (!id) {
    const bytes = crypto.getRandomValues(new Uint8Array(12));
    id = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    sessionStorage.setItem("texty-userId", id);
  }
  return id;
}


function AvatarStack({ onToggle }: { onToggle: () => void }) {
  const users = useAwarenessUsers();

  function renderAvatars(visible: typeof users, overflow: number) {
    return (
      <div className="flex -space-x-2">
        {visible.map((u) => (
          <button
            key={u.clientId}
            onClick={onToggle}
            title={u.name}
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold border-2 transition-transform hover:scale-110 hover:z-10 relative"
            style={{ backgroundColor: u.color, borderColor: "var(--bg)" }}
          >
            {(u.name[0] || "?").toUpperCase()}
          </button>
        ))}
        {overflow > 0 && (
          <button
            onClick={onToggle}
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2"
            style={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--bg)",
              color: "var(--muted)",
            }}
          >
            +{overflow}
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="flex md:hidden">
        {renderAvatars(users.slice(0, 2), Math.max(0, users.length - 2))}
      </div>
      <div className="hidden md:flex">
        {renderAvatars(users.slice(0, 5), Math.max(0, users.length - 5))}
      </div>
    </>
  );
}

function InviteModal({
  docId,
  joinCode,
  onClose,
}: {
  docId: string;
  joinCode: string;
  onClose: () => void;
}) {
  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/app?doc=${docId}&code=${joinCode}`
      : "";
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm rounded-xl border p-5"
        style={{ background: "var(--bg)", borderColor: "var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 hover:opacity-60 transition-opacity"
          style={{ color: "var(--muted)" }}
        >
          <X size={15} />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <UserPlus size={16} style={{ color: "var(--fg)" }} />
          <h2 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
            Invite to collaborate
          </h2>
        </div>
        <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
          Share this link with anyone you want to write together with.
          They&apos;ll join directly with edit access.
        </p>

        <input
          readOnly
          value={inviteUrl}
          className="w-full text-xs px-3 py-2 rounded-lg border font-mono mb-3 truncate"
          style={{
            borderColor: "var(--border)",
            background: "var(--surface)",
            color: "var(--fg)",
          }}
          onFocus={(e) => e.target.select()}
        />

        <button
          onClick={copy}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all"
          style={
            copied
              ? { background: "#22c55e", color: "#fff" }
              : { background: "var(--fg)", color: "var(--bg)" }
          }
        >
          <AnimatePresence mode="wait" initial={false}>
            {copied ? (
              <motion.span
                key="check"
                className="flex items-center gap-2"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
              >
                <Check size={14} /> Copied!
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                className="flex items-center gap-2"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
              >
                <Link2 size={14} /> Copy invite link
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </motion.div>
    </div>
  );
}

const modalMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 16 },
  transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const },
};

function ModalShell({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      <motion.div
        {...modalMotion}
        className="relative w-full max-w-sm rounded-xl border p-5"
        style={{ background: "var(--bg)", borderColor: "var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 hover:opacity-60 transition-opacity"
          style={{ color: "var(--muted)" }}
        >
          <X size={15} />
        </button>
        {children}
      </motion.div>
    </div>
  );
}

function PublishModal({
  publicUrl,
  loading,
  onConfirm,
  onClose,
}: {
  publicUrl: string;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-center gap-2 mb-1">
        <Globe size={16} style={{ color: "var(--fg)" }} />
        <h2 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
          Publish this document?
        </h2>
      </div>
      <p className="text-xs leading-relaxed mb-1" style={{ color: "var(--muted)" }}>
        Your document will be publicly accessible at:
      </p>
      <p
        className="text-xs font-mono truncate px-2.5 py-2 rounded-lg border mb-4"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
          color: "var(--fg)",
        }}
      >
        {publicUrl}
      </p>
      <p className="text-xs leading-relaxed mb-5" style={{ color: "var(--muted)" }}>
        Every edit you make will be reflected on the live page in real time —
        no need to republish. You can take it down at any time.
      </p>
      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-lg text-sm border transition-colors hover:bg-stone-50"
          style={{ borderColor: "var(--border)", color: "var(--muted)" }}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-85 disabled:opacity-50"
          style={{ background: "var(--fg)", color: "var(--bg)" }}
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Globe size={13} />}
          {loading ? "Publishing…" : "Publish"}
        </button>
      </div>
    </ModalShell>
  );
}

function UnpublishModal({
  loading,
  onConfirm,
  onClose,
}: {
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-center gap-2 mb-1">
        <GlobeLock size={16} style={{ color: "var(--fg)" }} />
        <h2 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
          Unpublish this document?
        </h2>
      </div>
      <p className="text-xs leading-relaxed mb-5" style={{ color: "var(--muted)" }}>
        The public link will stop working immediately. Anyone who has it won&apos;t
        be able to view the document until you publish it again.
      </p>
      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-lg text-sm border transition-colors hover:bg-stone-50"
          style={{ borderColor: "var(--border)", color: "var(--muted)" }}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-85 disabled:opacity-50"
          style={{ background: "#1C1917", color: "#FAFAF8" }}
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <GlobeLock size={13} />}
          {loading ? "Unpublishing…" : "Unpublish"}
        </button>
      </div>
    </ModalShell>
  );
}

function LiveIndicator({ status }: { status: string }) {
  const cfg =
    status === "connected"
      ? { color: "#22c55e", label: "Live", pulse: true }
      : status === "connecting"
        ? { color: "#f59e0b", label: "Syncing", pulse: true }
        : { color: "#ef4444", label: "Offline", pulse: false };

  return (
    <span
      className="flex items-center gap-1.5 text-xs px-2.5 py-1.5"
      style={{ color: cfg.color }}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0${cfg.pulse ? " animate-pulse" : ""}`}
        style={{ backgroundColor: cfg.color }}
      />
      {cfg.label}
    </span>
  );
}

function DocUI({ docId, joinCode }: { docId: string; joinCode: string }) {
  const status = useStatus();
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState<boolean | null>(null);
  const [showUsers, setShowUsers] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showUnpublishModal, setShowUnpublishModal] = useState(false);

  const publicUrl =
    typeof window !== "undefined" ? `${window.location.origin}/p/${docId}` : "";

  // Fetch published state on mount
  useEffect(() => {
    fetch(
      `/api/status?roomId=${encodeURIComponent(docId)}&code=${encodeURIComponent(joinCode)}`,
    )
      .then((r) => r.json())
      .then((d: { published: boolean }) => setPublished(d.published))
      .catch(() => setPublished(false));
  }, [docId, joinCode]);

  async function handlePublish() {
    setPublishing(true);
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: docId, joinCode, published: true }),
      });
      if (res.ok) {
        setPublished(true);
        setShowPublishModal(false);
        trackEvent("doc_published");
      }
    } finally {
      setPublishing(false);
    }
  }

  async function handleUnpublish() {
    setPublishing(true);
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: docId, joinCode, published: false }),
      });
      if (res.ok) {
        setPublished(false);
        setShowUnpublishModal(false);
      }
    } finally {
      setPublishing(false);
    }
  }

  const btnBase =
    "flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border transition-colors hover:bg-stone-50";

  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--bg)" }}>
      <AnimatePresence>
        {showInvite && (
          <InviteModal
            docId={docId}
            joinCode={joinCode}
            onClose={() => setShowInvite(false)}
          />
        )}
        {showPublishModal && (
          <PublishModal
            publicUrl={publicUrl}
            loading={publishing}
            onConfirm={handlePublish}
            onClose={() => setShowPublishModal(false)}
          />
        )}
        {showUnpublishModal && (
          <UnpublishModal
            loading={publishing}
            onConfirm={handleUnpublish}
            onClose={() => setShowUnpublishModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Top bar */}
      <header
        className="shrink-0 flex items-center justify-between px-4 md:px-6 py-3 border-b gap-2"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Link
            href="/"
            className="font-serif italic text-base shrink-0"
            style={{ color: "var(--fg)" }}
          >
            <span className="sm:hidden">t</span>
            <span className="hidden sm:inline">texty</span>
          </Link>
          <span className="text-stone-300 shrink-0">/</span>
          <span
            className="text-sm font-medium truncate min-w-0"
            style={{ color: "var(--fg)" }}
          >
            {docId}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Avatars — always visible */}
          <AvatarStack onToggle={() => setShowUsers((v) => !v)} />

          {/* Desktop: inline buttons */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={() => setShowInvite(true)}
              className={btnBase}
              style={{ borderColor: "var(--border)", color: "var(--muted)" }}
            >
              <UserPlus size={13} /> Invite
            </button>

            {published ? (
              <>
                <LiveIndicator status={status} />
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={btnBase}
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--muted)",
                  }}
                >
                  <ExternalLink size={13} />
                </a>
                <button
                  onClick={() => setShowUnpublishModal(true)}
                  className={btnBase}
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--muted)",
                  }}
                >
                  <GlobeLock size={13} />
                  Unpublish
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowPublishModal(true)}
                className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md border transition-all hover:opacity-85"
                style={{
                  background: "var(--surface)",
                  color: "var(--fg)",
                  borderColor: "var(--border)",
                }}
              >
                <Globe size={13} />
                Publish
              </button>
            )}
          </div>

          {/* Mobile: ··· menu */}
          <div className="relative sm:hidden">
            <button
              onClick={() => setShowMenu((v) => !v)}
              className={btnBase}
              style={{ borderColor: "var(--border)", color: "var(--muted)" }}
            >
              <MoreHorizontal size={15} />
            </button>

            <AnimatePresence>
              {showMenu && (
                <>
                  {/* backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-9 z-50 min-w-[160px] rounded-xl border py-1 shadow-lg"
                    style={{
                      background: "var(--bg)",
                      borderColor: "var(--border)",
                    }}
                  >
                    {/* Invite */}
                    <button
                      onClick={() => {
                        setShowInvite(true);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-stone-50 transition-colors"
                      style={{ color: "var(--fg)" }}
                    >
                      <UserPlus size={14} style={{ color: "var(--muted)" }} />{" "}
                      Invite
                    </button>

                    {published ? (
                      <>
                        <a
                          href={publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setShowMenu(false)}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-stone-50 transition-colors"
                          style={{ color: "var(--fg)" }}
                        >
                          <ExternalLink
                            size={14}
                            style={{ color: "var(--muted)" }}
                          />{" "}
                          View published
                        </a>
                        <div
                          className="my-1 border-t"
                          style={{ borderColor: "var(--border)" }}
                        />
                        <button
                          onClick={() => {
                            setShowUnpublishModal(true);
                            setShowMenu(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-stone-50 transition-colors"
                          style={{ color: "var(--muted)" }}
                        >
                          <GlobeLock size={14} />
                          Unpublish
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setShowPublishModal(true);
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-stone-50 transition-colors"
                        style={{ color: "var(--fg)" }}
                      >
                        <Globe size={14} style={{ color: "var(--muted)" }} />
                        Publish
                      </button>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {showUsers && (
          <aside
            className="w-48 md:w-56 shrink-0 border-r p-4 md:p-5"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <p
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "var(--muted)" }}
              >
                Collaborators
              </p>
              <button
                onClick={() => setShowUsers(false)}
                className="hover:opacity-70"
                style={{ color: "var(--muted)" }}
              >
                <X size={14} />
              </button>
            </div>
            <UserList />
          </aside>
        )}

        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 sm:px-8 py-10 md:py-14">
            <Editor />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DocPage({
  params,
}: {
  params: Promise<{ docId: string }>;
}) {
  const { docId } = use(params);
  const searchParams = useSearchParams();
  const name = searchParams.get("name") || "Anonymous";
  const joinCode = searchParams.get("code") || "";
  const userId = getUserId();
  const serverUrl =
    process.env.NEXT_PUBLIC_CRDT_SERVER_URL || "ws://localhost:8787";

  useEffect(() => {
    if (!joinCode) return;
    try {
      const existing = JSON.parse(
        localStorage.getItem("texty-recent") || "[]",
      ) as Array<{ docId: string; joinCode: string; savedAt: number }>;
      const updated = [
        { docId, joinCode, savedAt: Date.now() },
        ...existing.filter((d) => d.docId !== docId),
      ].slice(0, 10);
      localStorage.setItem("texty-recent", JSON.stringify(updated));
    } catch {
      /* ignore */
    }
  }, [docId, joinCode]);

  if (!joinCode) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg)" }}
      >
        <div className="text-center">
          <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
            Missing join code.
          </p>
          <Link
            href="/app"
            className="text-sm underline underline-offset-2"
            style={{ color: "var(--fg)" }}
          >
            Go back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <RoomProvider
      serverUrl={serverUrl}
      roomId={docId}
      userId={userId}
      userName={name}
      joinCode={joinCode}
    >
      <DocUI docId={docId} joinCode={joinCode} />
    </RoomProvider>
  );
}
