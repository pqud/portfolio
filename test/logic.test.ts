import assert from 'node:assert/strict'
import { test } from 'node:test'
import { atPaneEdge, enterScene, freshWheelGate, resolveRoute, stepScene, takeWheel, wheelAction } from '../src/lib/logic.ts'

const known = [
  { id: 'fe', projects: ['harudew', 'dashboard'] },
  { id: 'ai', projects: ['label-bench'] },
]

test('resolveRoute', () => {
  assert.deepEqual(resolveRoute('/', known, 'fe'), { persona: 'fe', projectId: null, scene: 0 })
  assert.deepEqual(resolveRoute('/ai', known, 'fe'), { persona: 'ai', projectId: null, scene: 0 })
  assert.deepEqual(resolveRoute('/fe/harudew', known, 'fe'), { persona: 'fe', projectId: 'harudew', scene: 4 })
  assert.deepEqual(resolveRoute('/nope', known, 'fe'), { redirect: '/' })
  assert.deepEqual(resolveRoute('/fe/missing', known, 'fe'), { redirect: '/' })
})

test('snap and pane', () => {
  assert.equal(stepScene(0, 'up'), 0)
  assert.equal(stepScene(0, 'down'), 1)
  assert.equal(stepScene(5, 'down'), 5)
  assert.equal(enterScene(4, null, 'harudew'), 'harudew')
  assert.equal(enterScene(4, 'dashboard', 'harudew'), 'dashboard')
  assert.equal(enterScene(2, 'dashboard', 'harudew'), 'dashboard')

  const pane = { top: 0, height: 800, client: 400 }
  assert.equal(wheelAction(40, pane), 'pane')
  assert.equal(wheelAction(-40, pane), 'up')
  assert.equal(wheelAction(40, { top: 400, height: 800, client: 400 }), 'down')
  assert.equal(atPaneEdge('down', { top: 0, height: 800, client: 400 }), false)
  assert.equal(atPaneEdge('down', { top: 400, height: 800, client: 400 }), true)
  assert.equal(atPaneEdge('down', null), true)

  const burst = freshWheelGate()
  assert.equal(takeWheel(burst, 0).snap, true)
  assert.equal(takeWheel(burst, 60).snap, false)
  assert.equal(takeWheel(burst, 250).snap, true)

  const drag = freshWheelGate()
  let snaps = 0
  for (let i = 0; i < 8; i += 1) if (takeWheel(drag, 300 + i * 16).snap) snaps += 1
  assert.equal(snaps, 1)
})
