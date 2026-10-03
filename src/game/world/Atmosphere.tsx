import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, Sparkles } from '@react-three/drei'
import { RT } from '../engine/runtime'
import { QUALITY } from '../engine/quality'
import { MAT } from './materials'
import { cloudTex } from './textures'

export interface SkyPreset { hemi?: string; zenith: string; mid: string; horizon: string; below: string; sunCol: string; sun: [number, number, number]; stars: number; fog: string; fogNear: number; fogFar: number }
export const SKY: Record<string, SkyPreset> = {
  sunset: { hemi: '#b4a6d0', zenith: '#0f1640', mid: '#4f4a94', horizon: '#ffb070', below: '#e2a68e', sunCol: '#ffc583', sun: [-0.92, 0.17, -0.35], stars: 0.9, fog: '#e8ad86', fogNear: 110, fogFar: 420 },
  dusk: { zenith: '#0c1236', mid: '#3d3a7a', horizon: '#e88a70', below: '#6d5a8a', sunCol: '#ff9a6a', sun: [-0.8, 0.06, 0.4], stars: 1, fog: '#6e5a86', fogNear: 60, fogFar: 300 },
  night: { zenith: '#050818', mid: '#121a44', horizon: '#3a3a78', below: '#1c1f40', sunCol: '#7aa0ff', sun: [0.3, 0.5, -0.6], stars: 1.4, fog: '#1a1d3a', fogNear: 40, fogFar: 240 },
  day: { zenith: '#3b6fc4', mid: '#79a8e0', horizon: '#f2dcc0', below: '#d8d0e0', sunCol: '#fff0d0', sun: [-0.4, 0.7, 0.3], stars: 0, fog: '#d9d4e2', fogNear: 80, fogFar: 380 },
  cyber: { zenith: '#050716', mid: '#1a1450', horizon: '#3a2a8a', below: '#120c30', sunCol: '#58d0ff', sun: [0.2, 0.3, -0.9], stars: 1.2, fog: '#140f36', fogNear: 30, fogFar: 200 },
}

const skyVert = `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }`
const skyFrag = `
varying vec3 vDir;
uniform vec3 uZenith, uMid, uHorizon, uBelow, uSunCol, uSun; uniform float uTime, uStars;
float hash(vec3 p){ p = fract(p*0.3183099+vec3(.1,.2,.3)); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float n3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z); }
void main(){
  vec3 d = normalize(vDir); float h = d.y;
  vec3 s = normalize(uSun); float sd = max(dot(d, s), 0.0);
  vec3 col = mix(uHorizon, uMid, smoothstep(0.0, 0.42, h));
  col = mix(col, uZenith, smoothstep(0.32, 1.0, h));
  float az = max(dot(normalize(vec3(d.x,0.,d.z)), normalize(vec3(s.x,0.,s.z))), 0.0);
  col += uSunCol * pow(az, 4.0) * 0.35 * (1.0 - smoothstep(0.0, 0.5, h));
  col += uSunCol * pow(sd, 10.0) * 0.55;
  col += uSunCol * pow(sd, 120.0) * 1.6;
  col += vec3(1.0,0.92,0.78) * smoothstep(0.9988, 0.9996, sd) * 8.0;
  // faixa de nebulosa
  float band = exp(-pow(dot(d, normalize(vec3(0.35, 0.55, -0.75))), 2.0) * 18.0);
  float neb = n3(d*6.0 + uTime*0.01) * 0.6 + n3(d*14.0) * 0.4;
  col += mix(vec3(0.35,0.2,0.6), vec3(0.2,0.45,0.8), neb) * band * neb * 0.35 * uStars * smoothstep(0.05, 0.5, h);
  // estrelas
  vec3 p = d * 260.0; vec3 c = floor(p); float r = hash(c);
  vec3 off = vec3(hash(c+11.1), hash(c+23.7), hash(c+37.3)) - 0.5;
  float st = smoothstep(0.11, 0.0, length(fract(p) - 0.5 - off*0.6)) * step(0.982, r);
  float tw = 0.55 + 0.45 * sin(uTime * (1.5 + r*3.0) + r * 60.0);
  col += vec3(1.0, 0.95, 0.88) * st * tw * smoothstep(0.08, 0.55, h) * uStars * 1.8;
  col = mix(col, uBelow, smoothstep(0.0, -0.22, h));
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`

export function SkyDome({ preset = 'sunset' }: { preset?: string }) {
  const p = SKY[preset] || SKY.sunset
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: skyVert, fragmentShader: skyFrag, side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      uZenith: { value: new THREE.Color(p.zenith) }, uMid: { value: new THREE.Color(p.mid) }, uHorizon: { value: new THREE.Color(p.horizon) },
      uBelow: { value: new THREE.Color(p.below) }, uSunCol: { value: new THREE.Color(p.sunCol) }, uSun: { value: new THREE.Vector3(...p.sun) },
      uTime: { value: 0 }, uStars: { value: p.stars },
    },
  }), [preset])
  const ref = useRef<THREE.Mesh>(null!)
  useFrame(({ camera }) => { mat.uniforms.uTime.value = RT.time; ref.current.position.copy(camera.position) })
  return <mesh ref={ref} material={mat} renderOrder={-10} frustumCulled={false} userData={{ noCollide: true }}><sphereGeometry args={[500, 48, 24]} /></mesh>
}

/** Luzes: sol com sombra que acompanha o jogador, céu/chão e reflexos. */
export function Lights({ preset = 'sunset', sunI = 2.4, hemiI = 0.9, envI = 0.9 }: { preset?: string; sunI?: number; hemiI?: number; envI?: number }) {
  const p = SKY[preset] || SKY.sunset
  const light = useRef<THREE.DirectionalLight>(null!)
  const { scene } = useThree()
  const sun = useMemo(() => new THREE.Vector3(...p.sun).normalize(), [preset])
  const high = QUALITY.q === 'high'
  useFrame(() => {
    const l = light.current
    if (!l) return
    l.position.set(RT.player.x + sun.x * 60, RT.player.y + Math.max(sun.y, 0.25) * 60, RT.player.z + sun.z * 60)
    l.target.position.set(RT.player.x, RT.player.y, RT.player.z)
    l.target.updateMatrixWorld()
  })
  useMemo(() => { scene.fog = new THREE.Fog(p.fog, p.fogNear, p.fogFar) }, [preset])
  return (
    <>
      <directionalLight ref={light} color={p.sunCol} intensity={sunI} castShadow={high}
        shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.03}
        shadow-camera-left={-28} shadow-camera-right={28} shadow-camera-top={28} shadow-camera-bottom={-28} shadow-camera-near={1} shadow-camera-far={160} />
      <hemisphereLight args={[p.hemi || p.mid, '#8a5a34', hemiI]} />
      <ambientLight intensity={0.12} color={p.zenith} />
      <Environment resolution={64} frames={1} environmentIntensity={envI}>
        <mesh scale={100}><sphereGeometry args={[1, 32, 16]} /><meshBasicMaterial color={p.mid} side={THREE.BackSide} /></mesh>
        <Lightformer form="circle" intensity={6} color={p.sunCol} position={[sun.x * 10, Math.max(sun.y, 0.1) * 10, sun.z * 10]} scale={4} />
        <Lightformer form="rect" intensity={1.5} color={p.horizon} position={[0, 0, -10]} scale={[30, 4, 1]} />
        <Lightformer form="rect" intensity={1.2} color={p.zenith} position={[0, 10, 0]} rotation-x={Math.PI / 2} scale={[30, 30, 1]} />
      </Environment>
    </>
  )
}

/** Planeta com anéis no céu. */
export function Planet({ position = [180, 120, -380], r = 46, tint = '#c9a0d8' }: { position?: [number, number, number]; r?: number; tint?: string }) {
  const tex = useMemo(() => {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128
    const c = cv.getContext('2d')!
    for (let y = 0; y < 128; y++) { const t = Math.sin(y * 0.22) * 0.5 + Math.sin(y * 0.07 + 1) * 0.5; c.fillStyle = `hsl(${270 + t * 25}, 35%, ${55 + t * 15}%)`; c.fillRect(0, y, 256, 1) }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t
  }, [])
  const ringTex = useMemo(() => {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 4
    const c = cv.getContext('2d')!
    for (let x = 0; x < 256; x++) { const a = (Math.sin(x * 0.3) * 0.3 + 0.5) * (x > 20 && x < 240 ? 1 : 0); c.fillStyle = `rgba(230,210,240,${a})`; c.fillRect(x, 0, 1, 4) }
    return new THREE.CanvasTexture(cv)
  }, [])
  const ringGeo = useMemo(() => {
    const g = new THREE.RingGeometry(r * 1.35, r * 2.3, 96, 1)
    const pos = g.attributes.position, uv = g.attributes.uv, v = new THREE.Vector3()
    for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos as any, i); const l = v.length(); uv.setXY(i, (l - r * 1.35) / (r * 0.95), 0.5) }
    return g
  }, [r])
  return (
    <group position={position} rotation={[0.25, 0, -0.35]}>
      <mesh userData={{ noCollide: true }}><sphereGeometry args={[r, 48, 32]} /><meshStandardMaterial map={tex} color={tint} roughness={0.9} fog={false} emissive="#3a2a55" emissiveIntensity={0.25} /></mesh>
      <mesh geometry={ringGeo} rotation={[Math.PI / 2 - 0.15, 0, 0]} userData={{ noCollide: true }}><meshBasicMaterial map={ringTex} transparent side={THREE.DoubleSide} depthWrite={false} fog={false} color="#f0d8ff" /></mesh>
    </group>
  )
}

/** Mar de nuvens abaixo do mundo. */
export function CloudSea({ y = -28, color = '#e7b8c4', shade = '#7a5a8e' }: { y?: number; color?: string; shade?: string }) {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false,
    uniforms: { uTime: { value: 0 }, uA: { value: new THREE.Color(color) }, uB: { value: new THREE.Color(shade) } },
    vertexShader: `varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `varying vec2 vUv; varying vec3 vW; uniform float uTime; uniform vec3 uA, uB;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
      float fbm(vec2 p){ float s=0., a=.5; for(int i=0;i<5;i++){ s+=a*n(p); p*=2.03; a*=.5; } return s; }
      void main(){ vec2 p = vW.xz*0.012 + vec2(uTime*0.004, uTime*0.002);
        float c = fbm(p); float c2 = fbm(p*2.3 + 3.0 - uTime*0.003);
        float d = length(vW.xz)/ 420.0;
        vec3 col = mix(uB, uA, smoothstep(0.35, 0.75, c*0.7 + c2*0.4));
        float a = smoothstep(0.25, 0.55, c) * (1.0 - smoothstep(0.65, 1.0, d));
        gl_FragColor = vec4(col, a*0.95);
        #include <colorspace_fragment>
      }`,
  }), [color, shade])
  useFrame(() => { mat.uniforms.uTime.value = RT.time })
  return <mesh material={mat} position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]} userData={{ noCollide: true }}><planeGeometry args={[900, 900]} /></mesh>
}

/** Nuvens fofas soltas (sprites). */
export function CloudPuffs({ n = 18, y = [-20, 6], r = [70, 220], tint = '#f3d0d8', seed = 3 }: { n?: number; y?: [number, number]; r?: [number, number]; tint?: string; seed?: number }) {
  const tex = cloudTex()
  const items = useMemo(() => {
    let s = seed; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647 }
    return Array.from({ length: n }, () => { const a = rnd() * Math.PI * 2, d = r[0] + rnd() * (r[1] - r[0]); return { p: [Math.cos(a) * d, y[0] + rnd() * (y[1] - y[0]), Math.sin(a) * d] as [number, number, number], s: 30 + rnd() * 50, sp: 0.2 + rnd() * 0.4 } })
  }, [n])
  return (
    <group>
      {items.map((it, i) => (
        <sprite key={i} position={it.p} scale={[it.s, it.s * 0.5, 1]} userData={{ noCollide: true }}>
          <spriteMaterial map={tex} color={tint} transparent opacity={0.85} depthWrite={false} fog={false} />
        </sprite>
      ))}
    </group>
  )
}

/* ---------- ilhas flutuantes ---------- */
function rnd(seed: number) { return () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 } }
export function islandGeometries(seed = 1, r = 6, depth = 9) {
  const rr = rnd(seed * 97 + 13)
  const rock = new THREE.CylinderGeometry(r, r * 0.12, depth, 20, 8, false)
  const pos = rock.attributes.position, v = new THREE.Vector3()
  const ph = Array.from({ length: 6 }, () => rr() * 6.28)
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos as any, i)
    const a = Math.atan2(v.z, v.x), t = (v.y + depth / 2) / depth
    const w = 1 + 0.18 * Math.sin(a * 3 + ph[0]) + 0.1 * Math.sin(a * 7 + ph[1]) + 0.12 * Math.sin(v.y * 1.3 + ph[2])
    const shrink = Math.pow(t, 0.55)
    v.x *= w * (0.35 + shrink * 0.65); v.z *= w * (0.35 + shrink * 0.65)
    if (t > 0.99) v.y += (Math.sin(a * 4 + ph[3]) * 0.2)
    v.y -= (1 - t) * (1 - t) * depth * 0.25
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  rock.computeVertexNormals()
  rock.translate(0, -depth / 2, 0)
  const top = new THREE.CircleGeometry(r * 1.06, 24)
  top.rotateX(-Math.PI / 2)
  const tp = top.attributes.position
  for (let i = 0; i < tp.count; i++) { v.fromBufferAttribute(tp as any, i); const a = Math.atan2(v.z, v.x); const w = 1 + 0.18 * Math.sin(a * 3 + ph[0]) + 0.1 * Math.sin(a * 7 + ph[1]); tp.setXYZ(i, v.x * w * 0.98, 0.15 + Math.sin(v.x * 0.7) * 0.15, v.z * w * 0.98) }
  top.computeVertexNormals()
  return { rock, top }
}

export function FloatingIslands({ n = 12, seed = 5, rMin = 90, rMax = 260, yMin = -10, yMax = 50, trees = true }: { n?: number; seed?: number; rMin?: number; rMax?: number; yMin?: number; yMax?: number; trees?: boolean }) {
  const geos = useMemo(() => [islandGeometries(1, 6, 10), islandGeometries(2, 4, 7), islandGeometries(3, 9, 14)], [])
  const items = useMemo(() => {
    const r = rnd(seed * 31 + 7)
    return Array.from({ length: n }, (_, i) => {
      const a = r() * Math.PI * 2, d = rMin + r() * (rMax - rMin)
      return { k: i % 3, p: new THREE.Vector3(Math.cos(a) * d, yMin + r() * (yMax - yMin), Math.sin(a) * d), s: 0.6 + r() * 1.6, rot: r() * 6, ph: r() * 6, tr: Math.floor(r() * 4) }
    })
  }, [n, seed])
  const g = useRef<THREE.Group>(null!)
  useFrame(() => { g.current.children.forEach((c, i) => { c.position.y = items[i].p.y + Math.sin(RT.time * 0.3 + items[i].ph) * 1.2 }) })
  return (
    <group ref={g}>
      {items.map((it, i) => (
        <group key={i} position={it.p} scale={it.s} rotation={[0, it.rot, 0]}>
          <mesh geometry={geos[it.k].rock} material={MAT.rock(2)} userData={{ noCollide: true }} />
          <mesh geometry={geos[it.k].top} material={MAT.grass(3)} userData={{ noCollide: true }} />
          {trees && Array.from({ length: it.tr }, (_, j) => (
            <group key={j} position={[Math.cos(j * 2.1) * 2.5, 0, Math.sin(j * 2.1) * 2.5]}>
              <mesh position={[0, 1, 0]} material={MAT.bark()} userData={{ noCollide: true }}><cylinderGeometry args={[0.15, 0.25, 2, 6]} /></mesh>
              <mesh position={[0, 2.6, 0]} material={j % 2 ? MAT.foliage() : MAT.foliage2()} userData={{ noCollide: true }}><icosahedronGeometry args={[1.3, 0]} /></mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  )
}

/** Cachoeira: faixa com água escorrendo (shader) e névoa. */
export function Waterfall({ position, width = 3, height = 30, rotY = 0 }: { position: [number, number, number]; width?: number; height?: number; rotY?: number }) {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: true,
    uniforms: { uTime: { value: 0 }, fogColor: { value: new THREE.Color() }, fogNear: { value: 1 }, fogFar: { value: 1000 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; vec3 p = position; p.z += sin(uv.y*6.0)*0.2*(1.0-uv.y); gl_Position = projectionMatrix*modelViewMatrix*vec4(p,1.0); }`,
    fragmentShader: `varying vec2 vUv; uniform float uTime;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
      float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
      void main(){ vec2 p = vec2(vUv.x*8.0, vUv.y*4.0 + uTime*1.6);
        float s = n(p*vec2(1.0,0.35))*0.6 + n(p*vec2(3.0,0.8))*0.4;
        float edge = smoothstep(0.0,0.18,vUv.x)*smoothstep(1.0,0.82,vUv.x);
        float fade = smoothstep(0.0, 0.25, vUv.y);
        vec3 col = mix(vec3(0.55,0.75,0.92), vec3(1.0), smoothstep(0.45,0.8,s));
        gl_FragColor = vec4(col, (0.55 + s*0.45)*edge*fade);
        #include <colorspace_fragment>
      }`,
  }), [])
  useFrame(() => { mat.uniforms.uTime.value = RT.time })
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh material={mat} position={[0, -height / 2, 0]} userData={{ noCollide: true }}><planeGeometry args={[width, height, 1, 12]} /></mesh>
      <Sparkles count={30} scale={[width * 1.6, 3, 3]} position={[0, -2, 0.5]} size={6} speed={0.4} color="#ffffff" opacity={0.6} />
    </group>
  )
}

/** Poeira dourada no ar. */
export function Dust({ count = 80, scale = [60, 14, 60] as [number, number, number], position = [0, 6, 0] as [number, number, number], color = '#ffd98a', size = 3 }) {
  const n = QUALITY.q === 'high' ? count : Math.floor(count * 0.5)
  return <Sparkles count={n} scale={scale} position={position} size={size} speed={0.25} color={color} opacity={0.75} noise={1} />
}
