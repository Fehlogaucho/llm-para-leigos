"""Teste rápido de regressão: tela inicial, save danificado, modo piloto,
opções de acessibilidade, diálogo (voltar/repetir), viagem rápida, gráficos
leves e entrada direta em todas as missões pelo menu “Capítulos e missões”.
Uso: python3 tests/e2e/smoke.py [--mobile] [--shots] [--quick]"""
import asyncio, json, sys
from lib import *

async def open_chapters_from_title(g):
    await g.click_text('Capítulos e missões'); await g.wait(500)

async def pick_and_go(g, ch_title, idx):
    await g.ev(f"""(()=>{{ const h=[...document.querySelectorAll('.chap-h')].find(b=>b.querySelector('.t').textContent==={json.dumps(ch_title)}); if(h && h.getAttribute('aria-expanded')!=='true') h.click() }})()"""); await g.wait(250)
    r = await g.ev(f"""(()=>{{ const h=[...document.querySelectorAll('.chap-h')].find(b=>b.querySelector('.t').textContent==={json.dumps(ch_title)}); const box=h.closest('.chap'); const ms=box?box.querySelectorAll('.chap-m'):document.querySelectorAll('.chap-m'); const m=ms[{idx}]; if(!m) return 'nom'; m.click(); return m.querySelector('.l').textContent }})()"""); await g.wait(250)
    await g.ev("(()=>{const b=[...document.querySelectorAll('.chap-go .btn')][0]; b&&b.click()})()")
    return r

async def main():
    shots = '--shots' in sys.argv; quick = '--quick' in sys.argv
    W, H = (390, 844) if '--mobile' in sys.argv else (1280, 720)
    tag = 'sm' + ('m' if W < 700 else 'd')
    async with async_playwright() as p:
        # 1. save danificado: o jogo abre, avisa e guarda uma cópia
        b, pg, errs = await launch(p, W, H, raw_save='{isso não é json', dpr=2 if W < 700 else 1)
        g = Game(pg, tag)
        check(await has(g, '.title .save-issue'), 'save danificado: tela inicial avisa')
        check(await g.ev("!!localStorage.getItem('pf2d-save-v1-danificado')"), 'save danificado: cópia guardada')
        check(await g.ev("__pf.useGame.getState().level") == 'quarto', 'save danificado: começa do zero')
        if shots: await g.shot('save_issue')
        await b.close()
        # 2. save incompleto: aproveita o que dá
        b, pg, errs2 = await launch(p, W, H, raw_save=json.dumps({"level": "p2", "flags": {"l1_done": 1, "x": "y"}, "cores": "MATRIX"}))
        g = Game(pg, tag)
        check('ajustada' in await text(g, '.title .save-issue'), 'save incompleto: avisa que foi ajustado')
        check(await g.ev("__pf.useGame.getState().flags.l1_done") == 1 and await g.ev("__pf.useGame.getState().level") == 'p2', 'save incompleto: progresso válido mantido')
        await b.close()
        errs += errs2
        # 3. modo piloto pelo link: novo jogo começa com a avaliação inicial
        b, pg, errs3 = await launch(p, W, H, query='?piloto=1')
        g = Game(pg, tag)
        await pg.click('.title .btn.primary'); await g.wait(600)
        check('AVALIAÇÃO INICIAL' in await g.ev("document.body.textContent"), 'modo piloto: avaliação inicial antes do jogo')
        await g.ev("document.querySelector('.modal .btn.primary').click()"); await g.wait(200)
        for i in range(8): await click_nth(g, '.modal .opt', 1); await g.wait(120)
        check('Obrigado' in await g.ev("document.body.textContent"), 'modo piloto: avaliação termina')
        await g.wait(700)
        m = await g.ev("JSON.parse(localStorage.getItem('pf2d-metrics-v1')||'{}')")
        check(m.get('pre', {}).get('total') == 8, 'modo piloto: resultado guardado só no navegador')
        await g.ev("document.querySelector('.modal .btn.primary').click()"); await g.wait(4000)
        check(await g.ev("__pf.useGame.getState().screen") == 'game', 'modo piloto: depois da avaliação o jogo começa')
        await b.close()
        errs += errs3
        # 4. menu: acessibilidade + diálogo
        b, pg, errs4 = await launch(p, W, H, {"level": "p2", "flags": {"nova": 1, "pro_done": 1, "l1_done": 1}})
        g = Game(pg, tag)
        await pg.click('.title .btn.primary'); await g.wait(4000)
        await g.ev("__pf.useGame.setState({menu:'settings'})"); await g.wait(400)
        await g.click_text('Maior'); await g.click_text('Reduzido'); await g.ev("(()=>{const b=[...document.querySelectorAll('.set-row')].find(r=>r.textContent.includes('Contraste')); [...b.querySelectorAll('button')].find(x=>x.textContent==='Alto').click()})()"); await g.wait(300)
        ds = await g.ev("(()=>{const r=document.documentElement; return [r.dataset.text, r.dataset.contrast, r.classList.contains('reduced')]})()")
        check(ds == ['maior', 'alto', True], 'opções de texto, contraste e movimento aplicadas (%s)' % ds)
        check(await g.ev("!!document.querySelector('input[aria-label=\"Volume da voz\"]')"), 'controle de volume da voz')
        if shots: await g.shot('menu_acess')
        await g.ev("__pf.useGame.setState({menu:null})"); await g.wait(300)
        # diálogo: voltar uma fala
        for _ in range(20):
            if await has(g, '.dlg:not(.ambient)'): break
            await g.wait(300)
        if await has(g, '.dlg:not(.ambient)'):
            await g.ev("document.querySelector('.dlg').click()"); await g.wait(200); await g.ev("document.querySelector('.dlg').click()"); await g.wait(300)
            i0 = await g.ev("__pf.useGame.getState().dialog && __pf.useGame.getState().dialog.i")
            await g.ev("(()=>{const b=document.querySelector('.dlg-tools [aria-label^=\"Voltar\"]'); b&&b.click()})()"); await g.wait(200)
            i1 = await g.ev("__pf.useGame.getState().dialog && __pf.useGame.getState().dialog.i")
            check(i0 is not None and i1 == i0 - 1, 'diálogo: botão de voltar para a fala anterior (%s → %s)' % (i0, i1))
            check(await has(g, '.dlg-tools [aria-label^="Ouvir"]'), 'diálogo: botão de ouvir de novo')
            if shots: await g.shot('dialogo')
        await b.close()
        errs += errs4
        # 4b. viagem rápida e gráficos leves
        b, pg, errs6 = await launch(p, W, H, {"level": "p2", "flags": {"nova": 1, "pro_done": 1, "l1_done": 1, "p2_intro": 1}}, dpr=2 if W < 700 else 1)
        g = Game(pg, tag)
        await pg.click('.title .btn.primary'); await g.wait(3500)
        for _ in range(30):
            st = await g.ev("(()=>{const s=__pf.useGame.getState(); return {d: !!(s.dialog && !s.dialog.ambient), c: !!s.cine}})()")
            if not st['d'] and not st['c']: break
            await g.advance(400)
        await g.wait(800)
        d0 = await g.ev("(()=>{const o=__pf.useGame.getState().objective, R=__pf.RT.player; return o&&o.target ? Math.hypot(o.target[0]-R.x, o.target[1]-R.y) : -1})()")
        vis = await g.ev("(()=>{const b=document.querySelector('.travel'); return !!b && b.style.display!=='none'})()")
        check(d0 > 4.5 and vis, 'viagem rápida: botão “Ir até lá” aparece com o objetivo longe (%.1f casas)' % d0)
        if shots: await g.shot('viagem_botao')
        await g.ev("document.querySelector('.travel').click()"); await g.wait(1600)
        d1 = await g.ev("(()=>{const o=__pf.useGame.getState().objective, R=__pf.RT.player; return o&&o.target ? Math.hypot(o.target[0]-R.x, o.target[1]-R.y) : 0})()")
        talk = await g.ev("!!__pf.useGame.getState().dialog")
        check(d1 < 2.5 and talk, 'viagem rápida: NEX chega ao objetivo e a conversa começa (%.1f casas)' % d1)
        await g.ev("__pf.useGame.setState({menu:'settings'})"); await g.wait(400)
        rows = await g.ev("[...document.querySelectorAll('.set-row')].map(r=>r.textContent).join('|')")
        check('Gráficos' in rows and 'Texto das falas' in rows, 'opções de gráficos e de texto instantâneo no menu')
        await g.ev("(()=>{const b=[...document.querySelectorAll('.set-row')].find(r=>r.textContent.includes('Gráficos')); [...b.querySelectorAll('button')].find(x=>x.textContent==='Leves').click()})()"); await g.wait(300)
        await g.ev("__pf.useGame.setState({menu:null})"); await g.wait(1200)
        check(await g.ev("__pf.useGame.getState().settings.gfx") == 'leve', 'gráficos leves ligados sem erro')
        await b.close()
        errs += errs6
        # 5. capítulos: entrar em cada missão
        b, pg, errs5 = await launch(p, W, H, None)
        g = Game(pg, tag)
        plan = [('O Quarto', [0]), ('A Language Engine', [0]), ('O Arquivo da Memória', list(range(13))), ('A Fábrica de Previsões', list(range(10))), ('O Laboratório', list(range(8))), ('De Volta para Casa', [0])]
        if quick: plan = [('O Arquivo da Memória', [0, 6, 12]), ('A Fábrica de Previsões', [0, 5, 9]), ('O Laboratório', [0, 4, 7])]
        first = True
        for ch, idxs in plan:
            for mi in idxs:
                if first: await open_chapters_from_title(g); first = False
                else: await g.ev("__pf.useGame.setState({menu:'chapters'})"); await g.wait(400)
                lab = await pick_and_go(g, ch, mi)
                ok = False
                for _ in range(40):
                    st = await g.ev("(()=>{const s=__pf.useGame.getState(); return {lv: s.level, loading: s.loading, ready: s.levelReady}})()")
                    if not st['loading'] and st['lv'] and st['ready'] == st['lv']: ok = True; break
                    await g.wait(250)
                await g.wait(1200)
                check(ok, 'capítulo “%s” › missão %d (%s) carrega' % (ch, mi, lab))
        if shots: await g.shot('fim_capitulos')
        await b.close()
        errs += errs5
        finish(errs)
asyncio.run(main())
