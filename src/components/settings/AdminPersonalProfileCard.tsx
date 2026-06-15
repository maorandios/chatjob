"use client";

import { ImageAttachSheet } from "@/components/chat/ImageAttachSheet";
import { ManagerProfileEditSheet } from "@/components/settings/ManagerProfileEditSheet";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";
import { compressImageFile } from "@/lib/images/compress";
import { useSlangStore } from "@/lib/store";
import { Pencil } from "lucide-react";
import { useState } from "react";

export function AdminPersonalProfileCard() {
  const managerId = useSlangStore((s) => s.managerId);
  const managerName = useSlangStore((s) => s.managerName);
  const managerPhone = useSlangStore((s) => s.managerPhone);
  const profileImage = useSlangStore((s) =>
    managerId ? s.managerProfileImages[managerId] : undefined
  );
  const updateManagerProfile = useSlangStore((s) => s.updateManagerProfile);
  const setManagerProfileImage = useSlangStore((s) => s.setManagerProfileImage);
  const { showToast } = useToast();

  const [showEditSheet, setShowEditSheet] = useState(false);
  const [showPhotoSheet, setShowPhotoSheet] = useState(false);

  const handlePhotoSelected = async (file: File) => {
    if (!managerId) return;
    try {
      const dataUrl = await compressImageFile(file);
      setManagerProfileImage(managerId, dataUrl);
    } catch {
      showToast("לא ניתן לעדכן את תמונת הפרופיל");
    }
  };

  if (!managerId) return null;

  return (
    <>
      <section>
        <div className="relative rounded-2xl border border-[var(--jobchat-border)] bg-white/25 px-4 py-8">
          <button
            type="button"
            onClick={() => setShowEditSheet(true)}
            className="absolute end-3 top-3 flex h-9 w-9 touch-manipulation items-center justify-center rounded-full border border-gray-200 bg-transparent text-gray-600 active:scale-95 active:opacity-70"
            aria-label="עריכת פרטים"
          >
            <Pencil className="h-4 w-4" />
          </button>

          <div className="flex flex-col items-center text-center">
            <button
              type="button"
              onClick={() => setShowPhotoSheet(true)}
              className="rounded-full p-1 ring-4 ring-white active:scale-[0.98]"
              aria-label="עדכון תמונת פרופיל"
            >
              <Avatar
                name={managerName}
                size="xl"
                imageUrl={profileImage}
              />
            </button>
            <p className="mt-5 text-[22px] font-semibold tracking-tight text-gray-900">
              {managerName}
            </p>
            <p className="mt-1.5 text-[15px] text-gray-500" dir="ltr">
              {managerPhone}
            </p>
          </div>
        </div>
      </section>

      <ManagerProfileEditSheet
        open={showEditSheet}
        onClose={() => setShowEditSheet(false)}
        name={managerName}
        phone={managerPhone}
        onSave={(profile) => updateManagerProfile(profile)}
      />

      <ImageAttachSheet
        open={showPhotoSheet}
        onClose={() => setShowPhotoSheet(false)}
        takePhotoLabel="צלם תמונה"
        chooseGalleryLabel="בחר מהגלריה"
        onImageSelected={(file) => void handlePhotoSelected(file)}
        dir="rtl"
      />
    </>
  );
}
