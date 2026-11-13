// Banco de categorías de ¿Qué tipo soy? — se muestran tal cual en pantalla.
// Son categorías para clasificar famosos ("¿Maradona entra en mi categoría?").
// Dos tonos, para poder jugar con familia o con amigos:
//   PALABRAS_SUAVES   → aptas para cualquier mesa
//   PALABRAS_PICANTES → sexo, drogas, físico, religión, plata sucia…
/* 📝 EDITA AQUÍ LAS CATEGORÍAS */
export const PALABRAS_SUAVES = [
  // Mañas
  "Aura", "Chamuyero", "Mentiroso serial", "Tacaño", "Vago", "Chanta", "Careta", "Mufa",
  // Amor
  "Divorciado más de una vez", "Tiene más de 5 hijos", "Soltero eterno",
  "Tuvo una novia famosa", "Salió con una modelo",
  // Físico
  "Pelado", "Tatuado", "Altísimo", "Facha", "Barbudo", "Musculoso", "Fitness",
  // Plata
  "Millonario", "Nepo baby", "Hijo de famoso", "Vive de rentas", "Nació pobre",
  "Tiene avión privado", "Garpa la cuenta siempre",
  // Escándalos livianos
  "Se peleó en vivo", "Se fue del país", "Estuvo en Gran Hermano",
  "Lo echaron de un trabajo", "Tuvo un accidente famoso", "Lo agarraron en una mentira",
  "Polémico en Twitter", "Pidió disculpas en video", "Hizo un papelón en vivo",
  // Fútbol
  "Hincha de Boca", "Hincha de River", "Campeón del mundo", "Jugó en Europa",
  "Jugó en el Real Madrid o el Barça", "Técnico de fútbol", "Pecho frío",
  "Ídolo de un club",
  // Fama y oficio
  "Político", "Streamer", "Influencer", "Tiktoker", "Reggaetonero", "Cumbiero",
  "Rockero nacional", "Actor de novela", "Conductor de TV", "Participó en Bailando",
  "Ganó un Oscar o un Grammy", "One hit wonder",
  // Otros
  "Leyenda", "Vegano", "Español", "Argentino que vive en España",
  "Habla más de 3 idiomas", "Cumplió más de 70", "Estudió en la universidad",
  "Tiene un perro famoso",
];

export const PALABRAS_PICANTES = [
  // Propuestas originales
  "Falopero", "Gordo", "Judíos", "Famosos que fueron presos", "Pito cortos",
  "Infieles", "Un toro en la cama", "Que tiene OnlyFans", "Cornudos",
  // Vicios
  "Alcohólicos", "Fue a rehabilitación", "Fumón", "Ludópata", "Garca",
  // Amor y cama
  "Mujeriego", "Viejo verde", "Se casó con alguien mucho menor",
  "Tiene un hijo no reconocido", "Tuvo un escándalo sexual",
  "Le metieron los cuernos en público", "Pollerudo",
  // Físico
  "Usa peluquín o se hizo implante", "Operado", "Petiso", "Narigón", "Feo con levante",
  // Plata
  "Se fundió", "Evasor de impuestos", "Le debe plata a alguien",
  // Escándalos
  "Cancelado", "Lo escracharon", "Investigado por la Justicia",
  // Fútbol
  "Botinero", "Se retiró y engordó",
  // Otros
  "Muerto", "Religioso",
];

// Banco completo (pack "mixto")
export const PALABRAS_TIPO = [...PALABRAS_SUAVES, ...PALABRAS_PICANTES];

// Packs elegibles al crear la sala. Las salas sin el campo usan "mixto".
export const TIPO_PACKS = ["suave", "mixto", "picante"];

export function poolForPack(pack) {
  if (pack === "suave")   return PALABRAS_SUAVES;
  if (pack === "picante") return PALABRAS_PICANTES;
  return PALABRAS_TIPO;
}
