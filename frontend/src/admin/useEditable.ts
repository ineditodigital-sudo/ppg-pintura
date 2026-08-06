import { useEffect, useState } from 'react'
import { ApiError } from './api'

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
  const [value, setValue] = useState<T | null>(null)
  const [original, setOriginal] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [notice, setNotice] = useState('')

  useEffect(() => {
    load()
      .then((data) => {
        setValue(data)
        setOriginal(JSON.stringify(data))
      })
      .catch((e) => setError(e.message))
    // El cargador se pasa una sola vez por pantalla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const dirty = value !== null && JSON.stringify(value) !== original

  async function save() {
    if (value === null) return
    setSaving(true)
    setError('')
    setErrors([])
    setNotice('')

    try {
      const result = await persist(value)
      setOriginal(JSON.stringify(value))
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
