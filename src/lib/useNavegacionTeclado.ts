"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Navegación por teclado para listas filtradas por un buscador:
 * flecha abajo / arriba mueven el resaltado y Enter selecciona el resaltado.
 *
 * Uso:
 *  - poné `onKeyDown` en el input del buscador
 *  - poné `contenedorRef` en el contenedor de la lista
 *  - a cada resultado ponele `data-nav-index={i}` y resaltalo si `i === indiceActivo`
 *  - llamá a `reiniciar()` cuando cambia el texto buscado
 */
export function useNavegacionTeclado<T>(
  items: T[],
  onSeleccionar: (item: T) => void,
  habilitado = true
) {
  const [indice, setIndice] = useState(0);
  const elementoRef = useRef<HTMLElement | null>(null);
  const contenedorRef = useCallback((el: HTMLElement | null) => {
    elementoRef.current = el;
  }, []);

  const indiceActivo = items.length === 0 ? -1 : Math.min(indice, items.length - 1);

  useEffect(() => {
    if (indiceActivo < 0) return;
    elementoRef.current
      ?.querySelector<HTMLElement>(`[data-nav-index="${indiceActivo}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [indiceActivo]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (!habilitado || items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndice(Math.min(indiceActivo + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndice(Math.max(indiceActivo - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = items[indiceActivo];
      if (item !== undefined) onSeleccionar(item);
    }
  }

  return {
    indiceActivo,
    onKeyDown,
    contenedorRef,
    reiniciar: () => setIndice(0),
    activar: (i: number) => setIndice(i),
  };
}
