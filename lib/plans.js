// lib/plans.js
// Single source of truth para los planes de ArchPortal.
// Si cambias algo aquí, se refleja en el landing, RegisterModal y stripe/checkout.

export const PLAN_KEYS = ['mensual', 'trimestral', 'anual', 'monthly', 'quarterly', 'annual']

// Mapeo bilingue: las keys ES y EN apuntan al mismo precio en Stripe
export const PLAN_KEY_MAP = {
  mensual: 'mensual',
  trimestral: 'trimestral',
  anual: 'anual',
  monthly: 'mensual',
  quarterly: 'trimestral',
  annual: 'anual',
}

// Datos comunes (precio, proyectos, env key del precio en Stripe)
const PLAN_BASE = {
  mensual:    { priceMXN: 840,   proyectos: 1,  envKey: 'STRIPE_PRICE_BASICO',   shortKey: 'basico'   },
  trimestral: { priceMXN: 1800,  proyectos: 5,  envKey: 'STRIPE_PRICE_PRO',      shortKey: 'pro'      },
  anual:      { priceMXN: 3000,  proyectos: 20, envKey: 'STRIPE_PRICE_DESPACHO', shortKey: 'despacho' },
}

export function getPlanBase(plan) {
  const canonical = PLAN_KEY_MAP[plan] || 'mensual'
  return { canonical, ...PLAN_BASE[canonical] }
}

// Features comunes a TODOS los planes — la única diferencia es la cantidad de proyectos.
const COMMON_FEATURES_ES = [
  'Portal cliente incluido',
  'Soporte con IA',
  'Bitácora visual',
  'Control de costos',
  'Cronograma de obra',
  'Notificaciones automáticas',
]
const COMMON_FEATURES_EN = [
  'Client portal included',
  'AI support',
  'Visual log',
  'Cost control',
  'Project schedule',
  'Automatic notifications',
]

// Para el landing — features iguales, primer item es la cantidad de proyectos
export function getPlansForLanding(lang) {
  const isEn = lang === 'en'
  const period = isEn ? 'MXN / month' : 'MXN / mes'
  const formatPrice = (n) => '$' + n.toLocaleString('en-US')
  const proyectosLabel = (n) => isEn
    ? (n === 1 ? '1 active project' : `Up to ${n} active projects`)
    : (n === 1 ? '1 proyecto activo' : `Hasta ${n} proyectos activos`)
  const features = isEn ? COMMON_FEATURES_EN : COMMON_FEATURES_ES

  if (isEn) {
    return [
      {
        key: 'monthly',
        label: 'Basic',
        price: formatPrice(PLAN_BASE.mensual.priceMXN),
        period,
        features: [proyectosLabel(PLAN_BASE.mensual.proyectos), ...features],
        featured: false,
      },
      {
        key: 'quarterly',
        label: 'Pro',
        price: formatPrice(PLAN_BASE.trimestral.priceMXN),
        period,
        features: [proyectosLabel(PLAN_BASE.trimestral.proyectos), ...features],
        featured: true,
        badge: 'Most popular',
      },
      {
        key: 'annual',
        label: 'Firm',
        price: formatPrice(PLAN_BASE.anual.priceMXN),
        period,
        features: [proyectosLabel(PLAN_BASE.anual.proyectos), ...features],
        featured: false,
      },
    ]
  }

  return [
    {
      key: 'mensual',
      label: 'Básico',
      price: formatPrice(PLAN_BASE.mensual.priceMXN),
      period,
      features: [proyectosLabel(PLAN_BASE.mensual.proyectos), ...features],
      featured: false,
    },
    {
      key: 'trimestral',
      label: 'Pro',
      price: formatPrice(PLAN_BASE.trimestral.priceMXN),
      period,
      features: [proyectosLabel(PLAN_BASE.trimestral.proyectos), ...features],
      featured: true,
      badge: 'Más popular',
    },
    {
      key: 'anual',
      label: 'Despacho',
      price: formatPrice(PLAN_BASE.anual.priceMXN),
      period,
      features: [proyectosLabel(PLAN_BASE.anual.proyectos), ...features],
      featured: false,
    },
  ]
}

// Para el RegisterModal — info compacta del plan seleccionado
export function getPlanInfo(plan, lang) {
  const isEn = lang === 'en'
  const base = getPlanBase(plan)
  const period = isEn ? 'MXN / month' : 'MXN / mes'
  const limitText = (n) => isEn
    ? (n === 1 ? '1 active project' : `Up to ${n} projects`)
    : (n === 1 ? '1 proyecto activo' : `Hasta ${n} proyectos`)
  const labelMap = {
    mensual: isEn ? 'Basic Plan' : 'Plan Básico',
    trimestral: isEn ? 'Pro Plan' : 'Plan Pro',
    anual: isEn ? 'Firm Plan' : 'Plan Despacho',
  }
  return {
    label: labelMap[base.canonical],
    price: `$${base.priceMXN.toLocaleString('en-US')} ${period}`,
    limit: limitText(base.proyectos),
  }
}

// Para Stripe checkout — leer el price ID de env
export function getStripePriceEnvKey(plan) {
  return getPlanBase(plan).envKey
}
