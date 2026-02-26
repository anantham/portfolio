/* ================================================================== */
/* MandalaA11y — Screen-reader accessibility layer                     */
/*                                                                     */
/* Provides the full Eightfold Path teaching in semantic HTML,         */
/* hidden visually but accessible to screen readers and assistive      */
/* technology.                                                         */
/* ================================================================== */

import {
  PATH_FACTORS,
  FACTOR_CONNECTIONS,
  PILLAR_CONNECTIONS,
  PILLAR_TO_VIMUTTI,
  PILLARS,
} from '@/data/mandalaData'

// --------------- Component ---------------

export default function MandalaA11y() {
  return (
    <div
      className="sr-only"
      role="region"
      aria-label="The Noble Eightfold Path — an interactive mandala"
    >
      <h2>The Noble Eightfold Path</h2>
      <p>
        An interactive mandala representing the Buddha&apos;s Noble Eightfold
        Path. Eight factors are arranged in a circle, grouped under three
        trainings. Each factor feeds causally into the next, forming a
        continuous cycle of practice leading toward liberation (Vimutti).
      </p>

      <h3>The Three Trainings</h3>
      <ul>
        {(Object.keys(PILLARS) as Array<keyof typeof PILLARS>).map(
          (pillarId) => {
            const pillar = PILLARS[pillarId]
            return (
              <li key={pillarId}>
                {pillar.pali} ({pillar.name})
              </li>
            )
          }
        )}
      </ul>

      <h3>The Eight Factors</h3>
      <ol>
        {PATH_FACTORS.map((factor) => {
          const pillar = PILLARS[factor.pillar]
          return (
            <li key={factor.id}>
              {factor.name} ({factor.pali}) — {pillar.name} training.{' '}
              {factor.illustration}
            </li>
          )
        })}
      </ol>

      <h3>How They Connect</h3>
      <ul>
        {FACTOR_CONNECTIONS.map((conn, i) => {
          const from = PATH_FACTORS[conn.from]
          const to = PATH_FACTORS[conn.to]
          return (
            <li key={i}>
              {from.name} leads to {to.name}: {conn.causalLabel}
            </li>
          )
        })}
      </ul>

      <h3>The Three Trainings Reinforce Each Other</h3>
      <ul>
        {PILLAR_CONNECTIONS.map((conn, i) => {
          const from = PILLARS[conn.from]
          const to = PILLARS[conn.to]
          return (
            <li key={i}>
              {from.name} supports {to.name}: {conn.causalLabel}
            </li>
          )
        })}
      </ul>

      <h3>Each Training Contributes to Liberation</h3>
      <ul>
        {PILLAR_TO_VIMUTTI.map((entry, i) => {
          const pillar = PILLARS[entry.pillar]
          return (
            <li key={i}>
              {pillar.name} contributes: {entry.label}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
