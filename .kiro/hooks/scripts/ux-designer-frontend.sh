#!/usr/bin/env bash
#
# Hook PreToolUse: revisión UX/diseño del frontend.
#
# Lee por stdin el JSON de contexto que envía Kiro (incluye tool_input.path).
# Decide si la operación de escritura afecta a un fichero de interfaz del
# frontend y, solo en ese caso, emite por stdout las instrucciones de revisión
# (que Kiro reenvía al contexto del agente en un PreToolUse con exit 0).
#
# Para cualquier otro fichero (tests, configuración, o fuera del frontend)
# termina en silencio con exit 0, evitando reinyectar el prompt de revisión
# y reduciendo así el consumo de tokens/créditos.

set -euo pipefail

# ── Leer el path del fichero desde el JSON de stdin ──────────────────────────
payload="$(cat)"

extract_path() {
  # 1) jq si está disponible (más robusto)
  if command -v jq >/dev/null 2>&1; then
    printf '%s' "$payload" | jq -r '.tool_input.path // empty' 2>/dev/null && return 0
  fi
  # 2) Fallback: extracción con sed sobre "path": "..."
  printf '%s' "$payload" \
    | sed -n 's/.*"path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' \
    | head -n1
}

file_path="$(extract_path)"

# Sin ruta no hay nada que revisar.
[ -z "${file_path}" ] && exit 0

# ── Regla de salida rápida: ficheros de test ─────────────────────────────────
case "${file_path}" in
  *.spec.ts|*.test.ts|*.spec.js|*.test.js|*__tests__/*)
    exit 0
    ;;
esac

# ── Ámbito: solo frontend dashboard o docs de frontend ───────────────────────
is_frontend=0
case "${file_path}" in
  */template/template/dashboard/*|template/template/dashboard/*)
    is_frontend=1
    ;;
  */template-docs/03-technical/frontend/*|template-docs/03-technical/frontend/*)
    is_frontend=1
    ;;
esac
[ "${is_frontend}" -eq 0 ] && exit 0

# ── Excluir ficheros de configuración conocidos ──────────────────────────────
base="$(basename "${file_path}")"
case "${base}" in
  package.json|package-lock.json|tsconfig*.json|angular.json|vitest.config.ts|karma.conf.js|*.gitignore)
    exit 0
    ;;
esac

# ── Emitir las instrucciones de revisión (solo cuando aplica) ────────────────
cat <<'INSTRUCTIONS'
Adopta el rol de un diseñador gráfico senior y experto en UX con amplia experiencia en Angular para revisar este fichero de frontend.

Ficheros de referencia en template-docs/03-technical/frontend/ (consúltalos según necesites):
- design-system.md, components.md, layout.md, navigation.md, notifications.md, internacionalizacion.md, pwa.md.

Para ficheros de CÓDIGO de interfaz, verifica antes de escribir:
1. Coherencia visual con los tokens del Design System (paleta, tipografía, espaciado).
2. Uso exclusivo de componentes del catálogo documentado; no inventar componentes sin documentar.
3. Estructura acorde a los patrones de layout.md y navigation.md (listado, formulario, detalle, filtros).
4. UX: jerarquía visual clara, estados de carga/error/vacío, validación inmediata con mensajes claros, confirmación en acciones destructivas.
5. Accesibilidad WCAG 2.1 AA: aria-label/aria-describedby/roles, contraste, navegación por teclado, aria-hidden en iconos decorativos.
6. Diseño responsive (móvil, tablet, escritorio).
7. Internacionalización: todos los textos visibles pasan por el pipe translate.
8. Atributos data-testid en elementos interactivos.

Si creas un componente REUTILIZABLE (shared/UI genérico, widget, directiva o pipe de uso general), actualiza la documentación correspondiente en template-docs/03-technical/frontend/ (components.md y, si aplica, design-system.md, layout.md, navigation.md, notifications.md). No consideres reutilizable un componente específico de una pantalla o feature.

Para ficheros de DOCUMENTACIÓN (template-docs/03-technical/frontend/*.md), verifica coherencia con el Design System, buenas prácticas UX, accesibilidad, completitud de estados (carga/error/vacío) y responsive, registro en components.md de nuevos componentes/patrones, y consistencia terminológica.

Corrige el código o la documentación antes de escribirlo si detectas incumplimientos.
INSTRUCTIONS

exit 0
