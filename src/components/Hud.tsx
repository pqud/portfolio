import { sceneLabels } from '../content/site'

export function Hud({
  scene,
  soundOn,
  onToggleSound,
}: {
  scene: number
  soundOn: boolean
  onToggleSound: () => void
}) {
  return (
    <footer className="hud">
      <span>
        {String(scene + 1).padStart(2, '0')} / 06 — {sceneLabels[scene]}
      </span>
      <div className="dots" aria-hidden="true">
        {sceneLabels.map((label, index) => (
          <i key={label} className={index === scene ? 'on' : ''} />
        ))}
      </div>
      <button className="sound" onClick={onToggleSound}>
        {soundOn ? '소리 끄기' : '소리 켜기'}
      </button>
    </footer>
  )
}
