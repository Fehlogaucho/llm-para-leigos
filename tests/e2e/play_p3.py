"""Fase 3 inteira (o laboratório) e o final no quarto.
Uso: python3 tests/e2e/play_p3.py [--mobile] [--shots] [--pilot]"""
import asyncio, json, sys
from lib import *
EXAM_A = [1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1]
async def solve(g, title, shots):
    w = 350
    if 'Como vai se chamar' in title:
        await click_nth(g, '.gm .opt', 1)
    elif 'Biblioteca de Dados' in title:
        await click_btn(g, 'Enviar para o laboratório')
    elif 'Vocabulário' in title:
        await click_btn(g, '1 token'); await g.wait(w)
    elif 'Forja' in title:
        check(await has(g, '.gm .ficha'), 'Forja mostra a ficha técnica (mini-rede × LLM moderna)')
        dis = await g.ev("[...document.querySelectorAll('.gm .foot .btn')].every(b=>b.disabled)")
        check(dis, 'treino só libera depois do palpite')
        await click_btn(g, 'Vai cair'); await g.wait(200)
        for _ in range(4):
            await click_btn(g, 'Treinar 50 épocas'); await g.wait(1500)
            if await has(g, '.gm .ok'): break
        check('decoreba' in await text(g, '.gm .ok'), 'fim do treino avisa que erro baixo pode ser decoreba')
        if shots: await g.shot('forja')
    elif 'Sala de Teste' in title:
        for _ in range(7): await click_btn(g, 'Passo'); await g.wait(150)
        await g.wait(w)
        await click_btn(g, 'Aumentar a memória'); await g.wait(800)
        check('teste de verdade' in await g.ev("document.querySelector('.gm').textContent"), 'depois de Brasília vem o teste com frases novas')
        await click_btn(g, 'Algumas sim'); await g.wait(300)
        rows = await g.ev("[...document.querySelectorAll('.gm .gen')].map(r=>r.textContent)")
        print('   generalização:', rows, flush=True)
        check(len(rows) == 3 and any('NUNCA VISTA' in r for r in rows), 'tabela de frases vistas e não vistas')
        if shots: await g.shot('teste_gen')
        await click_btn(g, 'Que ela entende o mundo'); await g.wait(w)
        check('Espanha' in await text(g, '.gm .bad'), 'resposta errada sobre o teste é explicada')
        await click_btn(g, 'Que ela vai bem no que parece'); await g.wait(w)
        check('alucinação' in await text(g, '.gm .ok'), 'conclusão fala de alucinação e generalização')
    elif 'Prompt ou ajuste' in title:
        await g.ev("(()=>{const c=document.querySelector('.gm input[type=checkbox]'); c&&c.click()})()"); await g.wait(w)
        for _ in range(8):
            await click_btn(g, 'passo de ajuste fino'); await g.wait(200)
            if await g.ev("document.querySelector('.gm').textContent.includes('Qual técnica usar')"): break
        check(not await has(g, '.gm .ok'), 'prompt e ajuste fino não bastam: falta escolher a técnica')
        if shots: await g.shot('ajuste_tecnica')
        for i, (wrong, right) in enumerate([('Prompt', 'RAG'), ('RAG', 'Prompt'), ('RAG', 'Ajuste fino')]):
            await g.ev(f"""(()=>{{ const rows=[...document.querySelectorAll('.gm .card')].filter(c=>c.textContent.includes('Qual técnica')); const r=rows[rows.length-1]; const groups=r.querySelectorAll('.row'); const b=[...groups[{i}].querySelectorAll('button')].find(b=>b.textContent.endsWith({json.dumps(wrong)})); b&&b.click() }})()"""); await g.wait(150)
            await g.ev(f"""(()=>{{ const rows=[...document.querySelectorAll('.gm .card')].filter(c=>c.textContent.includes('Qual técnica')); const r=rows[rows.length-1]; const groups=r.querySelectorAll('.row'); const b=[...groups[{i}].querySelectorAll('button')].find(b=>b.textContent.endsWith({json.dumps(right)})); b&&b.click() }})()"""); await g.wait(150)
        check(await has(g, '.gm .ok'), 'as três situações classificadas (prompt, RAG, ajuste fino)')
    elif 'Qual resposta' in title:
        for best in [0, 1, 0]:
            await click_nth(g, '.gm .opt', best); await g.wait(w)
            await click_btn(g, 'Próxima'); await click_btn(g, 'Concluir'); await g.wait(w)
    elif 'prova final' in title:
        n = await g.ev("document.querySelectorAll('.gm [style*=\"flex: 1\"]').length")
        for k, a in enumerate(EXAM_A):
            await click_nth(g, '.gm .opt', a); await g.wait(150)
            await click_btn(g, 'Próxima'); await click_btn(g, 'Ver a nota'); await g.wait(150)
        check('12' in await g.ev("document.querySelector('.gm').textContent"), 'prova tem 12 perguntas')
        if shots: await g.shot('prova')
async def drive(g, until_js, shots, timeout=150000):
    tt = 0; seen = set()
    while tt < timeout:
        st = await g.ev("""(()=>{ const g=__pf.useGame.getState(); const h=document.querySelector('.gm h4'); return {doc: !!document.querySelector('.doc'), gm: !!document.querySelector('.gm'), title: h?h.textContent:'', ok: !!document.querySelector('.gm .ok'), dlg: !!g.dialog, amb: !!(g.dialog&&g.dialog.ambient), focus: g.focus, cine: !!g.cine, until: !!(%s)} })()""" % until_js)
        if st['until'] and not st['dlg'] and not st['gm'] and not st['doc'] and not st['focus']: return True
        if st['doc']:
            await g.ev("(()=>{const b=document.querySelector('.doc .btn.primary'); b&&b.click()})()")
        elif st['gm'] and st['ok']:
            await click_btn(g, 'Continuar')
        elif st['gm'] and st['title'] not in seen:
            seen.add(st['title'])
            await solve(g, st['title'], shots)
        elif st['dlg'] and not st['amb']:
            await g.ev("(()=>{const ch=document.querySelector('.dlg .choices .btn'); if(ch){ch.click(); return} const d=document.querySelector('.dlg:not(.ambient)'); if(d) d.click()})()")
        elif st['cine']:
            await g.ev("(()=>{const sk=document.querySelector('.skip'); if(sk) sk.click()})()")
        await g.wait(300); tt += 300
    return False
async def main():
    shots = '--shots' in sys.argv
    pilot = '--pilot' in sys.argv
    W, H = (390, 844) if '--mobile' in sys.argv else (1280, 720)
    async with async_playwright() as p:
        b, pg, errs = await launch(p, W, H, {"level": "p3", "flags": {"nova": 1, "pro_done": 1, "l1_done": 1, "p2_done": 1}}, dpr=2 if W < 700 else 1, query='?piloto=1' if pilot else None)
        await pg.click('.title .btn.primary'); await pg.wait_for_timeout(2500)
        g = Game(pg, 'p3' + ('m' if W < 700 else 'd'))
        await drive(g, "g.flags.p3_intro", shots, 90000)
        check(await g.flag('p3_intro') == 1, 'chegada ao laboratório')
        for i, sid in enumerate(['dados', 'tokens', 'forja', 'teste', 'ajuste', 'prova']):
            obj = None
            for _ in range(40):
                obj = await g.ev("__pf.useGame.getState().objective")
                if obj and obj.get('target'): break
                await g.advance(300)
            t = obj['target']; ok = await g.walk(t[0], t[1], timeout=40000)
            if not ok[0]: await g.tp(t[0], t[1])
            await g.use('p3st%d' % i)
            await drive(g, "g.flags.p3_%s" % sid, shots)
            check(await g.flag('p3_' + sid) == 1, 'estação %d (%s) concluída' % (i + 1, sid))
        await drive(g, "g.flags.p3_done", shots, 60000)
        check('CREATOR' in await g.ev("__pf.useGame.getState().cores"), 'núcleo CREATOR recuperado')
        check(await g.flag('p3_nota') >= 8, 'nota da prova guardada (%s)' % await g.flag('p3_nota'))
        codex = await g.ev("Object.keys(__pf.useGame.getState().codex)")
        check('generalizacao' in codex and 'mini_rede' in codex, 'verbetes novos do Codex desbloqueados')
        obj = await g.ev("__pf.useGame.getState().objective"); t = obj['target']
        await g.walk(t[0], t[1]); await g.use('p3_portal'); await g.wait(6000)
        await drive(g, "g.objective", shots, 40000)
        obj = await g.ev("__pf.useGame.getState().objective")
        t = obj['target']; await g.walk(t[0], t[1]); await g.use('pc')
        chat = ''; tt = 0
        while tt < 120000:
            st = await g.ev("(()=>{ const g=__pf.useGame.getState(); return {dlg: !!g.dialog, amb: !!(g.dialog&&g.dialog.ambient), done: !!g.flags.fim_done, chat: [...document.querySelectorAll('.chat .msg')].map(m=>m.textContent).join(' | ')} })()")
            if len(st['chat']) > len(chat): chat = st['chat']
            if st['done']: break
            if st['dlg'] and not st['amb']: await g.ev("(()=>{const d=document.querySelector('.dlg:not(.ambient)'); if(d) d.click()})()")
            await g.wait(300); tt += 300
        await g.wait(3500)
        check('confira' in chat, 'a IA do final lembra de conferir as respostas')
        check(await has(g, '.modal .sheet'), 'créditos aparecem')
        if pilot:
            check('Avaliação final' in await g.ev("document.querySelector('.modal .sheet').textContent"), 'modo piloto: créditos oferecem a avaliação final')
            m = await g.ev("JSON.parse(localStorage.getItem('pf2d-metrics-v1')||'{}')")
            acts = m.get('activities', {})
            check('p3:teste' in acts and acts['p3:teste'].get('done'), 'métricas registram as atividades da Fase 3')
            check(m.get('exam', {}).get('attempts', 0) >= 1, 'métricas registram a prova')
        if shots: await g.shot('credits')
        finish(errs)
        await b.close()
asyncio.run(main())
