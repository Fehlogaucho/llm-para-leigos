import * as THREE from 'three'

/** Estado do mundo que muda a cada quadro (fora do React). */
export const RT = {
  player: new THREE.Vector3(),
  playerYaw: 0,
  playerSpeed: 0,
  playerGrounded: true,
  playerVel: new THREE.Vector3(),
  lastSafe: new THREE.Vector3(),
  frozen: false, // sem andar (diálogo bloqueante, foco, cinemática)
  camYaw: 0,
  camPitch: 0.3,
  camDist: 6.2,
  camera: null as THREE.PerspectiveCamera | null,
  scene: null as THREE.Scene | null,
  gl: null as THREE.WebGLRenderer | null,
  nova: new THREE.Vector3(0, 1.6, 0),
  novaLook: null as THREE.Vector3 | null,
  novaTalking: 0,
  nexTalking: 0,
  time: 0,
  minY: -40,
  lookAt: null as THREE.Vector3 | null, // ponto que o NEX olha
  gesture: '' as '' | 'reach' | 'point' | 'cheer' | 'think',
  gestureT: 0,
  nexScale: 1, // encolher o NEX (abertura)
  nexSpin: 0,
}

export interface Interact {
  id: string
  pos: THREE.Vector3
  radius: number
  label: string
  enabled: boolean
  use: () => void
  root?: THREE.Object3D
}
export const INTERACTS = new Map<string, Interact>()

export function gesture(g: typeof RT.gesture, dur = 1.4) { RT.gesture = g; RT.gestureT = dur }
