import * as THREE from 'three'
import { MeshBVH } from 'three-mesh-bvh'

/**
 * Mundo de colisão: junta toda a geometria marcada como sólida num único BVH.
 * O NEX é uma cápsula que é empurrada para fora dos triângulos (técnica do exemplo
 * "characterMovement" do three-mesh-bvh). Escadas visuais usam rampas invisíveis.
 */
class CollisionWorld {
  roots = new Set<THREE.Object3D>()
  bvh: MeshBVH | null = null
  geom: THREE.BufferGeometry | null = null
  dirty = true
  version = 0

  add(o: THREE.Object3D) { this.roots.add(o); this.dirty = true }
  remove(o: THREE.Object3D) { this.roots.delete(o); this.dirty = true }
  clear() { this.roots.clear(); this.dirty = true }

  ensure() {
    if (!this.dirty) return
    this.dirty = false
    const parts: THREE.BufferGeometry[] = []
    let total = 0
    for (const r of this.roots) {
      r.updateWorldMatrix(true, true)
      r.traverse((o: any) => {
        if (!o.isMesh || !o.geometry || o.userData.noCollide) return
        if (o.userData.collideVisibleOnly && !isVisible(o)) return
        const src: THREE.BufferGeometry = o.geometry
        const pos = src.getAttribute('position')
        if (!pos) return
        const idx = src.getIndex()
        const n = idx ? idx.count : pos.count
        const arr = new Float32Array(n * 3)
        const v = new THREE.Vector3()
        for (let i = 0; i < n; i++) {
          const k = idx ? idx.getX(i) : i
          v.fromBufferAttribute(pos as any, k).applyMatrix4(o.matrixWorld)
          arr[i * 3] = v.x; arr[i * 3 + 1] = v.y; arr[i * 3 + 2] = v.z
        }
        const g = new THREE.BufferGeometry()
        g.setAttribute('position', new THREE.BufferAttribute(arr, 3))
        parts.push(g); total += n
      })
    }
    if (this.geom) this.geom.dispose()
    if (!total) { this.bvh = null; this.geom = null; return }
    const all = new Float32Array(total * 3)
    let off = 0
    for (const g of parts) { const a = g.getAttribute('position').array as Float32Array; all.set(a, off); off += a.length; g.dispose() }
    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.BufferAttribute(all, 3))
    this.geom = geom
    this.bvh = new MeshBVH(geom, { targetLeafSize: 12 } as any)
    this.version++
  }

  private ray = new THREE.Ray()
  raycast(origin: THREE.Vector3, dir: THREE.Vector3, far = 1000): { point: THREE.Vector3; distance: number; normal: THREE.Vector3 } | null {
    this.ensure()
    if (!this.bvh) return null
    this.ray.origin.copy(origin); this.ray.direction.copy(dir).normalize()
    const hit: any = this.bvh.raycastFirst(this.ray, THREE.DoubleSide)
    if (!hit || hit.distance > far) return null
    const n = hit.face ? hit.face.normal.clone() : new THREE.Vector3(0, 1, 0)
    if (n.dot(this.ray.direction) > 0) n.negate()
    return { point: hit.point.clone(), distance: hit.distance, normal: n }
  }

  /** Altura do chão abaixo de um ponto (ou null). */
  groundY(x: number, y: number, z: number, depth = 50) {
    const h = this.raycast(new THREE.Vector3(x, y, z), new THREE.Vector3(0, -1, 0), depth)
    return h ? h.point.y : null
  }
}

function isVisible(o: THREE.Object3D) { let p: THREE.Object3D | null = o; while (p) { if (!p.visible) return false; p = p.parent } return true }

export const COLL = new CollisionWorld()

/** Cápsula: empurra o segmento para fora dos triângulos próximos. Retorna o deslocamento aplicado. */
const tBox = new THREE.Box3(), tSeg = new THREE.Line3(), tA = new THREE.Vector3(), tB = new THREE.Vector3(), tDir = new THREE.Vector3()
export function resolveCapsule(start: THREE.Vector3, end: THREE.Vector3, radius: number, out: THREE.Vector3) {
  out.set(0, 0, 0)
  COLL.ensure()
  const bvh = COLL.bvh
  if (!bvh) return out
  tSeg.start.copy(start); tSeg.end.copy(end)
  for (let iter = 0; iter < 3; iter++) {
    tBox.makeEmpty(); tBox.expandByPoint(tSeg.start); tBox.expandByPoint(tSeg.end)
    tBox.min.addScalar(-radius); tBox.max.addScalar(radius)
    let moved = false
    bvh.shapecast({
      intersectsBounds: (box: THREE.Box3) => box.intersectsBox(tBox),
      intersectsTriangle: (tri: any) => {
        const d = tri.closestPointToSegment(tSeg, tA, tB)
        if (d < radius) {
          const depth = radius - d
          tDir.subVectors(tB, tA)
          if (tDir.lengthSq() < 1e-10) { tri.getNormal(tDir) } else tDir.normalize()
          tSeg.start.addScaledVector(tDir, depth); tSeg.end.addScaledVector(tDir, depth)
          moved = true
        }
        return false
      },
    } as any)
    if (!moved) break
  }
  out.subVectors(tSeg.start, start)
  return out
}
