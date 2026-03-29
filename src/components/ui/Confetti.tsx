import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ConfettiPiece {
  id: number
  x: number
  color: string
  delay: number
  rotation: number
}

export function Confetti({ active }: { active: boolean }) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([])

  useEffect(() => {
    if (!active) { setPieces([]); return }
    const colors = ['#F4A261', '#E76F51', '#1B4965', '#CAE9FF', '#10B981', '#FFD700']
    const newPieces = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.5,
      rotation: Math.random() * 360,
    }))
    setPieces(newPieces)
    const timer = setTimeout(() => setPieces([]), 3000)
    return () => clearTimeout(timer)
  }, [active])

  return (
    <AnimatePresence>
      {pieces.map(piece => (
        <motion.div
          key={piece.id}
          initial={{ y: -20, x: `${piece.x}vw`, opacity: 1, rotate: 0 }}
          animate={{ y: '100vh', rotate: piece.rotation + 720, opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2.5, delay: piece.delay, ease: 'easeIn' }}
          className="fixed top-0 z-50 pointer-events-none"
          style={{ width: 10, height: 10, backgroundColor: piece.color, borderRadius: '2px' }}
        />
      ))}
    </AnimatePresence>
  )
}
