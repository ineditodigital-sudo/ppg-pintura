/**
 * Qué implica recubrir cada sustrato.
 *
 * La sección «Sobre qué aplicamos» mostraba sólo el nombre del material, y un
 * nombre de dos palabras no informa a nadie: quien busca recubrimiento ya sabe
 * de qué es su pieza, lo que quiere saber es si sabemos tratarla. Estas notas son
 * conocimiento general del recubrimiento en polvo, no especificaciones de
 * producto: el sistema concreto siempre lo fija el técnico.
 */
export interface Sustrato {
  icon: string
  note: string
}

const FICHAS: Record<string, Sustrato> = {
  'aluminio extruido': {
    icon: 'perfil',
    note: 'El perfil llega con óxido natural y restos de estirado: pide desengrase alcalino y conversión sin cromo antes de aplicar.',
  },
  'aluminio inyectado': {
    icon: 'colada',
    note: 'La inyección deja porosidad y desmoldante en superficie. Un desgasificado en horno evita los cráteres en el acabado.',
  },
  aluminio: {
    icon: 'perfil',
    note: 'No forma óxido rojo, pero sí una capa pasiva que hay que convertir para que el recubrimiento ancle.',
  },
  'acero galvanizado': {
    icon: 'galvanizado',
    note: 'El zinc desgasifica al curar y puede burbujear. Se trabaja con imprimación compatible y rampa de horno controlada.',
  },
  'acero al carbono': {
    icon: 'viga',
    note: 'Oxida en cuanto se limpia, así que el tiempo entre pretratamiento y aplicación es parte del proceso.',
  },
  'acero estructural': {
    icon: 'viga',
    note: 'Llega con calamina de laminación. Granallado a perfil de anclaje y espesor de película alto para exterior.',
  },
  'acero granallado': {
    icon: 'viga',
    note: 'Ya trae el perfil de anclaje hecho: hay que recubrir antes de que la superficie desnuda vuelva a oxidarse.',
  },
  acero: {
    icon: 'viga',
    note: 'El sustrato de referencia. Fosfatado de hierro o zinc según la exigencia de corrosión que tenga la pieza.',
  },
  'lámina de acero': {
    icon: 'lamina',
    note: 'Espesor bajo: calienta y enfría deprisa, así que el curado se ajusta a la masa real de la pieza.',
  },
  'lámina rolada': {
    icon: 'lamina',
    note: 'El rolado deja aceite de laminación en la superficie; sin desengrase completo el acabado se despega por zonas.',
  },
  lámina: {
    icon: 'lamina',
    note: 'Piezas ligeras y de mucha superficie vista: el reto es la uniformidad de espesor, no la resistencia.',
  },
  fundición: {
    icon: 'colada',
    note: 'Porosidad y arena residual. Granallado previo y desgasificado, o el poro suelta aire dentro del horno.',
  },
  'tubo de acero': {
    icon: 'tubo',
    note: 'La costura y el interior son los puntos débiles. Se cuida el acceso del polvo a las zonas de sombra.',
  },
  alambrón: {
    icon: 'alambre',
    note: 'Superficie curva y continua: el efecto de jaula de Faraday obliga a ajustar la carga electrostática.',
  },
}

/** Devuelve la ficha del sustrato, tolerando mayúsculas y acentos del dato. */
export function fichaSustrato(nombre: string): Sustrato {
  return (
    FICHAS[nombre.trim().toLowerCase()] ?? {
      icon: 'capas',
      note: 'Definimos el pretratamiento y el sistema a partir de la pieza y de sus condiciones de servicio.',
    }
  )
}

/**
 * La ficha, dando prioridad a lo configurado en el panel.
 *
 * Las catorce notas de este archivo pasan a ser el valor de fábrica: la tabla
 * editable vive en «Textos de producto y sector». Se busca sin distinguir
 * mayúsculas ni espacios sobrantes porque el nombre del material lo escribe
 * quien edita el sector, y «Acero Galvanizado» tiene que encontrar su ficha
 * igual que «acero galvanizado».
 */
export function fichaDeSustrato(
  nombre: string,
  configuradas: { material?: string; icon?: string; note?: string }[] | undefined,
): Sustrato {
  const clave = nombre.trim().toLowerCase()
  const propia = configuradas?.find((f) => (f.material ?? '').trim().toLowerCase() === clave)

  if (propia?.note) {
    return { icon: propia.icon || 'capas', note: propia.note }
  }

  return fichaSustrato(nombre)
}

/**
 * La tabla de arriba como lista, para el panel.
 *
 * El editor la usa como punto de partida cuando el documento aún no trae
 * fichas: si mostrara una lista vacía, quien la abre creería que no hay nada
 * configurado mientras las notas siguen saliendo publicadas.
 */
export const FICHAS_POR_DEFECTO = Object.entries(FICHAS).map(([material, f]) => ({
  material,
  icon: f.icon,
  note: f.note,
}))
