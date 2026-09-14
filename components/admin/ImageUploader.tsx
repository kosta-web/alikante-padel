"use client";

import { useRef, useState } from "react";
import { uploadImage } from "@/lib/content/upload";
import styles from "./ImageUploader.module.css";

type ImageUploaderProps = {
  label: string;
  /** Storage folder this image belongs to, e.g. "cards", "articles", "games". */
  folder: string;
  value?: string;
  onChange: (url: string) => void;
  onClear?: () => void;
  hint?: string;
};

export default function ImageUploader({
  label,
  folder,
  value,
  onChange,
  onClear,
  hint,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const url = await uploadImage(folder, file);
      onChange(url);
    } catch {
      setError("Не удалось загрузить фото. Попробуйте ещё раз.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      <div className={styles.row}>
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className={styles.preview} />
        ) : (
          <div className={styles.placeholder}>Нет фото</div>
        )}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.btn}
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? "Загрузка…" : value ? "Заменить" : "Загрузить фото"}
          </button>
          {value && onClear && !uploading && (
            <button type="button" className={styles.btnGhost} onClick={onClear}>
              Удалить
            </button>
          )}
        </div>
      </div>
      {hint && <p className={styles.hint}>{hint}</p>}
      {error && <p className={styles.hint} style={{ color: "#b23b3b" }}>{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className={styles.hiddenInput}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
