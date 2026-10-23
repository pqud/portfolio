export function IntroScene({ lead, role }: { lead: string; role: string }) {
  return (
    <div className="center-copy">
      <p>{lead}</p>
      <p className="dim">{role}</p>
    </div>
  )
}
