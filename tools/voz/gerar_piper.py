#!/usr/bin/env python3
"""
Gera as vozes do jogo (versão 2D) com o Piper, um TTS neural que roda no computador.

Uso:
  pip install piper-tts         (e ffmpeg instalado)
  python3 tools/voz/gerar_piper.py --modelo pt-br-edresson-low.onnx src/v2/levels/prologo/*.tsx

Lê as falas ({ who: 'X', text: '...' } e as escolhas do NEX) dos arquivos indicados,
gera um .mp3 por fala em public/audio/voz/ e atualiza public/audio/voz/index.json.
O nome de cada arquivo é o hash FNV-1a de "QUEM|texto" — o jogo calcula o mesmo hash
para achar o áudio (src/v2/engine/voice.ts). Falas sem áudio usam a voz do navegador.
"""
import argparse, json, os, re, subprocess, sys, tempfile, wave

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SAIDA = os.path.join(RAIZ, 'public', 'audio', 'voz')

# timbre de cada personagem: velocidade do Piper e filtros do ffmpeg (uma voz-base só)
TIMBRE = {
    'NEX': (0.95, 'rubberband=pitch=1.07:formant=preserved'),
    'NOVA': (0.93, 'rubberband=pitch=1.36:formant=shifted,chorus=0.7:0.9:22:0.35:0.3:1.6'),
    'ENGINE': (1.18, "rubberband=pitch=0.84,afftfilt=real='hypot(re,im)*cos(0)':imag='hypot(re,im)*sin(0)':win_size=512:overlap=0.75,aecho=0.8:0.7:45|80:0.3|0.18,tremolo=f=8:d=0.2"),
    'SISTEMA': (1.0, 'anull'),
    'COMERCIANTE': (1.02, 'rubberband=pitch=0.93:formant=preserved'),
}
PADRAO = (1.0, 'anull')

# como falar algumas palavras (o Piper lê tudo como português)
PRONUNCIA = [
    (r'\bLanguage Engine\b', 'Lênguidj Éndjin'),
    (r'\bLLMs\b', 'éle éle êmes'), (r'\bLLM\b', 'éle éle ême'),
    (r'\bNEX\b', 'Néks'), (r'\bIA\b', 'i á'), (r'\bNOVA\b', 'Nóva'),
    (r'\bWASD\b', 'W A S D'), (r'\bShift\b', 'xifti'),
]

def fnv(s: str) -> str:
    h = 0x811c9dc5
    for b in s.encode('utf-8'):
        h ^= b
        h = (h * 0x01000193) & 0xffffffff
    return f'{h:08x}'

def js_str(s: str) -> str:
    return s.replace("\\'", "'").replace('\\"', '"').replace('\\n', ' ')

def extrair(caminhos):
    falas = []
    pad = re.compile(r"who:\s*'([A-Z]+)'\s*,\s*text:\s*'((?:[^'\\]|\\.)*)'")
    esc = re.compile(r"label:\s*'((?:[^'\\]|\\.)*)'")  # escolhas viram falas do NEX
    sis = re.compile(r"const move = IS_TOUCH \? '((?:[^'\\]|\\.)*)' : '((?:[^'\\]|\\.)*)'")
    for c in caminhos:
        src = open(c, encoding='utf-8').read()
        for who, txt in pad.findall(src): falas.append((who, js_str(txt)))
        # só os rótulos dentro de "choices: [ ... ]" (o NEX fala a escolha)
        for m in re.finditer(r'choices:\s*\[', src):
            i, dep = m.end(), 1
            while i < len(src) and dep:
                dep += {'[': 1, ']': -1}.get(src[i], 0); i += 1
            for lab in esc.findall(src[m.end():i]): falas.append(('NEX', js_str(lab)))
        for a, b in sis.findall(src): falas += [('SISTEMA', js_str(a)), ('SISTEMA', js_str(b))]
    vistos, out = set(), []
    for f in falas:
        if f not in vistos: vistos.add(f); out.append(f)
    return out

def preparar(txt: str) -> str:
    t = txt.replace('“', '').replace('”', '').replace('"', '')
    t = t.replace('…', ', ').replace('...', ', ')
    for a, b in PRONUNCIA: t = re.sub(a, b, t)
    t = re.sub(r'\s*,\s*([.!?])', r'\1', t)
    t = re.sub(r'(,\s*)+', ', ', t).strip(' ,')
    return t or '...'

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--modelo', required=True)
    ap.add_argument('--refazer', action='store_true')
    ap.add_argument('fontes', nargs='+')
    a = ap.parse_args()
    from piper import PiperVoice, SynthesisConfig
    voz = PiperVoice.load(a.modelo)
    os.makedirs(SAIDA, exist_ok=True)
    idx_path = os.path.join(SAIDA, 'index.json')
    idx = json.load(open(idx_path)) if os.path.exists(idx_path) else {}
    falas = extrair(a.fontes)
    print(f'{len(falas)} falas')
    for who, txt in falas:
        key = fnv(f'{who}|{txt}')
        mp3 = os.path.join(SAIDA, key + '.mp3')
        if not a.refazer and key in idx and os.path.exists(mp3): continue
        vel, filtro = TIMBRE.get(who, PADRAO)
        with tempfile.TemporaryDirectory() as tmp:
            wav = os.path.join(tmp, 'f.wav')
            if not re.search(r'\w', preparar(txt)):  # só reticências: um silêncio
                subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'anullsrc=r=16000:cl=mono', '-t', '1.4', wav], check=True)
                filtro = 'anull'
            else:
                with wave.open(wav, 'wb') as w:
                    voz.synthesize_wav(preparar(txt), w, syn_config=SynthesisConfig(length_scale=vel, noise_scale=0.6, noise_w_scale=0.75))
            filtros = f'{filtro},aresample=24000' + (',loudnorm=I=-17:TP=-1.5:LRA=9' if filtro != 'anull' or who != 'ENGINE' else '') + ',apad=pad_dur=0.12'
            r = subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-af', filtros, '-ac', '1', '-ar', '24000', '-c:a', 'libmp3lame', '-b:a', '48k', mp3], capture_output=True, text=True)
            if r.returncode: print('ERRO ffmpeg', who, txt[:40], r.stderr[-300:]); continue
        d = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp3], capture_output=True, text=True).stdout.strip() or 0)
        idx[key] = {'f': key + '.mp3', 'd': round(d, 2), 'who': who, 't': txt[:60]}
        print(f'{who:10s} {d:5.1f}s  {txt[:70]}')
    json.dump(idx, open(idx_path, 'w'), ensure_ascii=False, indent=0)
    print('ok:', idx_path)

if __name__ == '__main__':
    main()
