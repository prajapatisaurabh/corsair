"use client";

import { useEffect, useState } from "react";
import { useTempo } from "@/lib/store";
import { fmtDay, fmtTime } from "@/lib/time";

export function EmailDetail() {
  const {
    emails,
    selectedId,
    detailOpen,
    replyDraft,
    draftLoading,
    closeOverlays,
    archive,
    schedule,
    sendReply,
    openDetail,
  } = useTempo();
  const email = emails.find((e) => e.id === selectedId);
  const [reply, setReply] = useState("");

  useEffect(() => {
    setReply(replyDraft ?? "");
  }, [replyDraft]);

  if (!detailOpen || !email) return null;

  const replying = replyDraft !== null || draftLoading;

  return (
    <div className="absolute inset-0 z-30 flex" onClick={closeOverlays}>
      <div className="flex-1 bg-black/50 backdrop-blur-[2px]" />
      <div
        className="w-[620px] h-full bg-[#131020] border-l border-white/10 flex flex-col animate-pop-in shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-5 pb-4 border-b border-white/8">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-[17px] font-semibold leading-snug">
              {email.subject}
            </h2>
            <button
              onClick={closeOverlays}
              className="text-zinc-500 hover:text-white text-sm mt-0.5"
            >
              ✕ <kbd>Esc</kbd>
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[14px] text-zinc-400">
            <span className="text-zinc-200 font-medium">{email.from.name}</span>
            <span>&lt;{email.from.email}&gt;</span>
            <span>·</span>
            <span>
              {fmtDay(email.receivedAt)} {fmtTime(email.receivedAt)}
            </span>
          </div>
          {email.priorityReason && (
            <div className="mt-2 inline-flex items-center gap-1.5 text-[13px] text-zinc-400 bg-white/5 px-2 py-0.5 rounded-full">
              ✦ AI: {email.priorityReason}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 text-[15.5px] leading-relaxed text-zinc-200 whitespace-pre-wrap">
          {email.body}
        </div>

        {email.timeIntent && !email.scheduledEventId && (
          <div className="mx-6 mb-3 flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <div className="text-[14px] text-amber-200">
              ⏰ Mentions <b>{email.timeIntent.phrase}</b> —{" "}
              {fmtDay(email.timeIntent.start)} at{" "}
              {fmtTime(email.timeIntent.start)}
            </div>
            <button
              onClick={() => {
                schedule(email.id);
                closeOverlays();
              }}
              className="shrink-0 text-[14px] px-3 py-1.5 rounded-md bg-amber-500/90 text-black font-semibold hover:bg-amber-400"
            >
              Schedule + invite{" "}
              <kbd className="!bg-black/20 !border-black/30 !text-black/70">
                S
              </kbd>
            </button>
          </div>
        )}

        {replying ? (
          <div className="border-t border-white/8 p-4">
            <div className="text-[13px] text-zinc-500 mb-2 flex items-center gap-2">
              ✦ AI draft — edit freely, then <kbd>⌘Enter</kbd> to send
            </div>
            {draftLoading ? (
              <div className="h-24 flex items-center justify-center text-zinc-500 text-sm animate-pulse">
                drafting…
              </div>
            ) : (
              <textarea
                autoFocus
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter")
                    sendReply(email, reply);
                  e.stopPropagation();
                }}
                className="w-full h-28 bg-[#0c0a14] border border-white/10 rounded-lg p-3 text-[15px] text-zinc-100 resize-none focus:outline-none focus:border-violet-500/60"
              />
            )}
            <div className="mt-2 flex justify-end gap-2">
              <button
                onClick={() => sendReply(email, reply)}
                className="text-[14px] px-4 py-1.5 rounded-md bg-violet-600 hover:bg-violet-500 font-semibold"
              >
                Send reply
              </button>
            </div>
          </div>
        ) : (
          <div className="border-t border-white/8 px-6 py-3 flex items-center gap-2 text-[14px]">
            <button
              onClick={() => openDetail(true)}
              className="px-3 py-1.5 rounded-md bg-violet-600 hover:bg-violet-500 font-medium"
            >
              Reply with AI <kbd className="!bg-black/20">R</kbd>
            </button>
            <button
              onClick={() => {
                archive(email.id);
                closeOverlays();
              }}
              className="px-3 py-1.5 rounded-md bg-white/8 hover:bg-white/15"
            >
              Archive <kbd>E</kbd>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
