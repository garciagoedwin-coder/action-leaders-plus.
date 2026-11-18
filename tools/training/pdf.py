import sys
from playwright.sync_api import sync_playwright
u,out,shots=sys.argv[1],sys.argv[2],sys.argv[3]
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':1920,'height':1080});pg.goto(u);pg.wait_for_timeout(1500)
  n=pg.evaluate("document.querySelectorAll('section.s').length")
  for i in range(n):
    pg.evaluate(f"window.scrollTo(0,{i*1080})");el=pg.query_selector_all('section.s')[i];el.screenshot(path=f"{shots}/s{i+1:02d}.png")
  pg.pdf(path=out,width='1920px',height='1080px',print_background=True,margin={'top':'0','bottom':'0','left':'0','right':'0'})
  print(n);b.close()
