"""Ajudantes dos testes de ponta a ponta (Playwright + Chromium).
Use PF_URL para apontar outro endereço (padrão: http://localhost:4173/, o `vite preview`)."""
import asyncio, json, os, sys
from playwright.async_api import async_playwright

BASE = os.environ.get('PF_URL', 'http://localhost:4173/')
OUT = os.environ.get('PF_SHOTS', 'tests/e2e/out')
FAILS = []
def check(cond, msg):
    """Registra uma verificação; no fim, o teste sai com erro se alguma falhar."""
    print(('  ok   ' if cond else '  FALHOU ') + msg, flush=True)
    if not cond: FAILS.append(msg)
def finish(errs):
    errs = [e for e in errs if 'favicon' not in e and 'TUNNEL' not in e and 'upload.wikimedia' not in e and 'Failed to load resource' not in e]
    check(not errs, 'sem erros no console (%s)' % ('; '.join(errs[:5]) or 'nenhum'))
    if FAILS: print('\n%d verificação(ões) falharam' % len(FAILS)); sys.exit(1)
    print('\nTudo certo.')

class Game:
    def __init__(s, pg, pf): s.pg = pg; s.pf = pf; s.n = 0
    async def ev(s, js): return await s.pg.evaluate(js)
    async def wait(s, ms): await s.pg.wait_for_timeout(ms)
    async def shot(s, name): s.n += 1; os.makedirs(OUT, exist_ok=True); await s.pg.screenshot(path=f'{OUT}/{s.pf}_{s.n:02d}_{name}.png', timeout=120000)
    async def tp(s, x, y):
        await s.ev(f"(()=>{{const R=__pf.RT; R.player.x={x}; R.player.y={y}; R.path=null }})()")
        await s.wait(500)
    async def use(s, id):
        return await s.ev(f"(()=>{{const it=__pf.INTERACTS.get('{id}'); if(!it) return 'missing'; if(!it.enabled()) return 'disabled'; it.use(); return 'ok'}})()")
    async def flag(s, k): return await s.ev(f"__pf.useGame.getState().flags['{k}']||0")
    async def state(s): return await s.ev("(()=>{const g=__pf.useGame.getState(); const R=__pf.RT; return {level:g.level, obj:g.objective&&g.objective.text, dlg:g.dialog&&g.dialog.lines[g.dialog.i].text.slice(0,40), focus:g.focus, cine:!!g.cine, loading:g.loading, p:[+R.player.x.toFixed(2), +R.player.y.toFixed(2)], frozen:R.frozen, prompt:g.prompt&&g.prompt.label}})()")
    async def advance(s, ms=6000):
        el = 0
        while el < ms:
            await s.ev("""(()=>{ const sk=document.querySelector('.skip'); if(sk){sk.click(); return 'skip'}
              const ch=document.querySelector('.dlg .choices .btn'); if(ch){ch.click(); return 'choice'}
              const d=document.querySelector('.dlg:not(.ambient)'); if(d){d.click(); return 'dlg'}
              const g=__pf.useGame.getState(); if(g.dialog && g.dialog.ambient){ __pf.useGame.setState({dialog: null}); g.dialog.resolve(); return 'amb'} return null })()""")
            await s.wait(250); el += 250
    async def click_text(s, txt):
        return await s.ev(f"""(()=>{{ const b=[...document.querySelectorAll('button')].find(b=>b.textContent.includes({json.dumps(txt)})); if(b){{b.click(); return 'ok'}} return 'nobtn' }})()""")
    async def walk(s, x, y, timeout=25000, near=0.6):
        """Anda de verdade (caminho A*, como o toque na tela)."""
        ok = await s.ev(f"(()=>{{ const P=__pf, R=P.RT; const sc=R.scene; return P.walkTo({x},{y}) }})()")
        el = 0
        while el < timeout:
            await s.wait(300); el += 300
            st = await s.ev(f"(()=>{{ const R=__pf.RT.player; return [Math.hypot(R.x-({x}), R.y-({y})), R.x, R.y, !!__pf.RT.path] }})()")
            if st[0] < near: return True, [round(v, 2) for v in st[1:3]]
            if not st[3]: break
        st = await s.ev("[__pf.RT.player.x,__pf.RT.player.y].map(v=>+v.toFixed(2))")
        return False, st
    async def hold(s, keys, ms):
        for k in keys: await s.pg.keyboard.down(k)
        await s.wait(ms)
        for k in keys: await s.pg.keyboard.up(k)

async def launch(p, W, H, save=None, dpr=1, query=None, raw_save=None):
    b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    ctx = await b.new_context(viewport={'width':W,'height':H}, is_mobile=W<700, has_touch=W<700, device_scale_factor=dpr)
    if save or raw_save is not None:
        # o save vai como texto (JSON dentro de uma string JS); raw_save permite testar um save quebrado
        val = json.dumps(json.dumps(save) if isinstance(save, dict) else save) if save else json.dumps(raw_save)
        await ctx.add_init_script("try{ if(!sessionStorage.getItem('pf-init')){ localStorage.setItem('pf2d-save-v1', %s); sessionStorage.setItem('pf-init','1') } }catch(e){}" % val)
    pg = await ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append('PAGEERR '+str(e)))
    pg.on('console', lambda m: errs.append(m.type+': '+m.text) if (m.type=='error') else None)
    await pg.goto(BASE + (query or '')); await pg.wait_for_timeout(1200)
    return b, pg, errs

async def start(pg, cont=False):
    sel = '.title .btn.primary'
    await pg.click(sel); await pg.wait_for_timeout(3500)


# ---------- Fase 1: como resolver cada ilha ----------
STOPS = ['fichas','tabela','algoritmo','chances','binario','erro','programa','multiplicar','markov','bit','neuronio']
ASK = {'fichas': 1, 'programa': 1}

async def click_sel(g, sel, idx=0):
    return await g.ev(f"(()=>{{const b=document.querySelectorAll({json.dumps(sel)})[{idx}]; if(!b) return 'none'; b.click(); return 'ok'}})()")

async def solve(g, sid):
    if sid in ASK:
        await click_sel(g, '.gm .opt', 0); await g.wait(400)  # erra uma vez
        await click_sel(g, '.gm .opt', ASK[sid]); await g.wait(600)
    elif sid == 'tabela':
        for lab, n in [('Feixe bom', 3), ('Feixe médio', 2), ('Feixe fraco', 1)]:
            for _ in range(n): await g.ev(f"document.querySelector('[aria-label=\"Pôr vareta em {lab}\"]').click()"); await g.wait(150)
    elif sid == 'algoritmo':
        order = ['Some as unidades', 'Escreva o 2', 'Some as dezenas', 'Escreva o 7']
        await g.click_text('Escreva o 7'); await g.wait(300)  # errado de propósito
        for t in order: await g.click_text(t); await g.wait(300)
    elif sid == 'chances':
        await g.ev("(()=>{const b=[...document.querySelectorAll('.gm .chipbtn')].find(b=>b.textContent==='7'); if(b) b.click()})()"); await g.wait(300)
        await g.click_text('Jogar os dados')
        for _ in range(240):
            await g.wait(500)
            if await g.ev("!!document.querySelector('.gm .ok')"): break
    elif sid == 'binario':
        for combo in [[4, 1], [8, 2], [8, 4, 1]]:
            for v in combo: await g.ev(f"document.querySelector('[aria-label=\"Lâmpada que vale {v}\"]').click()"); await g.wait(200)
            await g.wait(1600)
    elif sid == 'erro':
        await g.ev("""(()=>{ const ins=document.querySelectorAll('.gm input[type=range]'); const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
          set.call(ins[0],'0.8'); ins[0].dispatchEvent(new Event('input',{bubbles:true})); set.call(ins[1],'1'); ins[1].dispatchEvent(new Event('input',{bubbles:true})); })()""")
        await g.wait(600)
    elif sid == 'multiplicar':
        await g.click_text('Esticar'); await g.wait(400); await g.click_text('Girar'); await g.wait(1200)
    elif sid == 'markov':
        for i in range(6): await g.ev("(()=>{const b=[...document.querySelectorAll('.gm .card button')].find(b=>!b.disabled); if(b) b.click()})()"); await g.wait(200)
        await g.wait(400)
        await g.ev("[...document.querySelectorAll('.gm .row .btn')].find(b=>b.textContent==='escura').click()"); await g.wait(400)
        await g.ev("[...document.querySelectorAll('.gm .row .btn')].find(b=>b.textContent==='azul').click()"); await g.wait(600)
    elif sid == 'bit':
        for _ in range(8):
            alive = await g.ev("[...document.querySelectorAll('.gm .chipbtn')].filter(b=>b.style.opacity==='1').map(b=>+b.textContent)")
            if len(alive) <= 1: break
            mid = alive[(len(alive)-1)//2]
            await g.ev(f"[...document.querySelectorAll('.gm .chipbtn')].find(b=>b.textContent==='{mid}').click()"); await g.wait(500)
        await g.wait(600)
    elif sid == 'neuronio':
        await click_sel(g, '.gm .btn.ghost'); await g.wait(200)
        for lab in ['Diminuir peso de tem bigodes', 'Diminuir peso de late', 'Aumentar peso de mia']:
            await g.ev(f"document.querySelector('[aria-label=\"{lab}\"]').click()"); await g.wait(250)
    await g.wait(500)


async def ct(g, txt):
    return await g.click_text(txt)

async def solve_gm(g, shots, seen):
    h = await g.ev("(document.querySelector('.gm h4')||{}).textContent||''")
    key = h
    if shots and key not in seen:
        seen.add(key); await g.shot('gm_' + key.replace(' ', '_')[:20])
    if h == 'A mesa de madeira':
        T = [[3, 2, 1], [2, 3, 1], [1, 2, 3]]; N = ['superior', 'médio', 'inferior']
        for i in range(3):
            for j in range(3):
                for _ in range(T[i][j]):
                    await g.ev(f"document.querySelector('[aria-label^=\"Experimento {i+1}, {N[j]}:\"]').click()"); await g.wait(120)
        await g.wait(500)
        if shots: await g.shot('mesa_ok')
        await ct(g, 'Continuar')
    elif h == 'A primeira descoberta':
        await ct(g, 'os superiores'); await g.wait(300); await ct(g, '1 inferior'); await g.wait(600)
        if shots: await g.shot('same_ok')
        await ct(g, 'Continuar')
    elif h == 'Comparando as sobras':
        await ct(g, 'Tirar o que é igual'); await g.wait(700); await ct(g, '13 dou'); await g.wait(300); await ct(g, '5 dou'); await g.wait(600)
        if shots: await g.shot('diff_ok')
        await ct(g, 'Continuar')
    elif h == 'Agora a matemática aparece':
        await ct(g, 'Subtrair'); await g.wait(300)
        for _ in range(3): await ct(g, 'Próximo'); await g.wait(300)
        if shots: await g.shot('math_ok')
        await ct(g, 'Continuar')
    elif h == 'Uma descoberta não basta':
        await ct(g, 'registro 1 de novo'); await g.wait(300); await ct(g, 'O registro 3'); await g.wait(500); await ct(g, 'Continuar')
    elif h == 'A segunda descoberta':
        ans = ['21 dou', '7 dou', '24 dou', '4,25 dou', '9,25 dou', '2,75 dou']
        acts = ['Trocar', 'Separar', 'Trocar', 'Tirar um par', None, None]
        for k in range(6):
            if acts[k]: await ct(g, acts[k]); await g.wait(500)
            if k == 3 and shots: await g.shot('sub_d')
            await ct(g, ans[k]); await g.wait(500)
            await ct(g, 'Próxima pista' if k < 5 else 'Ver a mesa'); await g.wait(500)
    elif h == 'A mesa muda':
        if shots: await g.shot('rev')
        await ct(g, 'Mostrar ao comerciante')
    elif h == 'A balança':
        await ct(g, 'Dica'); await ct(g, '24 dou'); await g.wait(300); await ct(g, '25,5 dou'); await g.wait(600)
        if shots: await g.shot('balanca')
        await ct(g, 'Continuar')
    else:
        print('gm desconhecido', h)
    await g.wait(400)

async def drive(g, until_js, shots, seen, timeout=240000, big_shots=True):
    t = 0; bigseen = set()
    while t < timeout:
        st = await g.ev("""(()=>{ const g=__pf.useGame.getState(); const b=document.querySelector('.bigidea'); return {doc: !!document.querySelector('.doc'), gm: !!document.querySelector('.gm'), dlg: !!g.dialog, amb: !!(g.dialog&&g.dialog.ambient), cine: !!g.cine, big: b ? b.textContent.slice(0,20) : null, done: !!(%s)} })()""" % until_js)
        if st['done'] and not st['dlg'] and not st['gm'] and not st['doc']: return True
        if st['big'] is not None and shots and st['big'] not in bigseen:
            bigseen.add(st['big']); await g.shot('big_' + str(len(bigseen)))
        if st['doc']: await g.ev("document.querySelector('.doc .btn.primary').click()")
        elif st['gm']: await solve_gm(g, shots, seen)
        elif st['cine']: await g.ev("(()=>{const sk=document.querySelector('.skip'); if(sk) sk.click()})()")
        elif st['dlg'] and not st['amb']:
            await g.ev("(()=>{const ch=document.querySelector('.dlg .choices .btn'); if(ch){ch.click(); return} const d=document.querySelector('.dlg:not(.ambient)'); if(d) d.click()})()")
        await g.wait(400); t += 400
    return False


async def click_btn(g, txt, sel='.gm button'):
    return await g.ev(f"""(()=>{{ const b=[...document.querySelectorAll({json.dumps(sel)})].find(b=>b.textContent.includes({json.dumps(txt)}) && !b.disabled); if(b){{b.click(); return 'ok'}} return 'no' }})()""")
async def click_nth(g, sel, i):
    return await g.ev(f"""(()=>{{ const b=document.querySelectorAll({json.dumps(sel)})[{i}]; if(b){{b.click(); return 'ok'}} return 'no' }})()""")
async def has(g, sel): return await g.ev(f"!!document.querySelector({json.dumps(sel)})")
async def text(g, sel): return await g.ev(f"(document.querySelector({json.dumps(sel)})||{{}}).textContent||''")
