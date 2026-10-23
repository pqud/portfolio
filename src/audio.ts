// shortcut: synthesized tone until a real loop file exists.
export function createHum() {
  const ctx = new AudioContext()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const panner = ctx.createStereoPanner()
  osc.type = 'sine'
  osc.frequency.value = 98
  gain.gain.value = 0
  osc.connect(gain)
  gain.connect(panner)
  panner.connect(ctx.destination)
  osc.start()
  return {
    setScene(scene: number) {
      panner.pan.value = scene >= 2 ? -0.55 : 0
    },
    async on() {
      await ctx.resume()
      gain.gain.value = 0.028
    },
    off() {
      gain.gain.value = 0
    },
    close() {
      osc.stop()
      void ctx.close()
    },
  }
}
