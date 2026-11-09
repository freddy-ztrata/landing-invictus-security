/**
 * Fuentes de la foto del hero, compartidas por Hero.astro y HeroPreload.astro: el preload del
 * <head> apunta EXACTAMENTE a las mismas URLs que el <picture> (mismos parámetros → mismo hash).
 *
 * Un solo <img> por hero (un solo candidato LCP): la variante móvil es una <source media>.
 * Build liviano (Dokploy): solo WebP + un JPG de fallback, pocos anchos.
 */
import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';

export interface HeroImagenOpts {
  image: ImageMetadata;
  imageMobile?: ImageMetadata;
  stage: boolean;
}

export interface HeroVariante {
  media: string;
  srcset: string;
  sizes: string;
  width?: number;
  height?: number;
  /** JPG para navegadores sin WebP (solo variante móvil con foto propia). */
  jpg?: string;
}

export interface HeroImagenes {
  /** Variante móvil (null si no hay). Va primero en el <picture>. */
  movil: HeroVariante | null;
  /** Variante desktop (la del <img>); `media` = complemento de la móvil, para el preload. */
  desktop: HeroVariante;
  /** JPG del <img> (fallback sin WebP). */
  fallback: string;
  /** Miniatura difuminada de fondo (solo card). */
  ambient: { src: string; width: number; height: number } | null;
}

export async function heroImagenes({ image, imageMobile, stage }: HeroImagenOpts): Promise<HeroImagenes> {
  const deskWidths = [480, 960, 1600].filter((w) => w <= image.width);
  const deskSizes = stage ? '100vw' : '(max-width: 960px) 100vw, 46vw';

  const [desk, fallback, ambient] = await Promise.all([
    getImage({ src: image, widths: deskWidths, format: 'webp', quality: stage ? 80 : 70 }),
    getImage({ src: image, width: Math.min(stage ? 1600 : 960, image.width), format: 'jpg', quality: 74 }),
    stage ? Promise.resolve(null) : getImage({ src: image, width: 48, format: 'webp', quality: 60 }), // Chrome no la cuenta como LCP (baja entropía)
  ]);

  let movil: HeroVariante | null = null;
  if (imageMobile) {
    // Foto móvil propia (art-direction) para todo el layout móvil (≤ 960 px).
    const widths = [480, 960].filter((w) => w <= imageMobile.width);
    const [m, jpg] = await Promise.all([
      // Misma calidad que la card desktop (70): si la foto se repite, Astro reutiliza el archivo.
      getImage({ src: imageMobile, widths, format: 'webp', quality: 70 }),
      getImage({ src: imageMobile, width: Math.min(960, imageMobile.width), format: 'jpg', quality: 74 }),
    ]);
    movil = { media: '(max-width: 960px)', srcset: m.srcSet.attribute, sizes: '100vw', width: imageMobile.width, height: imageMobile.height, jpg: jpg.src };
  } else if (stage) {
    // Sin foto móvil: recorte cuadrado (centrado) de la principal en teléfonos.
    const widths = [480, 832].filter((w) => w <= image.height);
    const list = await Promise.all(widths.map((w) => getImage({ src: image, width: w, height: w, fit: 'cover', position: 'center', format: 'webp', quality: 80 })));
    movil = { media: '(max-width: 599px)', srcset: list.map((r, i) => `${r.src} ${widths[i]}w`).join(', '), sizes: '100vw' };
  }

  const desktopMedia = movil ? (movil.media === '(max-width: 960px)' ? '(min-width: 961px)' : '(min-width: 600px)') : 'all';
  return {
    movil,
    desktop: { media: desktopMedia, srcset: desk.srcSet.attribute, sizes: deskSizes, width: image.width, height: image.height },
    fallback: fallback.src,
    ambient: ambient ? { src: ambient.src, width: Number(ambient.attributes.width), height: Number(ambient.attributes.height) } : null,
  };
}
