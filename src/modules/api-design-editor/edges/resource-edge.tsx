import { memo, useState } from 'react'
import {
  BaseEdge,
  getBezierPath,
  Position,
  type EdgeProps,
} from '@xyflow/react'
import { useTranslations } from 'next-intl'
import type { ResourceEdgeData } from './compute-edges'

const NODE_W = 256
const NODE_H = 80

type Rect = { x: number; y: number; w: number; h: number }
type Side = 'left' | 'right' | 'top' | 'bottom'

const SIDE_TO_POSITION: Record<Side, Position> = {
  left: Position.Left,
  right: Position.Right,
  top: Position.Top,
  bottom: Position.Bottom,
}

function closestLrtbPoint(
  rect: Rect,
  px: number,
  py: number,
): { x: number; y: number; side: Side } {
  const cx = rect.x + rect.w / 2
  const cy = rect.y + rect.h / 2

  const candidates: { x: number; y: number; side: Side }[] = [
    { x: rect.x, y: cy, side: 'left' },
    { x: rect.x + rect.w, y: cy, side: 'right' },
    { x: cx, y: rect.y, side: 'top' },
    { x: cx, y: rect.y + rect.h, side: 'bottom' },
  ]

  let best = candidates[0]!
  let bestDist = Infinity

  for (const c of candidates) {
    const dx = c.x - px
    const dy = c.y - py
    const d = dx * dx + dy * dy
    if (d < bestDist) {
      bestDist = d
      best = c
    }
  }

  return best
}

export const ResourceEdge = memo(function ResourceEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  selected,
  style,
}: EdgeProps) {
  const d = data as ResourceEdgeData | undefined
  const [hovered, setHovered] = useState(false)
  const t = useTranslations('Editor')
  const pathOffset = d?.pathOffset ?? 0

  const edgePath = (() => {
    const sourceRect: Rect = {
      x: sourceX - NODE_W,
      y: sourceY - NODE_H / 2,
      w: NODE_W,
      h: NODE_H,
    }
    const targetRect: Rect = {
      x: targetX,
      y: targetY - NODE_H / 2,
      w: NODE_W,
      h: NODE_H,
    }

    const sp = closestLrtbPoint(
      sourceRect,
      targetRect.x + targetRect.w / 2,
      targetRect.y + targetRect.h / 2,
    )
    const tp = closestLrtbPoint(
      targetRect,
      sourceRect.x + sourceRect.w / 2,
      sourceRect.y + sourceRect.h / 2,
    )

    const dx = tp.x - sp.x
    const dy = tp.y - sp.y
    const len = Math.sqrt(dx * dx + dy * dy)
    const perpX = len > 0 ? -dy / len : 1
    const perpY = len > 0 ? dx / len : 0

    const ox = perpX * pathOffset
    const oy = perpY * pathOffset

    const [path] = getBezierPath({
      sourceX: sp.x + ox,
      sourceY: sp.y + oy,
      sourcePosition: SIDE_TO_POSITION[sp.side],
      targetX: tp.x + ox,
      targetY: tp.y + oy,
      targetPosition: SIDE_TO_POSITION[tp.side],
    })

    return path
  })()

  const tooltipText = (() => {
    if (!d) return ''
    const lines: string[] = []
    for (const type of d.types) {
      const label = t(
        `${type}Edge` as 'requestBodyEdge' | 'responseShapeEdge' | 'authEdge',
      )
      lines.push(label)
      for (const ep of d.endpoints) {
        lines.push(`  ${ep.method} ${ep.path}`)
      }
    }
    return lines.join('\n')
  })()

  return (
    <g
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: 'default' }}
    >
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...(style as React.CSSProperties | undefined),
          opacity: selected || hovered ? 1 : 0.7,
        }}
      />
      <title>{tooltipText}</title>
    </g>
  )
})
