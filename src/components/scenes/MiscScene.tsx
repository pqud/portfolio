import type { Card } from '../../content/types'
import { InfoCard } from '../InfoCard'

export function MiscScene({ cards, active }: { cards: Card[]; active: boolean }) {
  const pane = active ? { 'data-pane': '' } : {}
  return (
    <>
      <h2 className="display left small">기타</h2>
      <div className="pane cards" {...pane}>
        {cards.map((card) => (
          <InfoCard key={card.title} {...card} />
        ))}
      </div>
    </>
  )
}
