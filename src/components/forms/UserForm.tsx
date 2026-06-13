"use client";

import { useState } from "react";
import { useAppState } from "@/state/AppStateContext";
import { Field, Segmented, TextInput } from "@/components/ui/fields";
import { Avatar } from "@/components/ui/primitives";
import { readFileAsDataUrl } from "@/lib/file";
import type { MemberRole, UserProfile } from "@/lib/types";

export function UserForm({ onDone, user }: { onDone: () => void; user?: UserProfile }) {
  const app = useAppState();
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [birthDate, setBirthDate] = useState(user?.birthDate ?? "");
  const [role, setRole] = useState<MemberRole>(user?.role ?? "member");
  const [photoUrl, setPhotoUrl] = useState(user?.photoUrl);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPhotoUrl(await readFileAsDataUrl(file));
  }

  function save() {
    if (!firstName.trim()) return;
    if (user) {
      app.updateUser(user.id, { firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), birthDate, role, photoUrl });
    } else {
      app.addUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        birthDate: birthDate || undefined,
        role,
        active: true,
        photoUrl,
      });
    }
    onDone();
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Avatar name={`${firstName} ${lastName}`} src={photoUrl} size={56} />
        <label className="btn-ghost cursor-pointer text-xs">
          Changer la photo
          <input type="file" accept="image/*" onChange={onFile} className="hidden" />
        </label>
      </div>
      <Field label="Prénom">
        <TextInput value={firstName} onChange={(e) => setFirstName(e.target.value)} autoFocus />
      </Field>
      <Field label="Nom">
        <TextInput value={lastName} onChange={(e) => setLastName(e.target.value)} />
      </Field>
      <Field label="Email">
        <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label="Date de naissance">
        <TextInput type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
      </Field>
      <Field label="Rôle">
        <Segmented
          value={role}
          onChange={(v) => setRole(v)}
          options={[
            { value: "owner", label: "Propriétaire" },
            { value: "admin", label: "Admin" },
            { value: "member", label: "Membre" },
          ]}
        />
      </Field>
      <button type="button" className="btn-primary w-full" disabled={!firstName.trim()} onClick={save}>
        {user ? "Enregistrer" : "Créer l'utilisateur"}
      </button>
    </div>
  );
}
