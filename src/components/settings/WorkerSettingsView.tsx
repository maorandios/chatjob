"use client";

import { ImageAttachSheet } from "@/components/chat/ImageAttachSheet";
import { Avatar } from "@/components/ui/Avatar";
import { LanguageFlag } from "@/components/worker/LanguageFlag";
import { getLanguage, getLanguagePickerLabel } from "@/lib/i18n/languages";
import { getWorkerUi } from "@/lib/i18n/worker-ui";
import { useSlangStore } from "@/lib/store";
import { getWorkerJoinPath } from "@/lib/utils";
import type { LanguageCode } from "@/types";
import { Camera, ChevronRight, CreditCard } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type WorkerSettingsViewProps = {
  token: string;
  workerId: string;
  workerName: string;
  workerImageUrl?: string;
  language: LanguageCode;
  dir?: "ltr" | "rtl";
};

export function WorkerSettingsView({
  token,
  workerId,
  workerName,
  workerImageUrl,
  language,
  dir = "ltr",
}: WorkerSettingsViewProps) {
  const ui = getWorkerUi(language);
  const lang = getLanguage(language);
  const setContactAlias = useSlangStore((s) => s.setContactAlias);
  const uploadWorkerProfileImage = useSlangStore(
    (s) => s.uploadWorkerProfileImage
  );
  const [name, setName] = useState(workerName);
  const [savingName, setSavingName] = useState(false);
  const [showPhotoSheet, setShowPhotoSheet] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    setName(workerName);
  }, [workerName]);

  const handleSaveName = async () => {
    const nextName = name.trim();
    if (!nextName || savingName) return;

    setSavingName(true);
    try {
      await setContactAlias(
        "worker",
        workerId,
        { name: nextName === workerName ? "" : nextName },
        { ownerId: workerId, contactRole: "self" }
      );
    } finally {
      setSavingName(false);
    }
  };

  const handleImageSelected = async (file: File) => {
    if (uploadingPhoto) return;
    setUploadingPhoto(true);
    try {
      await uploadWorkerProfileImage(workerId, file);
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <>
      <div className="chat-scrollbar min-h-0 flex-1 overflow-y-auto bg-white px-4 py-5">
        <div className="space-y-5" dir={dir}>
        <section>
          <p className="mb-3 text-sm font-semibold text-gray-700">
            {ui.yourName}
          </p>
          <div className="flex items-center gap-4 rounded-xl bg-[var(--jobchat-surface)] p-4">
            <button
              type="button"
              onClick={() => setShowPhotoSheet(true)}
              disabled={uploadingPhoto}
              className="relative rounded-full active:scale-[0.98] disabled:opacity-60"
              aria-label="עדכון תמונת פרופיל"
            >
              <Avatar name={workerName} imageUrl={workerImageUrl} />
              <span className="absolute -bottom-1 -end-1 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--jobchat-accent)] text-white ring-2 ring-white">
                <Camera className="h-3.5 w-3.5" />
              </span>
            </button>
            <div className="min-w-0 flex-1">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                onBlur={() => void handleSaveName()}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.currentTarget.blur();
                  }
                }}
                className="w-full bg-transparent font-medium text-gray-900 outline-none"
                dir={dir}
              />
              <p className="mt-1 text-xs text-gray-400">
                {savingName ? "שומר..." : "שם תצוגה אישי"}
              </p>
            </div>
          </div>
        </section>

        <section>
          <p className="mb-3 text-sm font-semibold text-gray-700">
            {ui.yourLanguage}
          </p>
          <Link
            href={`${getWorkerJoinPath(token)}?changeLang=1`}
            className="flex w-full items-center justify-between rounded-xl bg-[var(--jobchat-surface)] p-4 hover:bg-gray-100"
          >
            <p className="flex items-center gap-2 font-medium text-gray-900">
              <LanguageFlag
                countryCode={lang.countryCode}
                className="h-5 w-5"
                title={lang.countryName}
              />
              {getLanguagePickerLabel(lang)}
            </p>
            <ChevronRight
              className={
                dir === "rtl"
                  ? "h-5 w-5 rotate-180 text-gray-400"
                  : "h-5 w-5 text-gray-400"
              }
            />
          </Link>
        </section>

        <section>
          <p className="mb-3 text-sm font-semibold text-gray-700">תשלומים</p>
          <button
            type="button"
            disabled
            className="flex w-full items-center gap-3 rounded-xl bg-[var(--jobchat-surface)] px-4 py-3 text-start"
          >
            <CreditCard className="h-5 w-5 shrink-0 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">ניהול תשלומים</p>
              <p className="text-xs text-gray-500">בקרוב</p>
            </div>
          </button>
        </section>

        <button
          type="button"
          disabled
          className="w-full rounded-xl border border-[var(--jobchat-border)] px-4 py-3 text-sm text-gray-400"
        >
          {ui.help} (בקרוב)
        </button>
        <p className="pb-4 text-center text-xs text-gray-400">{ui.prototype}</p>
        </div>
      </div>

      <ImageAttachSheet
        open={showPhotoSheet}
        onClose={() => setShowPhotoSheet(false)}
        takePhotoLabel="צלם תמונה"
        chooseGalleryLabel="בחר מהגלריה"
        onImageSelected={(file) => void handleImageSelected(file)}
        dir={dir}
      />
    </>
  );
}
