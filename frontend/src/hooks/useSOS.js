import { useEffect, useRef, useCallback } from 'react'

const beepSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const play = (freq, start, dur) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.frequency.value = freq
      o.type = 'square'
      g.gain.setValueAtTime(0.4, ctx.currentTime + start)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur)
      o.start(ctx.currentTime + start)
      o.stop(ctx.currentTime + start + dur)
    }
    play(880, 0, 0.18); play(660, 0.2, 0.18); play(880, 0.4, 0.18); play(660, 0.6, 0.18)
  } catch {}
}

export function useSOS({ socket, isAdmin, onAlert }) {
  const intervalRef = useRef(null)
  const activeRef = useRef(false)

  const stopSound = useCallback(() => {
    clearInterval(intervalRef.current)
    activeRef.current = false
  }, [])

  const startSound = useCallback(() => {
    if (activeRef.current) return
    activeRef.current = true
    beepSound()
    intervalRef.current = setInterval(() => {
      if (activeRef.current) beepSound()
    }, 5000)
  }, [])

  const sendBrowserNotif = useCallback((alert) => {
    if (!('Notification' in window)) return
    const send = () => new Notification('🚨 EMERGENCY SOS', {
      body: `${alert.raisedBy} · Flat ${alert.flatNumber} · ${alert.type}`,
      icon: '/favicon.ico',
      requireInteraction: true,
    })
    if (Notification.permission === 'granted') send()
    else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(p => { if (p === 'granted') send() })
    }
  }, [])

  useEffect(() => {
    if (!socket || !isAdmin) return
    const handler = (data) => {
      startSound()
      sendBrowserNotif(data)
      onAlert(data)
    }
    socket.on('sos_alert', handler)
    return () => socket.off('sos_alert', handler)
  }, [socket, isAdmin, startSound, sendBrowserNotif, onAlert])

  useEffect(() => () => stopSound(), [stopSound])

  return { stopSound }
}
