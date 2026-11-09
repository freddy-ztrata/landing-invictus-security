/**
 * Fotos REALES del cliente (personal y flota de Invictus Security), en src/assets/img/real/.
 * Fuente única: qué foto va en cada sección y qué fotos muestran marcas de terceros.
 *
 * ⚠️ FLAG DE MARCAS — antes de producción:
 *   Algunas fotos muestran marcas de terceros (clientes/eventos). Solo se publican en la vista
 *   previa mientras no haya autorización escrita. Para apagarlas basta con poner
 *   `INCLUDE_THIRD_PARTY_BRAND_PHOTOS = false`: los helpers de abajo las omiten y cada sección
 *   cae a su foto "limpia" de respaldo (sin tocar componentes).
 *
 * Las fotos de src/assets/img/gen/ (IA, Higgsfield) quedan como respaldo/rollback: no borrar aún.
 */
import type { ImageMetadata } from 'astro';
import heroFlota from '../assets/img/real/invictus-hero-flota.jpg';
import camionetaAtardecer from '../assets/img/real/invictus-camioneta-atardecer.jpg';
import equipoCamioneta from '../assets/img/real/invictus-equipo-camioneta.jpg';
import guardiaCamioneta from '../assets/img/real/invictus-guardia-camioneta.jpg';
import equipoNoche from '../assets/img/real/invictus-equipo-noche.jpg';
import heroNocheCiudad from '../assets/img/real/invictus-hero-noche-ciudad.jpg';
import eventoEscenario from '../assets/img/real/invictus-evento-escenario.jpg';
import equipoGuardias from '../assets/img/real/invictus-equipo-guardias.jpg';
import eventoExterior from '../assets/img/real/invictus-evento-exterior.jpg';
import eventoFestival from '../assets/img/real/invictus-evento-festival.jpg';
import eventoCorporativo from '../assets/img/real/invictus-evento-corporativo.jpg';
import eventoHotel from '../assets/img/real/invictus-evento-hotel.jpg';
import patrullaMoto from '../assets/img/real/invictus-patrulla-moto.jpg';
import flotaCamionetas from '../assets/img/real/invictus-flota-camionetas.jpg';

/** `true` = vista previa (se muestran fotos con marcas de terceros + sello). `false` antes de prod. */
export const INCLUDE_THIRD_PARTY_BRAND_PHOTOS = true;

/** Texto del sello que se superpone a las fotos con marcas mientras el flag esté encendido. */
export const SELLO_MARCA = 'Marca de tercero — pendiente de autorización';

export type FotoId =
  | 'hero-flota'
  | 'camioneta-atardecer'
  | 'equipo-camioneta'
  | 'guardia-camioneta'
  | 'equipo-noche'
  | 'hero-noche-ciudad'
  | 'evento-escenario'
  | 'equipo-guardias'
  | 'evento-exterior'
  | 'evento-festival'
  | 'evento-corporativo'
  | 'evento-hotel'
  | 'patrulla-moto'
  | 'flota-camionetas';

/** Fotos con marcas de terceros visibles (id → marcas). Se omiten si el flag es `false`. */
export const FOTOS_CON_MARCA: Partial<Record<FotoId, string>> = {
  'equipo-guardias': 'Caja Los Andes',
  'evento-exterior': 'Caja Los Andes, Corrida PDI',
  'evento-festival': 'DKMS',
  'evento-corporativo': 'Tailings / GEOVIA / Dassault',
  'evento-hotel': 'San Cristóbal',
  'patrulla-moto': 'Copec',
  'flota-camionetas': 'Copec Voltex',
};

export interface FotoReal {
  id: FotoId;
  src: ImageMetadata;
  /** Alt descriptivo y verdadero (personal/flota reales; sin nombres ni cargos inventados). */
  alt: string;
  /** Pie corto para galerías. */
  caption: string;
  /** object-position por defecto (dónde está el sujeto). */
  pos: string;
  /** Marcas de terceros visibles, o null si la foto es "limpia". */
  marca: string | null;
}

const def = (id: FotoId, src: ImageMetadata, alt: string, caption: string, pos = '50% 50%'): FotoReal => ({
  id, src, alt, caption, pos, marca: FOTOS_CON_MARCA[id] ?? null,
});

export const FOTOS: Record<FotoId, FotoReal> = {
  'hero-flota': def('hero-flota', heroFlota, 'Dos guardias motorizados de Invictus Security con casco y chaleco, junto a sus motocicletas y los vehículos de patrulla de la empresa, sobre pavimento mojado al atardecer', 'Equipo motorizado y flota', '100% 55%'),
  'camioneta-atardecer': def('camioneta-atardecer', camionetaAtardecer, 'Camioneta de patrulla de Invictus Security estacionada frente a un cierre perimetral al atardecer', 'Patrulla en el perímetro', '50% 70%'),
  'equipo-camioneta': def('equipo-camioneta', equipoCamioneta, 'Tres guardias de Invictus Security con chaleco táctico y brazos cruzados, frente a una camioneta de patrulla de la empresa', 'Equipo en terreno', '30% 45%'),
  'guardia-camioneta': def('guardia-camioneta', guardiaCamioneta, 'Guardia de Invictus Security con chaleco y equipo de protección, de pie junto a una camioneta de patrulla de la empresa al atardecer', 'Guardia y camioneta de supervisión', '45% 38%'),
  'equipo-noche': def('equipo-noche', equipoNoche, 'Dos guardias motorizados de Invictus Security con casco, junto a una camioneta de patrulla de la empresa durante un turno de noche', 'Turno de noche', '40% 50%'),
  'hero-noche-ciudad': def('hero-noche-ciudad', heroNocheCiudad, 'Camioneta de patrulla de Invictus Security de noche, con las luces de la ciudad al fondo', 'Patrullaje nocturno', '50% 40%'),
  'evento-escenario': def('evento-escenario', eventoEscenario, 'Guardia de Invictus Security de espaldas junto al escenario durante un concierto, resguardando el área de backstage', 'Resguardo de escenario', '50% 32%'),
  'equipo-guardias': def('equipo-guardias', equipoGuardias, 'Cuatro guardias de Invictus Security, tres hombres y una mujer, de uniforme en un evento al aire libre', 'Equipo de evento', '50% 45%'),
  'evento-exterior': def('evento-exterior', eventoExterior, 'Guardia de Invictus Security con chaleco reflectante junto a una valla de control en un evento deportivo al aire libre', 'Evento deportivo', '50% 55%'),
  'evento-festival': def('evento-festival', eventoFestival, 'Guardia de Invictus Security vigilando al público en una feria al aire libre', 'Feria al aire libre', '40% 50%'),
  'evento-corporativo': def('evento-corporativo', eventoCorporativo, 'Personal de seguridad de Invictus Security, de traje, en un congreso corporativo junto a los paneles de exhibición', 'Congreso corporativo', '50% 55%'),
  'evento-hotel': def('evento-hotel', eventoHotel, 'Personal de seguridad de Invictus Security, de traje, en la zona de exhibición de un evento corporativo en un hotel', 'Evento en hotel', '40% 60%'),
  'patrulla-moto': def('patrulla-moto', patrullaMoto, 'Guardia motorizado de Invictus Security en su motocicleta al atardecer', 'Patrulla motorizada', '50% 60%'),
  'flota-camionetas': def('flota-camionetas', flotaCamionetas, 'Dos camionetas de patrulla de Invictus Security en ruta al atardecer', 'Flota en ruta', '60% 60%'),
};

/** ¿Se puede mostrar esta foto con la configuración actual del flag? */
export const permitida = (id: FotoId): boolean => INCLUDE_THIRD_PARTY_BRAND_PHOTOS || !FOTOS_CON_MARCA[id];

/** Foto preferida si está permitida; si no, el respaldo limpio. */
export function fotoOr(preferida: FotoId, respaldo: FotoId): FotoReal {
  if (!permitida(respaldo)) throw new Error(`fotos-reales: el respaldo "${respaldo}" tiene marcas de terceros`);
  return FOTOS[permitida(preferida) ? preferida : respaldo];
}

/** Solo las fotos permitidas, en el orden dado (las con marca desaparecen con el flag apagado). */
export const fotosPermitidas = (ids: FotoId[]): FotoReal[] => ids.filter(permitida).map((id) => FOTOS[id]);

/** Foto que siempre es limpia (falla el build si alguien le asigna una con marca). */
function limpia(id: FotoId): FotoReal {
  if (FOTOS_CON_MARCA[id]) throw new Error(`fotos-reales: "${id}" tiene marcas de terceros; usa fotoOr()`);
  return FOTOS[id];
}

export interface FotoHero { desktop: FotoReal; movil?: FotoReal }

/** Mapa de uso: qué foto va a cada sección. */
export const USO = {
  homeHero: { desktop: limpia('hero-flota'), movil: limpia('camioneta-atardecer') } satisfies FotoHero,
  segmentos: {
    'guardias-de-seguridad': { desktop: limpia('equipo-camioneta'), movil: limpia('guardia-camioneta') },
    // Proxy honesto: guardia real en terreno (no hay foto de conserjería).
    'seguridad-para-condominios': { desktop: limpia('guardia-camioneta') },
    'guardias-para-eventos': { desktop: limpia('evento-escenario') },
    // Proxy honesto: flota/perímetro (no hay foto de bodega).
    'seguridad-para-empresas': { desktop: fotoOr('flota-camionetas', 'camioneta-atardecer') },
  } satisfies Record<string, FotoHero>,
  nosotrosHero: limpia('equipo-noche'),
  // Con el flag apagado: equipo-noche, para no repetir la foto de condominios en el mismo bento.
  bentoPpi: fotoOr('patrulla-moto', 'equipo-noche'),
  coverage: limpia('hero-noche-ciudad'),
  process: limpia('equipo-camioneta'),
  galeriaNosotros: fotosPermitidas(['equipo-camioneta', 'equipo-guardias', 'equipo-noche', 'guardia-camioneta', 'camioneta-atardecer']),
  galeriaEventos: fotosPermitidas(['evento-escenario', 'evento-exterior', 'evento-festival', 'evento-corporativo', 'evento-hotel']),
};
