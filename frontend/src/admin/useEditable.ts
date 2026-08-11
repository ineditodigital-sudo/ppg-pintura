import { useEffect, useMemo, useState } from 'react'
import { ApiError } from './api'

/**
 * Caché de lo ya cargado en esta sesión del panel.
 *
 * Cada pantalla pedía sus datos al montarse, sin excepción: ir a Colores,
 * volver a Inicio y regresar eran tres viajes al servidor para el mismo
 * documento. Con el catálogo de color —28 KB— eso se nota en cada navegación.
 *
 * La clave es la función cargadora, que es estable por pantalla. Se sirve al
 * instante lo que hay y se revalida por detrás: si el servidor devuelve algo
 * distinto —otra pestaña guardó— la pantalla se actualiza sola.
 */
const cache = new Map<unknown, unknown>()

/** Se vacía al guardar, para que la siguiente pantalla no lea lo viejo. */
export function invalidarCache() {
  cache.clear()
}

/**
 * Hook común de las pantallas de contenido: carga, detecta cambios y guarda.
 *
 * El estado «sucio» se calcula comparando el JSON serializado con el que llegó
 * del servidor. Es una comparación bruta a propósito: da igual por dónde se
 * haya editado —un campo suelto o una lista anidada—, si el documento no ha
 * cambiado la barra de guardado no aparece.
 */
export function useEditable<T>(
  load: () => Promise<T>,
  persist: (value: T) => Promise<{ message: string }>,
) {
  const [value, setValue] = useState<T | null>(() => (cache.get(load) as T) ?? null)
  const [original, setOriginal] = useState(() =>
    cache.has(load) ? JSON.stringify(cache.get(load)) : '',
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let vivo = true

    load()
      .then((data) => {
        if (!vivo) return
        cache.set(load, data)
        const serializado = JSON.stringify(data)
        // Si lo cacheado ya era esto, no se toca el estado: reemplazarlo
        // descartaría lo que el usuario esté escribiendo mientras revalida.
        setOriginal((previo) => {
          if (previo === serializado) return previo
          setValue(data)
          return serializado
        })
      })
      .catch((e) => {
        if (vivo) setError(e.message)
      })

    return () => {
      vivo = false
    }
    // El cargador se pasa una sola vez por pantalla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * Serializar en cada render costaba 28 KB de JSON por pulsación en la carta
   * de color, con la tabla entera repintándose detrás. Con `useMemo` sólo se
   * recalcula cuando el documento cambia de verdad.
   */
  const dirty = useMemo(
    () => value !== null && JSON.stringify(value) !== original,
    [value, original],
  )

  async function save() {
    if (value === null) return
    setSaving(true)
    setError('')
    setErrors([])
    setNotice('')

    try {
      const result = await persist(value)
      setOriginal(JSON.stringify(value))
      // Lo guardado pasa a ser lo cacheado; el resto se descarta porque un
      // documento puede depender de otro (las familias de la carta, por
      // ejemplo) y servir lo anterior sería enseñar datos ya inválidos.
      invalidarCache()
      cache.set(load, value)
      setNotice(result.message)
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message)
        setErrors(e.errors)
      } else {
        setError('No se pudo guardar.')
      }
    } finally {
      setSaving(false)
    }
  }

  return {
    value,
    setValue,
    dirty,
    saving,
    error,
    errors,
    notice,
    save,
    reset: () => setValue(JSON.parse(original) as T),
  }
}
