type Item = { label: string; scene: number }

export function Nav({
  name,
  items,
  scene,
  onGo,
}: {
  name: string
  items: Item[]
  scene: number
  onGo: (scene: number) => void
}) {
  return (
    <header className="top">
      <p className="brand">{name}</p>
      <nav>
        {items.map((item) => {
          const on = item.scene === 3 ? scene === 3 || scene === 4 : item.scene === scene
          return (
            <button key={item.label} className={on ? 'on' : ''} onClick={() => onGo(item.scene)}>
              {item.label}
            </button>
          )
        })}
      </nav>
    </header>
  )
}
