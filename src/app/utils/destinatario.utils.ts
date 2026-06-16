export function iconoPorTipo(nombre: string): string {
  const iconos: Record<string, string> = {
    'TODOS':              '👥',
    'GENERO':             '⚧',
    'FACULTAD':           '🎓',
    'EDIFICIO':           '🏢',
    'HABITACION':         '🚪',
    'SELECCION':          '⚽',
    'USUARIO_ESPECIFICO': '👤',
  };
  return iconos[nombre] ?? '📋';
}
