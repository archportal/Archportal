'use client'

function fmt(n) { return '$' + Number(n || 0).toLocaleString('es-MX') }

export default function Costos({ project, lang }) {
  const p = project?.project || project || {}
  const costs = project?.costs || p.costs || p.costos || []

  const presupuesto = p.presupuesto || 0
  const ejercido = p.pres_ejercido || 0
  const pagado = p.pres_pagado || 0
  const porPagar = Math.max(0, ejercido - pagado)
  const pendientes = costs.filter(c => c.estatus === 'Pendiente').length

  return (
    <div>
      <div style={{ paddingBottom: 24, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 300, color: 'var(--ink)', marginBottom: 4 }}>Control de costos</h1>
        <p style={{ fontSize: 13, fontWeight: 300, color: 'var(--g400)' }}>Presupuesto y gastos</p>
      </div>

      <div className="metrics-grid" style={{ marginBottom: 24 }}>
        {[
          ['Presupuesto', fmt(presupuesto), 'MXN aprobado'],
          ['Ejercido', fmt(ejercido), presupuesto > 0 ? Math.round(ejercido/presupuesto*100)+'% del presupuesto' : ''],
          ['Pagado', fmt(pagado), 'Liquidado'],
          ['Por pagar', fmt(porPagar), pendientes + ' pago(s) pendiente(s)'],
        ].map(([label, val, sub]) => (
          <div key={label} className="metric-card">
            <div className="metric-label">{label}</div>
            <div className="metric-value">{val}</div>
            {sub && <div className="metric-sub">{sub}</div>}
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-title">Detalle de gastos</div>
        {costs.length === 0 ? (
          <p style={{ fontSize: 13, fontWeight: 300, color: 'var(--g400)' }}>Sin gastos registrados</p>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Concepto','Categoría','Etapa','Monto','Estatus','Fecha'].map(h => (
                    <th key={h} style={{ textAlign: 'left', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--g400)', padding: '8px 12px 8px 0', fontWeight: 400 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {costs.map((c, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 12px 12px 0', fontSize: 13, fontWeight: 300, color: 'var(--ink)' }}>{c.concepto}</td>
                    <td style={{ padding: '12px 12px 12px 0', fontSize: 12, color: 'var(--g500)' }}>{c.categoria}</td>
                    <td style={{ padding: '12px 12px 12px 0', fontSize: 12, color: 'var(--g500)' }}>{c.etapa}</td>
                    <td style={{ padding: '12px 12px 12px 0', fontSize: 13, fontWeight: 400, color: 'var(--ink)' }}>{fmt(c.monto)}</td>
                    <td style={{ padding: '12px 12px 12px 0' }}>
                      <span style={{ fontSize: 9, padding: '3px 8px', background: c.estatus === 'Pagado' ? '#EBF2E4' : c.estatus === 'Parcial' ? '#FEF4E4' : '#FBE4E4', color: c.estatus === 'Pagado' ? '#2D5016' : c.estatus === 'Parcial' ? '#7A4A00' : '#7A0000' }}>{c.estatus}</span>
                    </td>
                    <td style={{ padding: '12px 0', fontSize: 12, color: 'var(--g400)' }}>{c.fecha}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0 0', borderTop: '1px solid var(--border)', marginTop: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>Total ejercido</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{fmt(ejercido)} MXN</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
