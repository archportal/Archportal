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

// Datos comunes (precio, proyectos, label corto)
const PLAN_BASE = {
  mensual:    { priceMXN: 840,   proyectos: 1,  envKey: 'STRIPE_PRICE_BASICO',   shortKey: 'basico'   },
  trimestral: { priceMXN: 1800,  proyectos: 5,  envKey: 'STRIPE_PRICE_PRO',      shortKey: 'pro'      },
  anual:      { priceMXN: 3000,  proyectos: 20, envKey: 'STRIPE_PRICE_DESPACHO', shortKey: 'despacho' },
}

export function getPlanBase(plan) {
  const canonical = PLAN_KEY_MAP[plan] || 'mensual'
  return { canonical, ...PLAN_BASE[canonical] }
}

// Para el landing — features diferenciadas entre planes
export function getPlansForLanding(lang) {
  const isEn = lang === 'en'
  const period = isEn ? 'MXN / month' : 'MXN / mes'
  const formatPrice = (n) => '$' + n.toLocaleString('en-US')

  if (isEn) {
    return [
      {
        key: 'monthly',
        label: 'Basic',
        price: formatPrice(PLAN_BASE.mensual.priceMXN),
        period,
        features: [
          '1 active project',
          'Client portal included',
          'AI support',
          'Visual log',
          '5 GB storage',
          'Email support',
        ],
        featured: false,
      },
      {
        key: 'quarterly',
        label: 'Pro',
        price: formatPrice(PLAN_BASE.trimestral.priceMXN),
        period,
        features: [
          'Up to 5 active projects',
          'Everything in Basic',
          '25 GB storage',
          'Up to 2 collaborators',
          'Monthly client reports',
          'Priority support',
        ],
        featured: true,
        badge: 'Most popular',
      },
      {
        key: 'annual',
        label: 'Firm',
        price: formatPrice(PLAN_BASE.anual.priceMXN),
        period,
        features: [
          'Up to 20 active projects',
          'Everything in Pro',
          '100 GB storage',
          'Unlimited collaborators',
          'Your firm logo on client portal',
          'Personal 1:1 onboarding',
        ],
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
      features: [
        '1 proyecto activo',
        'Portal cliente incluido',
        'Soporte con IA',
        'Bitácora visual',
        'Almacenamiento 5 GB',
        'Soporte por email',
      ],
      featured: false,
    },
    {
      key: 'trimestral',
      label: 'Pro',
      price: formatPrice(PLAN_BASE.trimestral.priceMXN),
      period,
      features: [
        'Hasta 5 proyectos activos',
        'Todo lo del plan Básico',
        'Almacenamiento 25 GB',
        'Hasta 2 colaboradores',
        'Reportes mensuales del proyecto',
        'Soporte prioritario',
      ],
      featured: true,
      badge: 'Más popular',
    },
    {
      key: 'anual',
      label: 'Despacho',
      price: formatPrice(PLAN_BASE.anual.priceMXN),
      period,
      features: [
        'Hasta 20 proyectos activos',
        'Todo lo del plan Pro',
        'Almacenamiento 100 GB',
        'Colaboradores ilimitados',
        'Logo de tu despacho en el portal',
        'Onboarding 1:1 inicial',
      ],
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
