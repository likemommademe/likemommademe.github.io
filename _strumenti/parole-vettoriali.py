# Trasforma in vettori le parole speciali dei titoli (quelle tra <em> e </em>) disegnate con TAN Nimbus.
# Il file del font non va sul sito: online finiscono solo le forme delle parole, in assets/js/parole.js.
#
# Uso (dalla cartella del portfolio):
#   python3 _strumenti/parole-vettoriali.py [percorso/del/font.ttf]
# Serve: pip install fonttools uharfbuzz
# Va rilanciato ogni volta che dal pannello si cambia o si aggiunge una parola speciale.
import json, os, re, sys
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

FONT = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser('~/Library/Fonts/TAN-NIMBUS.ttf')
RADICE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOVE = ['_data', '_layouts', '_includes', '_progetti', '_categorie', 'index.html', 'about.md', 'work.html']
USCITA = os.path.join(RADICE, 'assets', 'js', 'parole.js')

# 1. le parole: tutto ciò che sta tra <em> e </em> (il motto MORE THAN meets THE EYE resta in testo, come vuole l'animazione)
parole = set()
for d in DOVE:
    p = os.path.join(RADICE, d)
    file = [p] if os.path.isfile(p) else [os.path.join(r, f) for r, _, fs in os.walk(p) for f in fs if f.endswith(('.yml', '.md', '.html'))]
    for f in file:
        for w in re.findall(r'<em>([^<]{1,40})</em>', open(f, encoding='utf-8').read()):
            w = w.strip()
            if w: parole.add(w)

# 2. la forma di ogni parola, composta con le crenature e le legature del font
tt = TTFont(FONT); gs = tt.getGlyphSet(); upm = tt['head'].unitsPerEm
asc, desc = tt['hhea'].ascent, tt['hhea'].descent
blob = hb.Blob.from_file_path(FONT); face = hb.Face(blob); font = hb.Font(face)
nomi = tt.getGlyphOrder()
out = {}
for w in sorted(parole):
    buf = hb.Buffer(); buf.add_str(w); buf.guess_segment_properties()
    hb.shape(font, buf, {'kern': True, 'liga': True})
    pen = SVGPathPen(gs, ntos=lambda v: str(round(v))); x = 0
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        g = nomi[info.codepoint]
        gs[g].draw(TransformPen(pen, (1, 0, 0, -1, x + pos.x_offset, asc - pos.y_offset)))
        x += pos.x_advance
    out[w] = {'d': pen.getCommands(), 'w': x}

SCALA = 0.74   # come il size-adjust di TAN Nimbus nel CSS: la x alta come quella di Cabinet
meta = {'upm': upm, 'h': asc - desc, 'desc': desc, 'scala': SCALA}
js = ('// Generato da _strumenti/parole-vettoriali.py: non modificare a mano.\n'
      'window.LMM_PAROLE = ' + json.dumps({'meta': meta, 'parole': out}, ensure_ascii=False, separators=(',', ':')) + ';\n')
open(USCITA, 'w', encoding='utf-8').write(js)
print(len(out), 'parole in', os.path.relpath(USCITA, RADICE), '(', round(len(js) / 1024, 1), 'KB )')
