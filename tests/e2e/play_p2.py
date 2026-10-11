"""Fase 2 inteira: as 8 estações, o desafio de ordenar os passos e a grande pergunta.
Uso: python3 tests/e2e/play_p2.py [--mobile] [--shots]"""
import asyncio, json, sys
from lib import *
ZS = ['prever', 'tokens', 'vetores', 'atencao', 'camadas', 'roleta', 'treino', 'rag']
ORDER = ['TOKENS', 'IDs', 'VETORES', 'ATENÇÃO', 'CAMADAS', 'CHANCES', 'ROLETA', 'RESPOSTA']
SET_RANGE = """(v)=>{ const el=document.querySelector('.gm input[type=range]'); if(!el) return 'no'; const st=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; st.call(el, String(v)); el.dispatchEvent(new Event('input',{bubbles:true})); return 'ok' }"""
SEEN = {}
async def solve(g, z, shots):
    w = 350
    if z == 'prever':
        for opt, nx in [('futebol', 'Próxima rodada'), ('Brasil', 'Próxima rodada'), ('Brasília', 'Ver o resultado')]:
            await g.ev(f"""(()=>{{ const b=[...document.querySelectorAll('.gm .opt')].find(b=>b.textContent.trim()==={json.dumps(opt)}); b&&b.click() }})()"""); await g.wait(w)
            await click_btn(g, nx); await g.wait(w)
    elif z == 'tokens':
        for cuts in [[5], [1, 6], []]:
            for c in cuts: await click_nth(g, '.p2cut .gap', c); await g.wait(120)
            await click_btn(g, 'Conferir os cortes' if cuts else 'Não precisa cortar'); await g.wait(w)
            await click_btn(g, 'Próxima palavra'); await click_btn(g, 'Fatiar a pergunta'); await g.wait(w)
        await g.wait(3500)
        a = await text(g, '.gm .seg button:first-child'); await click_btn(g, 'Tokenizador B'); await g.wait(200); bb = await text(g, '.gm .seg button:last-child')
        check('Tokenizador A' in a and 'Tokenizador B' in bb, 'laboratório compara dois tokenizadores (%s / %s)' % (a, bb))
        check(await g.ev("document.querySelectorAll('.gm .p2tok.sm i').length > 3"), 'laboratório mostra os IDs dos tokens')
        if shots: await g.shot('tokens_lab')
    elif z == 'atencao':
        for sel, nx in [([1, 3], 'Próxima cena'), ([1, 2], 'Próxima cena'), ([3, 5], 'Concluir')]:
            for i in sel: await click_nth(g, '.p2stage .w', i); await g.wait(120)
            await click_btn(g, 'Acender os holofotes'); await g.wait(w)
            if nx == 'Concluir':
                await g.ev("(()=>{const d=document.querySelector('.gm details'); if(d) d.open=true})()"); await g.wait(200)
                check(await has(g, '.gm table.heat'), 'mapa de calor da atenção aparece')
                if shots: await g.shot('atencao_heat')
            await click_btn(g, nx); await g.wait(w)
    elif z == 'camadas':
        for i, n in [(0, 1), (1, 1), (4, 1), (6, 1), (11, 2)]:
            for _ in range(n): await click_nth(g, '.p2tab .wc', i); await g.wait(100)
        await g.wait(w)
    elif z == 'roleta':
        check(await g.ev("document.querySelector('.gm .lead').textContent.includes('previsão')"), 'roleta pede uma previsão antes')
        await click_btn(g, 'Fica menor'); await g.wait(w)
        for T in [0.3, 2.0]:
            await g.ev(f"({SET_RANGE})({T})"); await g.wait(200)
            for _ in range(3): await click_btn(g, 'Girar a roleta'); await g.wait(1900)
        check('acertou' in await g.ev("[...document.querySelectorAll('.gm .card')].map(c=>c.textContent).join(' ')"), 'roleta confere o palpite')
        await click_btn(g, 'Baixa'); await g.wait(w)
        check(not await has(g, '.gm .ok'), 'só escolher “baixa” não conclui (falta a pergunta sobre verdade)')
        await click_btn(g, 'Sim, temperatura baixa'); await g.wait(w)
        check('Rio' in await text(g, '.gm .bad'), 'resposta errada explica o porquê')
        await click_btn(g, 'Não: ela só repete'); await g.wait(w)
        if shots: await g.shot('roleta')
    elif z == 'treino':
        for _ in range(8):
            if await has(g, '.gm .ok'): break
            await click_btn(g, 'Treinar 10 passos'); await g.wait(300)
    elif z == 'rag':
        for t in ['Perguntar sem buscar', 'Ligar a busca', 'Próxima pergunta', 'Adicionar documento', 'Última pergunta']:
            await click_btn(g, t); await g.wait(w)
        top = await g.ev("[...document.querySelectorAll('.gm .card')].map(c=>c.textContent).join(' | ')")
        whole = await g.ev("document.querySelector('.gm').textContent")
        check('Aviso de 2019' in top, 'a busca da pergunta 3 traz o aviso velho')
        check('RECUPERAÇÃO' in whole and 'GERAÇÃO' in whole, 'busca e geração aparecem separadas')
        await click_btn(g, 'Sim! A biblioteca abre'); await g.wait(w)
        check('2019' in await text(g, '.gm .bad'), 'escolher a resposta sem base explica o erro')
        await click_btn(g, 'Só achei um aviso'); await g.wait(w)
        if shots: await g.shot('rag')

async def drive(g, until_js, z, shots, timeout=120000):
    tt = 0; solved = False
    while tt < timeout:
        st = await g.ev("""(()=>{ const g=__pf.useGame.getState(); return {doc: !!document.querySelector('.doc'), note: !!document.querySelector('.doc .doc-note'), gm: !!document.querySelector('.gm'), ok: !!document.querySelector('.gm .ok'), dlg: !!g.dialog, amb: !!(g.dialog&&g.dialog.ambient), focus: g.focus, cine: !!g.cine, until: !!(%s)} })()""" % until_js)
        if st['until'] and not st['dlg'] and not st['gm'] and not st['doc'] and not st['focus']: return True
        if st['doc']:
            if st['note']: SEEN[z] = True
            await g.ev("(()=>{const b=document.querySelector('.doc .btn.primary'); b&&b.click()})()")
        elif st['gm'] and st['ok']:
            await click_btn(g, 'Continuar')
        elif st['gm'] and not solved:
            solved = True
            await solve(g, z, shots)
        elif st['dlg'] and not st['amb']:
            await g.ev("(()=>{const ch=document.querySelector('.dlg .choices .btn'); if(ch){ch.click(); return} const d=document.querySelector('.dlg:not(.ambient)'); if(d) d.click()})()")
        elif st['cine']:
            await g.ev("(()=>{const sk=document.querySelector('.skip'); if(sk) sk.click()})()")
        await g.wait(300); tt += 300
    return False

async def main():
    shots = '--shots' in sys.argv
    W, H = (390, 844) if '--mobile' in sys.argv else (1280, 720)
    async with async_playwright() as p:
        b, pg, errs = await launch(p, W, H, {"level": "p2", "flags": {"nova": 1, "pro_done": 1, "l1_done": 1}}, dpr=2 if W < 700 else 1)
        await pg.click('.title .btn.primary'); await pg.wait_for_timeout(2500)
        g = Game(pg, 'p2' + ('m' if W < 700 else 'd'))
        await drive(g, "g.flags.p2_intro", 'intro', False, 60000)
        check(await g.flag('p2_intro') == 1, 'chegada à fábrica')
        for i, z in enumerate(ZS):
            obj = None
            for _ in range(40):
                obj = await g.ev("__pf.useGame.getState().objective")
                if obj and obj.get('target'): break
                await g.advance(300)
            t = obj['target']; ok = await g.walk(t[0], t[1], timeout=60000)
            if not ok[0]: await g.tp(t[0], t[1])
            await g.use('npc_host_' + z)
            if z == 'vetores':
                await drive(g, "g.flags.p2i_vetores", z, shots, 60000)
                for w, grp in [('Madri', 'capitais'), ('pênalti', 'futebol'), ('salário', 'economia')]:
                    pos = await g.ev(f"(()=>{{const it=__pf.INTERACTS.get('npc_lost_{w}'); return [it.x,it.y]}})()")
                    await g.walk(pos[0], pos[1], timeout=30000); await g.use('npc_lost_' + w); await g.wait(400)
                    pos = await g.ev(f"(()=>{{const it=__pf.INTERACTS.get('p2v_drop_{grp}'); return [it.x,it.y]}})()")
                    await g.walk(pos[0], pos[1], timeout=30000); await g.use('p2v_drop_' + grp); await g.wait(600)
                await drive(g, "g.flags.p2v_arrow", z, shots, 60000)
                pos = await g.ev("(()=>{const it=__pf.INTERACTS.get('p2v_lisboa'); return [it.x,it.y]})()")
                await g.walk(pos[0], pos[1], timeout=30000); await g.use('p2v_lisboa')
            await drive(g, "g.flags.p2_%s" % z, z, shots)
            check(await g.flag('p2_' + z) == 1, 'estação %d (%s) concluída' % (i + 1, z))
            check(SEEN.get(z), 'documento de %s mostra “O jogo simplificou”' % z)
        obj = None
        for _ in range(30):
            obj = await g.ev("__pf.useGame.getState().objective")
            if obj and 'Prompt' in obj['text']: break
            await g.advance(400)
        t = obj['target']; await g.walk(t[0], t[1], timeout=60000)
        tt = 0; ordered = False; simp = False
        while tt < 120000:
            st = await g.ev("""(()=>{ const g=__pf.useGame.getState(); const h=document.querySelector('.gm h4'); return {gm: !!document.querySelector('.gm'), title: h?h.textContent:'', dlg: !!g.dialog, amb: !!(g.dialog&&g.dialog.ambient), done: !!g.flags.p2_done, cine: !!g.cine, focus: g.focus} })()""")
            if st['gm'] and 'ordem' in st['title'] and not ordered:
                if shots: await g.shot('ordem')
                await g.ev("""(()=>{ const b=[...document.querySelectorAll('.gm .opt')].find(b=>b.querySelector('b').textContent==='CHANCES'); b&&b.click() })()"""); await g.wait(200)
                check(len(await text(g, '.gm .bad')) > 5, 'ordem errada mostra uma pista')
                for k in ORDER:
                    await g.ev(f"""(()=>{{ const b=[...document.querySelectorAll('.gm .opt')].find(b=>b.querySelector('b').textContent==={json.dumps(k)}); b&&b.click() }})()"""); await g.wait(150)
                ordered = True
                check(await has(g, '.gm .ok'), 'os 8 passos foram ordenados')
                if shots: await g.shot('ordem_ok')
                await click_btn(g, 'Ver a Engine responder')
            elif st['gm']:
                simp = simp or await has(g, '.gm .simp')
                await g.ev("(()=>{const b=document.querySelector('.gm .btn.primary'); if(b) b.click()})()")
            elif st['dlg'] and not st['amb']:
                await g.ev("(()=>{const ch=document.querySelector('.dlg .choices .btn'); if(ch){ch.click(); return} const d=document.querySelector('.dlg:not(.ambient)'); if(d) d.click()})()")
            elif st['cine']:
                await g.ev("(()=>{const sk=document.querySelector('.skip'); if(sk) sk.click()})()")
            elif st['done'] and not st['focus']: break
            await g.wait(400); tt += 400
        check(ordered, 'o desafio de ordenar apareceu antes da resposta')
        check(simp, 'o caminho final avisa que é simplificado')
        check(await g.flag('p2_done') == 1, 'Fase 2 concluída')
        check('TRANSFORMER' in await g.ev("__pf.useGame.getState().cores"), 'núcleo TRANSFORMER recuperado')
        obj = await g.ev("__pf.useGame.getState().objective"); t = obj['target']
        await g.walk(t[0], t[1]); await g.use('p2_portal'); await g.wait(6000)
        check((await g.state())['level'] == 'p3', 'portal leva à Fase 3')
        finish(errs)
        await b.close()
asyncio.run(main())
