/**
 * Landings de segmento (calce exacto con los grupos de anuncios de Google Ads).
 * Cada segmento tiene copy, FAQs e imagen PROPIOS — si se parecen demasiado entre sí,
 * Google puede tratarlas como doorway pages.
 *
 * FAQs: "respuesta primero" (la primera oración responde; luego el detalle). Las leen
 * usuarios, Google y los motores de respuesta (AEO/GEO).
 */
import type { ImageMetadata } from 'astro';
import imgCondominio from '../assets/img/gen/condominio-conserjeria.jpg';
import imgEvento from '../assets/img/gen/evento-control-acceso.jpg';
import imgEmpresa from '../assets/img/gen/empresa-bodega-acceso.jpg';
import imgGuardia from '../assets/img/gen/hero-guardias-equipo.jpg';

export type SegmentoForm = 'condominio' | 'empresa' | 'evento' | 'ppi' | 'otro';

export interface Faq { q: string; a: string }
export interface Item { titulo: string; texto: string }

export interface Segmento {
  slug: string;
  nav: string;
  formSegmento: SegmentoForm | null; // chip preseleccionado en el formulario
  seoTitle: string; // ≤ 60 caracteres
  seoDescription: string; // ≤ 155 caracteres
  eyebrow: string;
  h1: string;
  h1Accent: string; // parte del H1 resaltada
  lead: string;
  bullets: string[];
  resumen: string; // bloque "respuesta primero" (AEO)
  imagen: ImageMetadata;
  imagenAlt: string;
  dolores: Item[];
  incluye: Item[];
  recintos: string[];
  faqs: Faq[];
  serviceType: string;
  ctaTexto: string;
}

export const segmentos: Segmento[] = [
  {
    slug: 'guardias-de-seguridad',
    nav: 'Guardias de seguridad',
    formSegmento: null,
    seoTitle: 'Empresa de Guardias de Seguridad en Santiago | Invictus',
    seoDescription: 'Empresa de guardias de seguridad con personal acreditado, supervisión 24/7 y seguros. Turnos de día, noche o 24/7 en Santiago y regiones. Cotiza en 24 h.',
    eyebrow: 'Empresa de guardias de seguridad',
    h1: 'Guardias de seguridad para tu recinto, ',
    h1Accent: 'con supervisión real 24/7',
    lead: 'Contrata guardias y personal de seguridad privada acreditados, con contrato, seguros y un supervisor que responde por cada turno. Para condominios, empresas, bodegas, colegios y eventos en Santiago y regiones.',
    bullets: [
      'Personal con credencial vigente y capacitación al día',
      'Turnos de día, noche o 24/7 con reemplazos garantizados',
      'Rondas registradas y reportes para tu administración',
    ],
    resumen: 'Invictus Security es una empresa de guardias de seguridad con base en la Región Metropolitana. Asigna guardias acreditados por puesto y turno, los supervisa en terreno y a distancia, y cubre ausencias con reemplazos para que el puesto nunca quede vacío. La cotización es gratuita y se entrega en menos de 24 horas hábiles.',
    imagen: imgGuardia,
    imagenAlt: 'Guardias de seguridad uniformados en el acceso de un edificio residencial de Santiago al anochecer, con la cordillera de los Andes al fondo',
    dolores: [
      { titulo: 'Puestos que quedan vacíos', texto: 'Licencias, renuncias o atrasos que nadie cubre: el recinto queda sin vigilancia justo cuando más importa.' },
      { titulo: 'Guardias sin credencial vigente', texto: 'Personal sin acreditación expone a tu empresa o comunidad a sanciones y te deja sin respaldo ante un incidente.' },
      { titulo: 'Cero control de lo que pasa en el turno', texto: 'Sin rondas registradas ni reportes, no sabes si el servicio que pagas se está cumpliendo.' },
    ],
    incluye: [
      { titulo: 'Selección y acreditación', texto: 'Verificamos antecedentes, credencial y capacitación de cada guardia antes de asignarlo a tu recinto.' },
      { titulo: 'Turnos a tu medida', texto: 'Cobertura diurna, nocturna o 24/7 según el riesgo y el horario de tu recinto, con sistemas de turnos ajustados a la jornada legal.' },
      { titulo: 'Reemplazos garantizados', texto: 'Si un guardia falta, enviamos un reemplazo. Tu puesto no queda descubierto.' },
      { titulo: 'Supervisión en terreno', texto: 'Un supervisor visita el puesto, controla presentación y procedimientos y es tu contacto directo.' },
      { titulo: 'Rondas y bitácora', texto: 'Rondas programadas y registro de novedades para que la administración sepa qué pasó en cada turno.' },
      { titulo: 'Contrato, cotizaciones y seguros', texto: 'Guardias con contrato de trabajo, cotizaciones previsionales al día y seguros vigentes.' },
    ],
    recintos: ['Condominios y edificios', 'Oficinas', 'Bodegas y centros logísticos', 'Industrias', 'Colegios', 'Retail', 'Obras en construcción', 'Eventos'],
    faqs: [
      {
        q: '¿Cuántos guardias necesito para cubrir un puesto las 24 horas?',
        a: 'Para cubrir un puesto 24/7 normalmente se necesitan 4 guardias rotando en turnos de 12 horas, más un sistema de reemplazos para ausencias. La cifra exacta depende del sistema de turnos autorizado y de la jornada legal vigente (42 horas semanales desde el 26 de abril de 2026). Puedes estimarlo con nuestra calculadora de dotación.',
      },
      {
        q: '¿Qué diferencia hay entre un guardia de seguridad y un vigilante privado?',
        a: 'El guardia de seguridad protege personas y bienes sin portar armas de fuego, y es el servicio que contratan condominios, empresas y eventos. El vigilante privado puede portar armas y está reservado a entidades que la ley obliga a tener sistemas de seguridad, como bancos o transporte de valores.',
      },
      {
        q: '¿Qué requisitos legales debe cumplir el guardia que contrato?',
        a: 'Debe contar con la credencial y la capacitación exigidas por la normativa de seguridad privada, y trabajar con contrato a través de una empresa autorizada. Desde el 28 de noviembre de 2025 rige la Ley 21.659, que regula la Subsecretaría de Prevención del Delito; Carabineros mantiene la fiscalización.',
      },
      {
        q: '¿Qué turnos trabajan los guardias?',
        a: 'Los más usados son turnos de 12 horas en sistema 4x4 (cuatro días de trabajo y cuatro de descanso) y jornadas 5x2 para horarios de oficina. Los sistemas excepcionales de distribución de jornada, como el 4x4 de 12 horas, requieren autorización de la Dirección del Trabajo.',
      },
      {
        q: '¿Cuánto cuesta contratar un guardia de seguridad?',
        a: 'El valor depende de cuántas horas cubres (12 horas o 24/7), el número de puestos, el sistema de turnos, el tipo de recinto y su nivel de riesgo, y los servicios adicionales como rondas o supervisión. Por eso cotizamos cada caso: te enviamos una propuesta en menos de 24 horas hábiles, sin costo.',
      },
      {
        q: '¿En cuánto tiempo pueden empezar?',
        a: 'Una vez aprobada la propuesta y firmado el contrato, podemos tener guardias operando en tu recinto en un plazo de 48 a 72 horas. Para eventos o urgencias coordinamos plazos más cortos según disponibilidad.',
      },
    ],
    serviceType: 'Guardias de seguridad privada',
    ctaTexto: 'Cotizar guardias de seguridad',
  },
  {
    slug: 'seguridad-para-condominios',
    nav: 'Condominios y edificios',
    formSegmento: 'condominio',
    seoTitle: 'Seguridad para Condominios y Edificios | Invictus',
    seoDescription: 'Empresa de seguridad para condominios y edificios en Santiago: guardias acreditados, control de acceso, rondas y reportes al comité. Cotiza gratis.',
    eyebrow: 'Seguridad para condominios',
    h1: 'Guardias de seguridad para condominios y edificios ',
    h1Accent: 'en Santiago',
    lead: 'Seguridad residencial con control de acceso, rondas nocturnas y reportes claros para la administración y el comité. Guardias acreditados, supervisados y con reemplazos garantizados para que tu comunidad duerma tranquila.',
    bullets: [
      'Control de visitas, deliveries y estacionamientos',
      'Rondas perimetrales nocturnas con registro',
      'Reportes para el administrador y el comité',
    ],
    resumen: 'Invictus Security es una empresa de seguridad privada para condominios: entrega guardias de seguridad para condominios de casas y edificios en Santiago y la Región Metropolitana. El servicio incluye control de acceso de visitas y proveedores, rondas perimetrales, registro de novedades y un supervisor que responde ante la administración. La cotización es gratuita y considera el tamaño del condominio, los accesos y los horarios de mayor riesgo.',
    imagen: imgCondominio,
    imagenAlt: 'Guardia de seguridad en la conserjería de un edificio residencial de Santiago revisando cámaras de acceso',
    dolores: [
      { titulo: 'Accesos sin control', texto: 'Visitas, deliveries y proveedores que entran sin registro: la puerta de tu condominio es el primer punto débil.' },
      { titulo: 'Noches sin rondas', texto: 'Robos en estacionamientos y bodegas ocurren cuando nadie recorre el perímetro.' },
      { titulo: 'Reclamos sin respuesta', texto: 'Cuando algo pasa, el comité no tiene a quién pedir cuentas ni un registro de lo ocurrido.' },
    ],
    incluye: [
      { titulo: 'Control de acceso', texto: 'Registro de visitas, proveedores y deliveries, con validación previa con el residente.' },
      { titulo: 'Rondas perimetrales', texto: 'Recorridos programados por estacionamientos, bodegas, áreas comunes y cierres perimetrales.' },
      { titulo: 'Bitácora y reportes', texto: 'Registro de novedades por turno y reportes para el administrador y el comité de administración.' },
      { titulo: 'Coordinación con conserjería', texto: 'Trabajamos junto a tu conserjería o la reemplazamos según lo que necesite la comunidad.' },
      { titulo: 'Protocolos de emergencia', texto: 'Procedimientos ante intrusiones, incendios y emergencias médicas, con contacto directo a la administración.' },
      { titulo: 'Supervisor asignado', texto: 'Un supervisor que conoce tu condominio, visita el puesto y responde por la calidad del servicio.' },
    ],
    recintos: ['Condominios de casas', 'Edificios residenciales', 'Comunidades con varias torres', 'Loteos y parcelaciones', 'Estacionamientos y bodegas'],
    faqs: [
      {
        q: '¿Qué hace un guardia de seguridad en un condominio?',
        a: 'Controla quién entra y sale, registra visitas y proveedores, hace rondas por el perímetro y las áreas comunes, y reacciona ante incidentes siguiendo protocolos acordados con la administración. A diferencia de un conserje, su foco es la prevención y la respuesta ante riesgos.',
      },
      {
        q: '¿Conviene tener guardia o conserje en un condominio?',
        a: 'Depende del riesgo y del presupuesto de la comunidad. El conserje atiende y administra el acceso; el guardia está capacitado para prevenir delitos y responder ante incidentes. Muchas comunidades combinan conserjería de día con guardia de seguridad de noche, cuando ocurre la mayoría de los robos.',
      },
      {
        q: '¿Cuántos guardias necesita un condominio?',
        a: 'Un acceso cubierto 24/7 requiere normalmente 4 guardias en turnos rotativos de 12 horas. Condominios con varios accesos, muchas casas o perímetros extensos pueden necesitar más puestos o rondas adicionales. Lo definimos en una visita técnica gratuita.',
      },
      {
        q: '¿Qué debe revisar el comité antes de contratar una empresa de seguridad para condominios?',
        a: 'Que la empresa esté autorizada según la Ley 21.659, que sus guardias tengan credencial vigente, contrato y cotizaciones al día, y que exista un seguro. También conviene pedir el certificado F30-1 de cumplimiento laboral de la Dirección del Trabajo y un contrato con procedimientos y niveles de servicio por escrito.',
      },
      {
        q: '¿Cuánto cuesta un guardia para un condominio?',
        a: 'El costo depende de las horas de cobertura, el número de accesos y puestos, el sistema de turnos y los servicios adicionales, como rondas o reportes. Cotizamos cada comunidad según su realidad y enviamos la propuesta en menos de 24 horas hábiles.',
      },
      {
        q: '¿Trabajan con condominios fuera de Santiago?',
        a: 'Nuestra base está en la Región Metropolitana, donde operamos en todas sus comunas, y evaluamos servicios en otras regiones según el tamaño y la duración del contrato.',
      },
    ],
    serviceType: 'Seguridad para condominios y edificios',
    ctaTexto: 'Cotizar seguridad para mi condominio',
  },
  {
    slug: 'guardias-para-eventos',
    nav: 'Eventos',
    formSegmento: 'evento',
    seoTitle: 'Guardias para Eventos en Santiago | Invictus Security',
    seoDescription: 'Guardias de seguridad para eventos, conciertos, matrimonios y ferias: control de acceso, revisión y manejo de público. Equipos coordinados. Cotiza en 24 h.',
    eyebrow: 'Seguridad para eventos',
    h1: 'Guardias de seguridad para eventos, ',
    h1Accent: 'del montaje al cierre',
    lead: 'Control de acceso, revisión, manejo de público y resguardo de backstage para conciertos, festivales, matrimonios, ferias y eventos corporativos. Un jefe de seguridad coordina al equipo y a tu producción.',
    bullets: [
      'Control de acceso y verificación de entradas',
      'Equipos dimensionados según aforo y riesgo',
      'Jefe de seguridad coordinado con tu producción',
    ],
    resumen: 'Invictus Security provee guardias para eventos en Santiago y regiones: conciertos, festivales, eventos corporativos, matrimonios y ferias. El personal de seguridad para eventos se dimensiona según el aforo, el tipo de público y el recinto, y lo coordina un jefe de seguridad que trabaja con la producción desde el montaje hasta el desarme. La cotización es gratuita.',
    imagen: imgEvento,
    imagenAlt: 'Personal de seguridad controlando el acceso de público en la entrada de un festival de música nocturno',
    dolores: [
      { titulo: 'Accesos colapsados', texto: 'Filas eternas, entradas falsas y colados: el primer contacto con tu evento define la experiencia.' },
      { titulo: 'Incidentes sin protocolo', texto: 'Una pelea, una avalancha o una emergencia médica sin un equipo preparado puede arruinar el evento y tu reputación.' },
      { titulo: 'Personal improvisado', texto: 'Guardias reclutados a última hora, sin acreditación ni coordinación con la producción.' },
    ],
    incluye: [
      { titulo: 'Plan de seguridad del evento', texto: 'Definimos puestos, accesos, rutas de evacuación y dotación según aforo, recinto y tipo de público.' },
      { titulo: 'Control de acceso', texto: 'Verificación de entradas y acreditaciones, revisión de bolsos y control de aforo por sector.' },
      { titulo: 'Manejo de público', texto: 'Ordenamiento de filas, contención frente a escenario y resguardo de zonas restringidas y backstage.' },
      { titulo: 'Jefe de seguridad', texto: 'Un responsable único que coordina al equipo con la producción, por radio y en terreno.' },
      { titulo: 'Resguardo de montaje y desarme', texto: 'Protegemos equipos, escenarios y mercadería antes, durante y después del evento.' },
      { titulo: 'Coordinación con servicios de emergencia', texto: 'Protocolos con primeros auxilios y servicios de emergencia para responder rápido ante incidentes.' },
    ],
    recintos: ['Conciertos y festivales', 'Eventos corporativos', 'Matrimonios y eventos privados', 'Ferias y exposiciones', 'Eventos deportivos', 'Lanzamientos y activaciones'],
    faqs: [
      {
        q: '¿Cuántos guardias necesito para un evento?',
        a: 'Depende del aforo, del tipo de público, del recinto y de si se vende alcohol. Un matrimonio o evento corporativo puede requerir pocos guardias para el acceso, mientras un concierto masivo necesita equipos por sector, contención y jefatura. Definimos la dotación en la cotización, según el plan de seguridad del evento.',
      },
      {
        q: '¿Con cuánta anticipación debo contratar la seguridad?',
        a: 'Lo ideal es cotizar al menos 2 a 3 semanas antes, y con más anticipación si el evento es masivo y requiere un plan de seguridad para la autoridad. Para eventos pequeños podemos coordinar en plazos más cortos según disponibilidad.',
      },
      {
        q: '¿Pueden contratarse guardias solo por unas horas?',
        a: 'Sí. Ofrecemos servicios por evento, desde unas pocas horas hasta producciones de varios días, incluyendo el resguardo del montaje y el desarme.',
      },
      {
        q: '¿Qué permisos de seguridad necesita un evento masivo?',
        a: 'Los eventos masivos suelen requerir autorización de la Delegación Presidencial y del municipio, que pueden exigir un plan de seguridad. Te ayudamos a definir la dotación y los procedimientos que ese plan necesita.',
      },
      {
        q: '¿Cuánto cuesta la seguridad para un evento?',
        a: 'El valor depende de la duración, la cantidad de guardias y jefaturas, el horario y los requerimientos especiales, como revisión de público o resguardo nocturno del montaje. Te enviamos una cotización por evento en menos de 24 horas hábiles.',
      },
      {
        q: '¿Trabajan eventos fuera de Santiago?',
        a: 'Sí, evaluamos eventos en otras regiones según la duración, la dotación y los plazos. Cuéntanos la fecha y el lugar al cotizar.',
      },
    ],
    serviceType: 'Seguridad para eventos',
    ctaTexto: 'Cotizar seguridad para mi evento',
  },
  {
    slug: 'seguridad-para-empresas',
    nav: 'Empresas e industrias',
    formSegmento: 'empresa',
    seoTitle: 'Seguridad Privada para Empresas | Invictus Security',
    seoDescription: 'Seguridad privada para empresas, oficinas, bodegas e industrias: control de acceso, rondas y prevención de pérdidas. Guardias acreditados. Cotiza en 24 h.',
    eyebrow: 'Seguridad corporativa',
    h1: 'Seguridad privada para empresas, ',
    h1Accent: 'bodegas e industrias',
    lead: 'Protegemos oficinas, centros de distribución, plantas y retail con guardias acreditados, control de acceso de personas y vehículos, rondas y prevención de pérdidas. Cumpliendo la normativa laboral y de seguridad privada.',
    bullets: [
      'Control de acceso de personas, vehículos y carga',
      'Prevención de pérdidas y rondas en turnos críticos',
      'Contratos, cotizaciones y certificados al día',
    ],
    resumen: 'Invictus Security presta servicios de seguridad privada a empresas en la Región Metropolitana: oficinas corporativas, bodegas y centros logísticos, plantas industriales y retail. El servicio combina guardias acreditados, control de acceso de personas y vehículos, rondas y reportes, con supervisión en terreno y cumplimiento laboral documentado. La cotización es gratuita.',
    imagen: imgEmpresa,
    imagenAlt: 'Guardia de seguridad controlando el ingreso de un camión en la barrera de un centro logístico al atardecer',
    dolores: [
      { titulo: 'Pérdidas y mermas', texto: 'Robos hormiga, carga que no cuadra y accesos de vehículos sin control golpean directo tu margen.' },
      { titulo: 'Riesgo laboral del contratista', texto: 'Si tu empresa de seguridad no paga cotizaciones, la ley puede hacer responder a tu empresa por esas deudas.' },
      { titulo: 'Turnos nocturnos sin control', texto: 'Las instalaciones quedan más expuestas de noche y en fines de semana, justo cuando hay menos supervisión.' },
    ],
    incluye: [
      { titulo: 'Control de acceso', texto: 'Registro de personas, vehículos y proveedores; verificación de guías de despacho y salidas de carga.' },
      { titulo: 'Prevención de pérdidas', texto: 'Procedimientos de revisión y puntos de control acordados con tu operación para reducir mermas.' },
      { titulo: 'Rondas programadas', texto: 'Recorridos por perímetro, bodegas y estacionamientos, especialmente en horarios nocturnos y fines de semana.' },
      { titulo: 'Reportes de gestión', texto: 'Bitácora de novedades e informes periódicos para tu jefatura de operaciones o administración.' },
      { titulo: 'Cumplimiento documentado', texto: 'Contratos, cotizaciones previsionales y certificados de cumplimiento laboral disponibles para tu empresa.' },
      { titulo: 'Escoltas y PPI', texto: 'Protección de ejecutivos y personas importantes, con discreción y planificación de traslados.' },
    ],
    recintos: ['Oficinas corporativas', 'Bodegas y centros logísticos', 'Plantas industriales', 'Retail y locales comerciales', 'Obras de construcción', 'Colegios y universidades', 'Clínicas y centros médicos', 'Hoteles'],
    faqs: [
      {
        q: '¿Qué servicios de seguridad privada necesita una empresa?',
        a: 'La mayoría parte por guardias para el control de acceso de personas y vehículos, rondas en horarios críticos y un registro de novedades. Según el giro se agregan la prevención de pérdidas, la revisión de carga, la protección de ejecutivos (PPI) o la seguridad para eventos corporativos.',
      },
      {
        q: '¿Mi empresa es responsable si el contratista de seguridad no paga cotizaciones?',
        a: 'Puede serlo. Según la Ley 20.123 de Subcontratación, la empresa mandante puede responder por las obligaciones laborales y previsionales del contratista. Por eso conviene exigir el certificado F30-1 de la Dirección del Trabajo y contratos con cotizaciones al día.',
      },
      {
        q: '¿Qué cambia para las empresas con la Ley 21.659 de Seguridad Privada?',
        a: 'La Ley 21.659, vigente desde el 28 de noviembre de 2025, ordena todo el sistema de seguridad privada bajo la Subsecretaría de Prevención del Delito, con Carabineros como fiscalizador. Para quien contrata, lo clave es trabajar con empresas y guardias autorizados según la nueva ley.',
      },
      {
        q: '¿Pueden cubrir turnos solo de noche o fines de semana?',
        a: 'Sí. Diseñamos la cobertura según los horarios de mayor riesgo de tu operación: solo noches, fines de semana, turnos 24/7 o refuerzos puntuales.',
      },
      {
        q: '¿Cuánto cuesta la seguridad privada para una empresa?',
        a: 'Depende de las horas de cobertura, del número de puestos y accesos, del sistema de turnos y de los servicios adicionales, como rondas, reportes o prevención de pérdidas. Visitamos tu instalación y te enviamos una propuesta en menos de 24 horas hábiles.',
      },
      {
        q: '¿Ofrecen protección de ejecutivos (PPI)?',
        a: 'Sí. Brindamos escoltas y protección de personas importantes con planificación de traslados, discreción y coordinación con la seguridad de tu empresa.',
      },
    ],
    serviceType: 'Seguridad privada para empresas',
    ctaTexto: 'Cotizar seguridad para mi empresa',
  },
];

export const segmentoPorSlug = Object.fromEntries(segmentos.map((s) => [s.slug, s]));
