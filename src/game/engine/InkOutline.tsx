import * as THREE from 'three'
import { forwardRef, useMemo } from 'react'
import { Effect, EffectAttribute, BlendFunction } from 'postprocessing'

/**
 * Contorno de desenho animado (tinta) feito na tela inteira a partir da profundidade:
 * - silhuetas: onde a profundidade dá um salto;
 * - vincos: onde 1/z deixa de ser plano (cantos de caixas, dobras).
 * Some com a distância para o fundo não ficar riscado.
 */
const frag = /* glsl */ `
uniform float strength;
uniform float thickness;
uniform float fadeNear;
uniform float fadeFar;
float vz(const in vec2 uv) { return max(0.001, -getViewZ(readDepth(uv))); }
void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
  if (depth >= 0.99999) { outputColor = inputColor; return; }
  vec2 o = texelSize * thickness;
  float z0 = max(0.001, -getViewZ(depth));
  float zl = vz(uv - vec2(o.x, 0.0)), zr = vz(uv + vec2(o.x, 0.0));
  float zu = vz(uv + vec2(0.0, o.y)), zd = vz(uv - vec2(0.0, o.y));
  float jump = max(max(z0 - zl, z0 - zr), max(z0 - zu, z0 - zd)) / z0;
  float sil = smoothstep(0.04, 0.11, jump);
  float lap = abs(1.0 / zl + 1.0 / zr + 1.0 / zu + 1.0 / zd - 4.0 / z0) * z0;
  float crease = smoothstep(0.010, 0.032, lap);
  float e = max(sil, crease * 0.7);
  e *= (1.0 - smoothstep(fadeNear, fadeFar, z0)) * strength;
  vec3 lineCol = inputColor.rgb * 0.16 + vec3(0.025, 0.018, 0.035);
  outputColor = vec4(mix(inputColor.rgb, lineCol, clamp(e, 0.0, 1.0)), inputColor.a);
}
`

class InkEffect extends Effect {
  constructor({ strength = 0.9, thickness = 1, fadeNear = 30, fadeFar = 85 } = {}) {
    super('InkEffect', frag, {
      attributes: EffectAttribute.DEPTH,
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, THREE.Uniform>([
        ['strength', new THREE.Uniform(strength)],
        ['thickness', new THREE.Uniform(thickness)],
        ['fadeNear', new THREE.Uniform(fadeNear)],
        ['fadeFar', new THREE.Uniform(fadeFar)],
      ]),
    })
  }
}

export const InkOutline = forwardRef(function InkOutline({ strength = 0.9, thickness = 1 }: { strength?: number; thickness?: number }, ref) {
  const effect = useMemo(() => new InkEffect({ strength, thickness }), [strength, thickness])
  return <primitive ref={ref} object={effect} dispose={null} />
})
