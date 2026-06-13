/**
 * Lit un fichier image et renvoie une data URL.
 * En mode localStorage, les photos/logos sont stockés en data URL.
 * (À remplacer par Supabase Storage plus tard.)
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
