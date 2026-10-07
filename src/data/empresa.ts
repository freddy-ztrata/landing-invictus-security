/**
 * Datos de la entidad "Invictus Security" — fuente única para el sitio, el schema JSON-LD,
 * llms.txt y (manualmente) Google Business Profile. Mantener idénticos en todos lados (GEO).
 *
 * ⚠️ VERACIDAD: todo lo marcado `verificado: false` proviene del sitio anterior y está
 * PENDIENTE de confirmación escrita del cliente (plan §8). Si el cliente no lo confirma,
 * se retira (riesgo de política "Misrepresentation" de Google Ads).
 */

export const SITE_URL = 'https://invictussecurity.cl';

export const empresa = {
  nombre: 'Invictus Security',
  // Pendientes del cliente (no se publican mientras sean null):
  razonSocial: null as string | null,
  rut: null as string | null,
  anioFundacion: null as number | null,
  autorizacion: {
    // N° de resolución / autorización bajo la Ley 21.659 (o resolución OS-10 vigente en régimen transitorio)
    numero: null as string | null,
    entidad: 'Subsecretaría de Prevención del Delito (Ley 21.659)',
  },
  telefono: '+56957620565',
  telefonoVisible: '+56 9 5762 0565',
  email: 'comercial@invictussecurity.cl',
  direccion: {
    calle: 'Vicuña Mackenna 4205, Of. N°14',
    comuna: 'Peñaflor',
    region: 'Región Metropolitana',
    codigoPostal: '9750000',
    pais: 'CL',
  },
  geo: { lat: -33.6112046, lng: -70.8893049 },
  horarioComercial: { dias: 'Lunes a viernes', abre: '09:00', cierra: '19:00' },
  operacion: '24/7, los 365 días',
  respuestaCotizacion: 'menos de 24 horas hábiles',
  despliegue: 'Entre 48 y 72 horas tras la firma del contrato',
  sameAs: [] as string[], // Pendiente: URL de Google Business Profile, LinkedIn, Instagram.
} as const;

export const cifras = [
  { valor: 200, prefijo: '+', sufijo: '', etiqueta: 'guardias en operación', verificado: false },
  { valor: 150, prefijo: '+', sufijo: '', etiqueta: 'empresas y comunidades protegidas', verificado: false },
  { valor: 24, prefijo: '', sufijo: '/7', etiqueta: 'operación y supervisión', verificado: true },
  { valor: 100, prefijo: '', sufijo: '%', etiqueta: 'personal con credencial vigente', verificado: false },
] as const;

/** Testimonios del sitio anterior. verificado:false → confirmar con el cliente o retirar. */
export const testimonios = [
  {
    texto: 'Llevamos 8 meses con Invictus Security en nuestro edificio y la diferencia es notable. Los guardias son puntuales, profesionales y el sistema de rondas nos da total visibilidad.',
    nombre: 'Roberto Mendoza',
    cargo: 'Administrador, Edificio Parque Central',
    segmento: 'condominios',
    verificado: false,
  },
  {
    texto: 'Contratamos el servicio para un festival de 3 días con más de 5.000 personas. El equipo manejó todo el control de acceso y no tuvimos ni un solo incidente grave. Los volveremos a llamar.',
    nombre: 'Carolina Vásquez',
    cargo: 'Productora Ejecutiva, Eventos Sur SpA',
    segmento: 'eventos',
    verificado: false,
  },
  {
    texto: 'Lo que más valoro es que todos sus guardias tienen la credencial al día. Con la empresa anterior tuvimos una fiscalización y no cumplían. Con Invictus dormimos tranquilos.',
    nombre: 'Francisco Araya',
    cargo: 'Gerente de Operaciones, Logística Pacífico',
    segmento: 'empresas',
    verificado: false,
  },
] as const;

/** Comunas de la Región Metropolitana con coordenadas aproximadas (centroide) para el mapa de cobertura. */
export const comunasRM: { nombre: string; lat: number; lng: number }[] = [
  { nombre: 'Santiago', lat: -33.447, lng: -70.657 },
  { nombre: 'Providencia', lat: -33.431, lng: -70.611 },
  { nombre: 'Las Condes', lat: -33.411, lng: -70.567 },
  { nombre: 'Vitacura', lat: -33.389, lng: -70.585 },
  { nombre: 'Lo Barnechea', lat: -33.353, lng: -70.518 },
  { nombre: 'Ñuñoa', lat: -33.456, lng: -70.598 },
  { nombre: 'La Reina', lat: -33.449, lng: -70.541 },
  { nombre: 'Peñalolén', lat: -33.486, lng: -70.553 },
  { nombre: 'Macul', lat: -33.491, lng: -70.599 },
  { nombre: 'La Florida', lat: -33.523, lng: -70.588 },
  { nombre: 'Puente Alto', lat: -33.611, lng: -70.575 },
  { nombre: 'San Joaquín', lat: -33.497, lng: -70.627 },
  { nombre: 'San Miguel', lat: -33.497, lng: -70.651 },
  { nombre: 'La Cisterna', lat: -33.529, lng: -70.662 },
  { nombre: 'La Granja', lat: -33.537, lng: -70.622 },
  { nombre: 'San Ramón', lat: -33.541, lng: -70.643 },
  { nombre: 'El Bosque', lat: -33.562, lng: -70.674 },
  { nombre: 'La Pintana', lat: -33.584, lng: -70.633 },
  { nombre: 'San Bernardo', lat: -33.593, lng: -70.699 },
  { nombre: 'Lo Espejo', lat: -33.522, lng: -70.689 },
  { nombre: 'Pedro Aguirre Cerda', lat: -33.488, lng: -70.674 },
  { nombre: 'Estación Central', lat: -33.459, lng: -70.692 },
  { nombre: 'Cerrillos', lat: -33.498, lng: -70.716 },
  { nombre: 'Maipú', lat: -33.51, lng: -70.757 },
  { nombre: 'Quinta Normal', lat: -33.428, lng: -70.698 },
  { nombre: 'Lo Prado', lat: -33.444, lng: -70.725 },
  { nombre: 'Pudahuel', lat: -33.441, lng: -70.759 },
  { nombre: 'Cerro Navia', lat: -33.423, lng: -70.744 },
  { nombre: 'Renca', lat: -33.405, lng: -70.728 },
  { nombre: 'Quilicura', lat: -33.361, lng: -70.729 },
  { nombre: 'Independencia', lat: -33.416, lng: -70.665 },
  { nombre: 'Recoleta', lat: -33.406, lng: -70.639 },
  { nombre: 'Conchalí', lat: -33.384, lng: -70.674 },
  { nombre: 'Huechuraba', lat: -33.37, lng: -70.636 },
  { nombre: 'Colina', lat: -33.201, lng: -70.675 },
  { nombre: 'Lampa', lat: -33.286, lng: -70.876 },
  { nombre: 'Padre Hurtado', lat: -33.573, lng: -70.815 },
  { nombre: 'Peñaflor', lat: -33.611, lng: -70.889 },
  { nombre: 'Talagante', lat: -33.664, lng: -70.927 },
  { nombre: 'Calera de Tango', lat: -33.629, lng: -70.784 },
  { nombre: 'Buin', lat: -33.732, lng: -70.743 },
  { nombre: 'Pirque', lat: -33.636, lng: -70.548 },
];

/** Las 52 comunas de la RM (autocompletado del formulario). */
export const comunasFormulario = [
  'Alhué', 'Buin', 'Calera de Tango', 'Cerrillos', 'Cerro Navia', 'Colina', 'Conchalí', 'Curacaví',
  'El Bosque', 'El Monte', 'Estación Central', 'Huechuraba', 'Independencia', 'Isla de Maipo', 'La Cisterna',
  'La Florida', 'La Granja', 'La Pintana', 'La Reina', 'Lampa', 'Las Condes', 'Lo Barnechea', 'Lo Espejo',
  'Lo Prado', 'Macul', 'Maipú', 'María Pinto', 'Melipilla', 'Ñuñoa', 'Padre Hurtado', 'Paine',
  'Pedro Aguirre Cerda', 'Peñaflor', 'Peñalolén', 'Pirque', 'Providencia', 'Pudahuel', 'Puente Alto',
  'Quilicura', 'Quinta Normal', 'Recoleta', 'Renca', 'San Bernardo', 'San Joaquín', 'San José de Maipo',
  'San Miguel', 'San Pedro', 'San Ramón', 'Santiago', 'Talagante', 'Tiltil', 'Vitacura',
  'Otra región',
];
