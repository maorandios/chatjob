"use client";

import { ImageAttachSheet } from "@/components/chat/ImageAttachSheet";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { Sheet } from "@/components/ui/Sheet";
import { PushNotificationSettingsCard } from "@/components/settings/PushNotificationSettingsCard";
import { LanguageFlag } from "@/components/worker/LanguageFlag";
import { signOutSupabaseAuth } from "@/lib/auth/manager-auth";
import { unsubscribeCurrentPushDevice } from "@/lib/hooks/use-push-notifications";
import { getLanguage, getLanguagePickerLabel } from "@/lib/i18n/languages";
import { getWorkerUi, type WorkerUiStrings } from "@/lib/i18n/worker-ui";
import { useContactDisplayName, useSlangStore } from "@/lib/store";
import { getWorkerJoinPath, getWorkerSettingsLanguagePath } from "@/lib/utils";
import type { LanguageCode } from "@/types";
import { ChevronRight, LogOut, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type WorkerSettingsViewProps = {
  token: string;
  workerId: string;
  workerName: string;
  workerEmail?: string;
  workerImageUrl?: string;
  language: LanguageCode;
  dir?: "ltr" | "rtl";
};

export function WorkerSettingsView({
  token,
  workerId,
  workerName,
  workerEmail,
  workerImageUrl,
  language,
  dir = "ltr",
}: WorkerSettingsViewProps) {
  const router = useRouter();
  const ui = getWorkerUi(language);
  const lang = getLanguage(language);
  const displayName = useContactDisplayName("worker", workerId, workerName);
  const setContactAlias = useSlangStore((s) => s.setContactAlias);
  const deleteWorkerAccount = useSlangStore((s) => s.deleteWorkerAccount);
  const uploadWorkerProfileImage = useSlangStore(
    (s) => s.uploadWorkerProfileImage
  );
  const [savingName, setSavingName] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [showPhotoSheet, setShowPhotoSheet] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showLogoutSheet, setShowLogoutSheet] = useState(false);
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSaveName = async (nextName: string) => {
    if (!nextName || savingName) return;
    if (nextName === displayName) return;

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

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await unsubscribeCurrentPushDevice({
        userRole: "worker",
        userId: workerId,
      }).catch((error) => {
        console.warn("[Slang] Failed to unsubscribe push on logout", error);
      });
      await signOutSupabaseAuth();
      setShowLogoutSheet(false);
      router.replace(getWorkerJoinPath(token));
    } finally {
      setLoggingOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await unsubscribeCurrentPushDevice({
        userRole: "worker",
        userId: workerId,
      }).catch((error) => {
        console.warn("[Slang] Failed to unsubscribe push on account delete", error);
      });
      await deleteWorkerAccount(workerId);
      await signOutSupabaseAuth();
      setShowDeleteSheet(false);
      router.replace("/login");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="chat-scrollbar min-h-0 flex-1 overflow-y-auto bg-[var(--jobchat-surface)] px-4 py-5">
        <div className="space-y-5" dir={dir}>
          <section>
            <div className="relative rounded-2xl border border-[var(--jobchat-border)] bg-white/25 px-4 py-8">
              <button
                type="button"
                onClick={() => setShowEditSheet(true)}
                className="absolute end-3 top-3 flex h-9 w-9 touch-manipulation items-center justify-center rounded-full border border-gray-200 bg-transparent text-gray-600 active:scale-95 active:opacity-70"
                aria-label={ui.editProfileTitle}
              >
                <Pencil className="h-4 w-4" />
              </button>

              <div className="flex flex-col items-center text-center">
                <button
                  type="button"
                  onClick={() => setShowPhotoSheet(true)}
                  disabled={uploadingPhoto}
                  className="rounded-full p-1 ring-4 ring-white active:scale-[0.98] disabled:opacity-60"
                  aria-label={ui.yourName}
                >
                  <Avatar
                    name={displayName}
                    size="xl"
                    imageUrl={workerImageUrl}
                  />
                </button>

                <p className="mt-5 text-[22px] font-semibold tracking-tight text-gray-900">
                  {displayName}
                </p>
              {workerEmail && (
                <p className="mt-1 text-xs text-gray-400" dir="ltr">
                  {workerEmail}
                </p>
              )}
                <p className="mt-1.5 text-[15px] text-gray-500">{ui.yourName}</p>
              </div>
            </div>
          </section>

          <section>
            <p className="mb-3 text-sm font-semibold text-gray-700">
              {ui.yourLanguage}
            </p>
            <Link
              href={getWorkerSettingsLanguagePath(token)}
              className="flex min-h-[76px] w-full items-center justify-between rounded-2xl border border-[var(--jobchat-border)] bg-white/25 px-4 py-4 transition-colors hover:bg-white/40 active:bg-white/50"
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

          <PushNotificationSettingsCard
            userRole="worker"
            userId={workerId}
            dir={dir}
            labels={{
              title: ui.pushSettingsTitle,
              subtitleOn: ui.pushSettingsSubtitleOn,
              subtitleOff: ui.pushSettingsSubtitleOff,
              sheetTitle: ui.pushSettingsSheetTitle,
              sheetBody: ui.pushSettingsSheetBody,
              toggleOn: ui.pushSettingsToggleOn,
              toggleOff: ui.pushSettingsToggleOff,
              unsupportedTitle: ui.pushSettingsUnsupportedTitle,
              unsupportedBody: ui.pushSettingsUnsupportedBody,
              deniedBody: ui.pushSettingsDeniedBody,
              close: ui.cancel,
            }}
          />

          <section>
            <button
              type="button"
              onClick={() => setShowLogoutSheet(true)}
              className="flex w-full items-center gap-3 rounded-2xl border border-[var(--jobchat-border)] bg-white/25 px-4 py-4 text-start transition-colors active:bg-white/40"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--jobchat-accent-light)]">
                <LogOut className="h-5 w-5 text-[var(--jobchat-accent)]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">{ui.logout}</p>
              </div>
              <ChevronRight
                className={
                  dir === "rtl"
                    ? "h-5 w-5 shrink-0 rotate-180 text-gray-400"
                    : "h-5 w-5 shrink-0 text-gray-400"
                }
                aria-hidden
              />
            </button>
          </section>

          <section>
            <button
              type="button"
              onClick={() => setShowDeleteSheet(true)}
              className="flex w-full items-center gap-3 rounded-2xl border border-red-100 bg-red-50/70 px-4 py-4 text-start transition-colors active:bg-red-50"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-red-700">
                  {ui.deleteAccount}
                </p>
                <p className="mt-0.5 text-xs text-red-400">
                  {ui.deleteAccountSubtitle}
                </p>
              </div>
              <ChevronRight
                className={
                  dir === "rtl"
                    ? "h-5 w-5 shrink-0 rotate-180 text-red-300"
                    : "h-5 w-5 shrink-0 text-red-300"
                }
                aria-hidden
              />
            </button>
          </section>
        </div>
      </div>

      <WorkerProfileEditSheet
        open={showEditSheet}
        onClose={() => setShowEditSheet(false)}
        name={displayName}
        ui={ui}
        dir={dir}
        onSave={(profile) => handleSaveName(profile.name)}
      />

      <ImageAttachSheet
        open={showPhotoSheet}
        onClose={() => setShowPhotoSheet(false)}
        takePhotoLabel={ui.takePhotoLabel}
        chooseGalleryLabel={ui.chooseGalleryLabel}
        onImageSelected={(file) => void handleImageSelected(file)}
        dir={dir}
      />

      <Sheet
        open={showLogoutSheet}
        onClose={() => !loggingOut && setShowLogoutSheet(false)}
        dir={dir}
        showCloseButton={false}
      >
        <div dir={dir} className="space-y-5">
          <p className="text-center text-[17px] font-semibold leading-snug text-gray-900">
            {ui.logoutConfirm}
          </p>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              fullWidth
              onClick={() => setShowLogoutSheet(false)}
              disabled={loggingOut}
              className="!rounded-2xl text-gray-600"
            >
              {ui.cancel}
            </Button>
            <Button
              fullWidth
              onClick={() => void handleLogout()}
              disabled={loggingOut}
              className="!rounded-2xl"
            >
              {ui.logout}
            </Button>
          </div>
        </div>
      </Sheet>

      <Sheet
        open={showDeleteSheet}
        onClose={() => !deleting && setShowDeleteSheet(false)}
        dir={dir}
        showCloseButton={false}
      >
        <div dir={dir} className="space-y-5">
          <div className="text-center">
            <p className="text-[17px] font-semibold leading-snug text-gray-900">
              {ui.deleteAccountConfirmTitle}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              {ui.deleteAccountConfirmBody}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              fullWidth
              onClick={() => setShowDeleteSheet(false)}
              disabled={deleting}
              className="!rounded-2xl text-gray-600"
            >
              {ui.cancel}
            </Button>
            <Button
              fullWidth
              onClick={() => void handleDeleteAccount()}
              disabled={deleting}
              className="!rounded-2xl bg-red-500 hover:bg-red-600"
            >
              {ui.deleteAccountAction}
            </Button>
          </div>
        </div>
      </Sheet>
    </>
  );
}

type WorkerProfileEditSheetProps = {
  open: boolean;
  onClose: () => void;
  name: string;
  ui: WorkerUiStrings;
  dir: "ltr" | "rtl";
  onSave: (data: { name: string }) => void | Promise<void>;
};

function WorkerProfileEditSheet({
  open,
  onClose,
  name: initialName,
  ui,
  dir,
  onSave,
}: WorkerProfileEditSheetProps) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const timeout = window.setTimeout(() => {
      setName(initialName);
      setError(undefined);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [open, initialName]);

  const handleSave = async () => {
    const nextName = name.trim();
    if (!nextName) {
      setError(ui.yourName);
      return;
    }

    setSaving(true);
    try {
      await onSave({ name: nextName });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} dir={dir} showCloseButton={false}>
      <div dir={dir} className="space-y-4">
        <p className="text-center text-[17px] font-semibold text-gray-900">
          {ui.editProfileTitle}
        </p>
        <Input
          dir={dir}
          label={ui.yourName}
          placeholder={ui.yourName}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setError(undefined);
          }}
          error={error}
        />
        <div className="flex gap-3 pt-1">
          <Button
            variant="ghost"
            fullWidth
            onClick={onClose}
            disabled={saving}
            className="!rounded-2xl text-gray-600"
          >
            {ui.cancel}
          </Button>
          <Button
            fullWidth
            onClick={() => void handleSave()}
            disabled={saving}
            className="!rounded-2xl"
          >
            {ui.contactNameSave}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
