import * as THREE from 'three'
import { stoneTiles, stoneBlocks, rockTex, grassTex, woodTex } from './textures'

const M = new Map<string, THREE.Material>()
function get<T extends THREE.Material>(k: string, f: () => T): T { if (!M.has(k)) M.set(k, f()); return M.get(k) as T }

/** Materiais compartilhados (um por tipo, reaproveitados por todo o mundo). */
export const MAT = {
  floor: (rep = 1) => get('floor' + rep, () => { const t = stoneTiles(); const map = t.map.clone(); const nm = t.normalMap.clone(); map.repeat.set(rep, rep); nm.repeat.set(rep, rep); map.needsUpdate = nm.needsUpdate = true; return new THREE.MeshStandardMaterial({ map, normalMap: nm, normalScale: new THREE.Vector2(0.6, 0.6), roughness: 0.82, color: '#ffffff' }) }),
  wall: (rep = 1) => get('wall' + rep, () => { const t = stoneBlocks(); const map = t.map.clone(); const nm = t.normalMap.clone(); map.repeat.set(rep, rep); nm.repeat.set(rep, rep); map.needsUpdate = nm.needsUpdate = true; return new THREE.MeshStandardMaterial({ map, normalMap: nm, normalScale: new THREE.Vector2(0.7, 0.7), roughness: 0.85 }) }),
  stone: () => get('stone', () => new THREE.MeshStandardMaterial({ color: '#d9c6a3', roughness: 0.8 })),
  stoneDark: () => get('stoneDark', () => new THREE.MeshStandardMaterial({ color: '#a8916d', roughness: 0.85 })),
  marble: () => get('marble', () => new THREE.MeshStandardMaterial({ color: '#efe6d6', roughness: 0.35, metalness: 0.02 })),
  rock: (rep = 1) => get('rock' + rep, () => { const t = rockTex(); const map = t.map.clone(); const nm = t.normalMap.clone(); map.repeat.set(rep, rep); nm.repeat.set(rep, rep); map.needsUpdate = nm.needsUpdate = true; return new THREE.MeshStandardMaterial({ map, normalMap: nm, roughness: 0.95, color: '#ffffff' }) }),
  grass: (rep = 1) => get('grass' + rep, () => { const t = grassTex(); const map = t.map.clone(); map.repeat.set(rep, rep); map.needsUpdate = true; return new THREE.MeshStandardMaterial({ map, roughness: 0.95 }) }),
  wood: () => get('wood', () => new THREE.MeshStandardMaterial({ map: woodTex().map, roughness: 0.7 })),
  woodDark: () => get('woodDark', () => new THREE.MeshStandardMaterial({ map: woodTex('woodDark', '#5a3a22', '#2e1c10').map, roughness: 0.65 })),
  bronze: () => get('bronze', () => new THREE.MeshStandardMaterial({ color: '#b5803f', metalness: 1, roughness: 0.32 })),
  bronzeDark: () => get('bronzeDark', () => new THREE.MeshStandardMaterial({ color: '#6e4a24', metalness: 1, roughness: 0.4 })),
  gold: () => get('gold', () => new THREE.MeshStandardMaterial({ color: '#e7b456', metalness: 1, roughness: 0.22 })),
  iron: () => get('iron', () => new THREE.MeshStandardMaterial({ color: '#3a3f4a', metalness: 0.9, roughness: 0.45 })),
  copper: () => get('copper', () => new THREE.MeshStandardMaterial({ color: '#c26a3c', metalness: 1, roughness: 0.35 })),
  glass: () => get('glass', () => new THREE.MeshPhysicalMaterial({ color: '#cfe8ff', metalness: 0, roughness: 0.05, transmission: 0.0, transparent: true, opacity: 0.25, depthWrite: false })),
  foliage: () => get('foliage', () => new THREE.MeshStandardMaterial({ color: '#4f7a34', roughness: 0.9, flatShading: true })),
  foliage2: () => get('foliage2', () => new THREE.MeshStandardMaterial({ color: '#6b9440', roughness: 0.9, flatShading: true })),
  ivy: () => get('ivy', () => new THREE.MeshStandardMaterial({ color: '#3d6a2c', roughness: 0.9, flatShading: true })),
  bark: () => get('bark', () => new THREE.MeshStandardMaterial({ color: '#5b4030', roughness: 0.95 })),
  cloth: (c = '#1d2c66') => get('cloth' + c, () => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, side: THREE.DoubleSide })),
  glowWarm: () => get('glowWarm', () => new THREE.MeshStandardMaterial({ color: '#ffd59a', emissive: '#ffae4a', emissiveIntensity: 3.2, roughness: 0.5 })),
  glowBlue: () => get('glowBlue', () => new THREE.MeshStandardMaterial({ color: '#9fe9ff', emissive: '#3fb8ff', emissiveIntensity: 3, roughness: 0.4 })),
  glowViolet: () => get('glowViolet', () => new THREE.MeshStandardMaterial({ color: '#d7c6ff', emissive: '#8a5cff', emissiveIntensity: 3, roughness: 0.4 })),
  dark: () => get('dark', () => new THREE.MeshStandardMaterial({ color: '#141821', roughness: 0.6, metalness: 0.3 })),
  water: () => get('water', () => new THREE.MeshStandardMaterial({ color: '#4f8fb8', roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.85 })),
  flowerA: () => get('flowerA', () => new THREE.MeshStandardMaterial({ color: '#f3a6c8', roughness: 0.7 })),
  flowerB: () => get('flowerB', () => new THREE.MeshStandardMaterial({ color: '#ffe08a', roughness: 0.7 })),
  flowerC: () => get('flowerC', () => new THREE.MeshStandardMaterial({ color: '#9fb8ff', roughness: 0.7 })),
}
