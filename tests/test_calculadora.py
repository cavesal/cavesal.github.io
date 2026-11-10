# Pruebas automáticas CaVeSal® — calculadora Full (ejecutar: python3 tests/test_calculadora.py desde la raíz del repo)
import asyncio,subprocess,time,datetime,os,sys
from playwright.async_api import async_playwright
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EX=os.environ.get('CHROME_EXE')
srv=subprocess.Popen(['python3','-m','http.server','8951'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
fail=0
def ok(nombre,cond,detalle=''):
  global fail
  print(('OK   ' if cond else 'FALLA'),nombre,detalle,flush=True)
  if not cond: fail+=1
def fum(sem): return (datetime.date.today()-datetime.timedelta(weeks=sem)).isoformat()
CALC="(js)=>{eval(js);calcular();return (window.__cavesalCalculoActual.findings||[]).map(f=>f.nivel+'|'+f.hallazgo+'||'+(f.conducta||''))}"
async def m():
  async with async_playwright() as p:
    b=await p.chromium.launch(**({'executable_path':EX} if EX else {}));ctx=await b.new_context(service_workers='block');pg=await ctx.new_page()
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto('http://localhost:8951/full/index.html')
    await pg.evaluate("localStorage.setItem('cavesal_full_unlocked', JSON.stringify({ok:true,clave:'TEST',t:Date.now()}))")
    await pg.reload(); await pg.wait_for_timeout(800)
    E=lambda s: pg.evaluate(s)
    # Percentiles y referencias
    ok('TN 2,0 mm con LCN 65 ≈ P79',abs(await E("ntPercentilNum(2.0,65)")-79)<=3,await E("String(ntPercentilNum(2.0,65))"))
    r=await E("JSON.stringify(riesgoPrevioTri(35,(function(){for(let c=45;c<=84;c++){const x=riesgoPrevioTri(35,c);if(x&&Math.floor(x.w)===12)return c}})()))")
    ok('35 años 12 sem: T21 ≈ 1/249','"t21":249' in r or '"t21":250' in r,r)
    ok('AUt IP 1,6 a 12+0 ≈ P42',abs(float(await E("parseFloat(utPercentil(1.6,12))"))-42)<=3,str(float(await E("parseFloat(utPercentil(1.6,12))"))))
    ok('AUt IP 1,6 a 22+0 ≈ P98',abs(float(await E("parseFloat(utPercentil(1.6,22))"))-98)<=2,str(float(await E("parseFloat(utPercentil(1.6,22))"))))
    ok('PFE 1150 g a 30 sem (INTERGROWTH) ≈ P2',abs(float(await E("parseFloat(percFromIG21(1150,30))"))-2)<=2,str(float(await E("parseFloat(percFromIG21(1150,30))"))))
    ok('LCN fuera de rango sin P95',await E("ntP95(40)===null&&ntP95(90)===null&&ntP95(60)!==null"))
    # TN: fuera de rango y marcadores no evaluados
    def tn(nt,crl,extra=''): return pg.evaluate("(()=>{['nt_mm','nt_crl','nt_nasal','nt_dv','nt_tricusp'].forEach(i=>{const e=document.getElementById(i);if(e)e.value=''});document.getElementById('nt_mm').value='%s';document.getElementById('nt_crl').value='%s';%s calcNT();return document.getElementById('nt_result').innerText})()"%(nt,crl,extra))
    t=await tn(1.8,40); ok('TN con LCN 40 mm: sin categorizar, repetir','sin categorizar' in t and 'Repetir' in t)
    t=await tn(1.8,65); ok('TN normal sin marcadores: «marcadores no evaluados»','MARCADORES NO EVALUADOS' in t)
    t=await tn(1.8,65,"document.getElementById('nt_nasal').value='presente';"); ok('TN normal con hueso nasal presente: BAJO','BAJO' in t and 'NO EVALUADOS' not in t)
    t=await tn(1.8,65,"document.getElementById('nt_nasal').value='ausente';"); ok('Hueso nasal ausente: texto Cicero 2004','Cicero 2004' in t and '1–2 %' not in t)
    # Colestasis MSPBS 2018
    async def cie(js,sem=33):
      await pg.reload(); await pg.wait_for_timeout(600)
      f=await pg.evaluate(CALC,"document.getElementById('fum').value='%s';%s"%(fum(sem),js))
      return [x for x in f if 'olestasis' in x or 'CIE' in x or 'Bilirrubina' in x]
    c=await cie("document.getElementById('lab_audt').value='15';document.getElementById('sym_prurito').value='leve';")
    ok('AB 15 µmol/L: riesgo bajo, 36–37 sem',any('riesgo bajo' in x and '36–37' in x for x in c),str(c)[:200])
    c=await cie("document.getElementById('lab_audt').value='30';")
    ok('AB 30: riesgo moderado',any('riesgo moderado' in x for x in c))
    c=await cie("document.getElementById('lab_audt').value='45';")
    ok('AB 45: alto + RCOG 38–39 sem',any('riesgo alto' in x and '38–39' in x for x in c))
    c=await cie("document.getElementById('lab_audt').value='120';")
    ok('AB 120: RCOG ≥100, considerar adelantar',any('Considerar adelantar' in x for x in c))
    c=await cie("document.getElementById('sym_prurito').value='intenso';")
    ok('Prurito intenso sin laboratorio: descartar CIE',any('descartar CIE' in x for x in c))
    # DTN
    await pg.reload(); await pg.wait_for_timeout(600)
    f=await pg.evaluate(CALC,"document.getElementById('fum').value='%s';document.getElementById('obs_dtn').checked=true;"%fum(10))
    ok('DTN previo: 4 mg ACOG / 5 mg NICE',any('4 mg/día (ACOG PB 187' in x and '5 mg' in x for x in f))
    ok('Sin errores de JavaScript',not errs,str(errs[:2]))
    await b.close()
asyncio.run(m());srv.kill()
print('FALLAS:',fail); sys.exit(1 if fail else 0)
