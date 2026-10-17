"""Fase 1 inteira: as 11 ilhas, o desafio de ligar as ideias e a Memória Central.
Uso: python3 tests/e2e/play_p1.py [--mobile] [--shots] [--n=11]"""
import asyncio, json, sys
from lib import *

MIX = [3, 0, 4, 1, 2]  # ordem das descrições no desafio (igual a MIX em p1/Doc.tsx)

async def run_stop(g, i, shots):
    sid = STOPS[i]
    obj = None
    for _ in range(30):
        obj = await g.ev("__pf.useGame.getState().objective")
        if obj and obj.get('target'): break
        await g.advance(400)
    if sid == 'tabela':
        t = obj['target']; await g.walk(t[0], t[1])
        if shots: await g.shot('village')
        await g.use('l1stop1')
        await drive(g, "g.flags.g2_talk", shots, set())
        # a conversa com o comerciante já leva o NEX até a mesa, sem precisar andar
        await drive(g, "g.flags.l1_tabela && !g.focus", shots, set())
        check(await g.flag('l1_tabela') == 1, 'ilha %d (%s) concluída' % (i + 1, sid))
        return
    t = obj['target']
    ok = await g.walk(t[0], t[1])
    if not ok[0]: await g.tp(t[0], t[1])
    await g.use('l1stop%d' % i)
    docs = 0; tt = 0; note = src = False
    while tt < 90000:
        st = await g.ev("""(()=>{ const g=__pf.useGame.getState(); return {doc: !!document.querySelector('.doc'), gm: !!document.querySelector('.gm'), ok: !!document.querySelector('.gm .ok'), dlg: !!g.dialog, amb: !!(g.dialog&&g.dialog.ambient), focus: g.focus, flag: !!g.flags['l1_%s'] } })()""" % sid)
        if st['doc']:
            if docs == 0 and shots: await g.shot(sid + '_doc')
            docs += 1
            src = src or await has(g, '.doc .doc-src'); note = note or await has(g, '.doc .doc-note')
            if docs <= 4 and await has(g, '.doc .doc-src') and shots: await g.shot(sid + '_doc_fim')
            await click_sel(g, '.doc .btn.primary')
        elif st['gm'] and not st['ok']:
            if shots: await g.shot(sid + '_game')
            await solve(g, sid)
        elif st['gm'] and st['ok']:
            await g.click_text('Continuar')
        elif st['dlg'] and not st['amb']:
            await g.ev("(()=>{const ch=document.querySelector('.dlg .choices .btn'); if(ch){ch.click(); return} const d=document.querySelector('.dlg:not(.ambient)'); if(d) d.click()})()")
        elif st['flag'] and not st['focus'] and not st['dlg']:
            break
        await g.wait(300); tt += 300
    check(await g.flag('l1_' + sid) == 1, 'ilha %d (%s) concluída' % (i + 1, sid))
    check(src, 'documento de %s mostra as fontes' % sid)

async def main():
    shots = '--shots' in sys.argv
    W, H = (390, 844) if '--mobile' in sys.argv else (1280, 720)
    n = int(next((a.split('=')[1] for a in sys.argv if a.startswith('--n=')), '11'))
    async with async_playwright() as p:
        b, pg, errs = await launch(p, W, H, {"level": "p1", "flags": {"nova": 1, "pro_done": 1}}, dpr=2 if W < 700 else 1)
        await pg.click('.title .btn.primary'); await pg.wait_for_timeout(2500)
        g = Game(pg, 'p1' + ('m' if W < 700 else 'd'))
        await g.advance(30000)
        check(await g.flag('l1_intro') == 1, 'chegada ao Arquivo')
        for i in range(n): await run_stop(g, i, shots)
        if n == 11:
            # no fim, o NEX é levado sozinho (viagem rápida) até a Memória Central
            near = False; tgt = None
            for _ in range(40):
                o = await g.ev("__pf.useGame.getState().objective")
                if o and 'Central' in o['text'] and o.get('target'): tgt = o['target']
                if tgt: near = await g.ev("Math.hypot(%f-__pf.RT.player.x, %f-__pf.RT.player.y) < 2.5" % (tgt[0], tgt[1]))
                if near: break
                await g.wait(300)
            check(near, 'no fim, o NEX vai sozinho até a Memória Central')
            tt = 0; matched = False; wrong_hint = ''
            while tt < 120000:
                st = await g.ev("""(()=>{ const g=__pf.useGame.getState(); return {gm: !!document.querySelector('.gm'), match: !!document.querySelector('.match'), dlg: !!g.dialog, amb: !!(g.dialog&&g.dialog.ambient), done: !!g.flags.l1_done, cine: !!g.cine, focus: g.focus} })()""")
                if st['match'] and not matched:
                    if shots: await g.shot('ligar')
                    # um erro de propósito: deve aparecer uma dica
                    await click_nth(g, '.match .col:first-child .opt', 0); await click_nth(g, '.match .col:last-child .opt', 0); await g.wait(300)
                    wrong_hint = await text(g, '.gm .bad')
                    for i in range(5):
                        await click_nth(g, '.match .col:first-child .opt', i); await g.wait(120)
                        await click_nth(g, '.match .col:last-child .opt', MIX.index(i)); await g.wait(200)
                    matched = True
                    check(await has(g, '.gm .ok'), 'desafio de ligar as ideias resolvido')
                    check('💡' in wrong_hint, 'erro no desafio mostra dica (%s)' % wrong_hint[:50])
                    if shots: await g.shot('ligar_ok')
                    await click_btn(g, 'Continuar')
                elif st['gm']:
                    await g.ev("(()=>{const b=document.querySelector('.gm .btn.primary'); if(b) b.click()})()")
                elif st['dlg'] and not st['amb']:
                    await g.ev("(()=>{const ch=document.querySelector('.dlg .choices .btn'); if(ch){ch.click(); return} const d=document.querySelector('.dlg:not(.ambient)'); if(d) d.click()})()")
                elif st['cine']:
                    await g.ev("(()=>{const sk=document.querySelector('.skip'); if(sk) sk.click()})()")
                elif st['done'] and not st['focus']: break
                await g.wait(400); tt += 400
            check(matched, 'o desafio de ligar apareceu')
            check(await g.flag('l1_done') == 1, 'Fase 1 concluída')
            check('MATRIX' in await g.ev("__pf.useGame.getState().cores"), 'núcleo MATRIX recuperado')
            obj = await g.ev("__pf.useGame.getState().objective"); t = obj['target']
            await g.walk(t[0], t[1]); await g.use('l1_portal'); await g.wait(6000)
            check((await g.state())['level'] == 'p2', 'portal leva à Fase 2')
        finish(errs)
        await b.close()
asyncio.run(main())
