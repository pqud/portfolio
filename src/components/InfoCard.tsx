import type { Card } from '../content/types'

export function InfoCard({ title, body, media }: Card) {
  return (
    <article className="card">
      <h3>{title}</h3>
      <p>{body}</p>
      {media ? <img src={media} alt="" /> : null}
    </article>
  )
}
