"use client";

import { useEffect, useState } from "react";

/** Largeur (px) à partir de laquelle on bascule sur la mise en page Desktop. */
const DESKTOP_MIN_WIDTH = 1024;

/**
 * Détecte automatiquement si l'appareil est un « grand écran » (Desktop).
 * Basé sur la largeur de la fenêtre via matchMedia, réactif au redimensionnement
 * et à la rotation. Rend `false` côté serveur (mobile-first par défaut).
 */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${DESKTOP_MIN_WIDTH}px)`);
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isDesktop;
}
