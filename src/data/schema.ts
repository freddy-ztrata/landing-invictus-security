/**
 * Schema.org @graph. El nodo de negocio es SIEMPRE el mismo (@id estable) en todas las páginas
 * para que Google y los motores de IA lo resuelvan como una sola entidad.
 * "SecurityService" NO existe en schema.org: usamos LocalBusiness + ProfessionalService.
 */
import { empresa, SITE_URL, comunasFormulario } from './empresa';
import type { Faq } from './segmentos';

export const ORG_ID = `${SITE_URL}/#organizacion`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

export function nodoNegocio() {
  const node: Record<string, unknown> = {
    '@type': ['LocalBusiness', 'ProfessionalService'],
    '@id': ORG_ID,
    name: empresa.nombre,
    description:
      'Empresa de seguridad privada en Chile con base en la Región Metropolitana: guardias de seguridad para condominios, empresas, bodegas, industrias y eventos, con supervisión 24/7.',
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/img/logo-invictus.png`,
    image: `${SITE_URL}/img/og/home.jpg`,
    telephone: empresa.telefono,
    email: empresa.email,
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: empresa.direccion.calle,
      addressLocality: empresa.direccion.comuna,
      addressRegion: empresa.direccion.region,
      postalCode: empresa.direccion.codigoPostal,
      addressCountry: empresa.direccion.pais,
    },
    geo: { '@type': 'GeoCoordinates', latitude: empresa.geo.lat, longitude: empresa.geo.lng },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: empresa.horarioComercial.abre,
      closes: empresa.horarioComercial.cierra,
    },
    areaServed: [
      { '@type': 'AdministrativeArea', name: 'Región Metropolitana de Santiago' },
      ...comunasFormulario.filter((c) => c !== 'Otra región').map((c) => ({ '@type': 'City', name: c })),
      { '@type': 'Country', name: 'Chile' },
    ],
    knowsAbout: [
      'Guardias de seguridad privada',
      'Seguridad para condominios',
      'Seguridad para eventos',
      'Seguridad corporativa',
      'Control de acceso',
      'Protección de personas importantes (PPI)',
      'Ley 21.659 de Seguridad Privada',
    ],
  };
  if (empresa.sameAs.length) node.sameAs = empresa.sameAs;
  if (empresa.razonSocial) node.legalName = empresa.razonSocial;
  if (empresa.rut) node.taxID = empresa.rut;
  if (empresa.anioFundacion) node.foundingDate = String(empresa.anioFundacion);
  if (empresa.autorizacion.numero) {
    node.hasCertification = {
      '@type': 'Certification',
      name: 'Autorización de empresa de seguridad privada',
      certificationIdentification: empresa.autorizacion.numero,
      issuedBy: { '@type': 'GovernmentOrganization', name: empresa.autorizacion.entidad },
    };
  }
  return node;
}

export function nodoWebsite() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: `${SITE_URL}/`,
    name: empresa.nombre,
    inLanguage: 'es-CL',
    publisher: { '@id': ORG_ID },
  };
}

export function nodoServicio(opts: { nombre: string; tipo: string; url: string; descripcion: string }) {
  return {
    '@type': 'Service',
    '@id': `${opts.url}#servicio`,
    name: opts.nombre,
    serviceType: opts.tipo,
    description: opts.descripcion,
    url: opts.url,
    provider: { '@id': ORG_ID },
    areaServed: { '@type': 'AdministrativeArea', name: 'Región Metropolitana de Santiago' },
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: `${SITE_URL}/cotizar/`,
      servicePhone: { '@type': 'ContactPoint', telephone: empresa.telefono, contactType: 'sales', areaServed: 'CL', availableLanguage: 'es' },
    },
  };
}

export function nodoFaq(faqs: readonly Faq[], url: string) {
  return {
    '@type': 'FAQPage',
    '@id': `${url}#faq`,
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function nodoBreadcrumb(items: { nombre: string; url: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.nombre, item: it.url })),
  };
}

export function nodoPagina(opts: { url: string; titulo: string; descripcion: string; tipo?: string; actualizado?: string }) {
  return {
    '@type': opts.tipo ?? 'WebPage',
    '@id': `${opts.url}#pagina`,
    url: opts.url,
    name: opts.titulo,
    description: opts.descripcion,
    inLanguage: 'es-CL',
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': ORG_ID },
    ...(opts.actualizado ? { dateModified: opts.actualizado } : {}),
  };
}
