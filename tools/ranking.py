import re,json,unicodedata,datetime,sys
src=sys.argv[2] if len(sys.argv)>2 else "/tmp/claude-0/-home-claude/b84f39f2-8bac-5149-b595-0f4483696ee7/scratchpad/artifact-files/306ece63-4323-4182-9754-c645d0ddda96/index.html"
s=open(src).read();R=json.loads(re.search(r'<script id="ranking-data"[^>]*>(.*?)</script>',s,re.S).group(1))
def n(t):t=unicodedata.normalize('NFD',str(t or '')).encode('ascii','ignore').decode().lower();return ' '.join(t.split())
def same(a,b):
    a,b=n(a),n(b)
    if not a or not b:return False
    if a==b:return True
    A,B=a.split(),b.split();S,L=(A,B) if len(A)<=len(B) else (B,A)
    return len(S)>=2 and all(w in L for w in S)
def slug(t):return re.sub(r'-+','-',re.sub(r'[^a-z0-9]','-',n(t))).strip('-')
d=json.load(open('data/team.json'))
for a in json.loads(sys.argv[1]) if len(sys.argv)>1 else []:
    if not any(same(x['socio'],a['socio']) for x in d['activaciones']):
        a.setdefault('fuente','gmail');a.setdefault('id',slug(a['socio']));d['activaciones'].append(a)
        if a['fecha']>d['config'].get('activacionesCorte',''):d['config']['activacionesCorte']=a['fecha']
VOL={"Starter":50,"Classic":200,"Premium":500}
now=datetime.datetime.now(datetime.UTC).replace(tzinfo=None);mes0=now.strftime('%Y-%m-01T00:00:00')
hn=now-datetime.timedelta(hours=6);mon=(hn-datetime.timedelta(days=hn.weekday())).replace(hour=0,minute=0,second=0,microsecond=0);wk0=mon+datetime.timedelta(hours=6)
acts=[a for a in d['activaciones'] if a['fecha']>=mes0]
cw=R.get('currentWeek');old=d['ranking'];new=[];used=set()
for x in R['socios']:
    r=sum(w.get('r',0) for w in x['weeks'].values());p=sum(w.get('p',0) for w in x['weeks'].values());wk=x['weeks'].get(cw,{})
    o=next((y for y in old if same(y['nombre'],x['name'])),None);e=dict(o) if o else {}
    e.update({"nombre":x['name'],"linea":"" if x.get('line')=='?' else x.get('line',''),"registros":r,"presentaciones":p,"regSemana":wk.get('r',0),"presSemana":wk.get('p',0)})
    sid=slug(x['name'])
    while sid in used:sid+='-2'
    used.add(sid);e['id']=sid;new.append(e)
for a in acts:
    if not any(same(e['nombre'],a['patrocinador']) for e in new):
        new.append({"nombre":a['patrocinador'],"linea":"","registros":0,"presentaciones":0,"regSemana":0,"presSemana":0,"id":slug(a['patrocinador'])})
for e in new:
    mine=[a for a in acts if same(a['patrocinador'],e['nombre'])]
    e['activaciones']=len(mine);e['volumen']=sum(VOL.get(a['paquete'],0) for a in mine)
    e['actSemana']=len([a for a in mine if datetime.datetime.fromisoformat(a['fecha'].replace('Z','')[:19])>=wk0])
d['ranking']=new
for L in d.get('liderazgo',[]):
    names=[L['nombre']]+[z.strip() for z in str(L.get('nombreRanking') or '').split('|') if z.strip()]
    L['presentaciones']=sum(e['registros'] for e in new if any(same(e['nombre'],k) for k in names))
d['config']['rankingActualizado']=R.get('updated')
json.dump(d,open('data/team.json','w'),ensure_ascii=False,indent=1)
print(len(new),sum(e['registros'] for e in new),len(acts),[(e['nombre'],e['activaciones'],e['volumen']) for e in new if e.get('actSemana')])
