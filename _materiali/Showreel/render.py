import sys, base64, subprocess, os
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
URL = 'file://' + os.path.join(HERE, 'index.html')
mode = sys.argv[1]

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--disable-gpu', '--font-render-hinting=none'])
    pg = b.new_page(viewport={'width': 1920, 'height': 1080}, device_scale_factor=1)
    pg.goto(URL)
    pg.evaluate("document.fonts.ready")
    pg.wait_for_timeout(300)

    def shot(t, **kw):
        pg.evaluate(f"window.seek({t})")
        return pg.screenshot(type='jpeg', quality=92, **kw)

    if mode == 'stills':
        out = os.path.join(HERE, 'stills'); os.makedirs(out, exist_ok=True)
        times = [float(x) for x in sys.argv[2].split(',')]
        for t in times:
            with open(os.path.join(out, f't{t:05.2f}.jpg'), 'wb') as f:
                f.write(shot(t))
    elif mode == 'audio':
        data = pg.evaluate("window.renderAudio()")
        with open(os.path.join(HERE, 'audio.wav'), 'wb') as f:
            f.write(base64.b64decode(data))
    elif mode == 'video':
        tmp = os.path.join(HERE, 'video_tmp.mp4')
        ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '180', '-c:v', 'mjpeg', '-i', '-',
                               '-vf', "tmix=frames=3:weights='1 1 1',select='eq(mod(n\\,3)\\,2)',setpts=N/(60*TB)",
                               '-r', '60', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '16', '-pix_fmt', 'yuv420p', tmp],
                              stdin=subprocess.PIPE)
        N = 600 * 3
        for n in range(N):
            t = ((n - 1) / 180.0) % 10.0   # subframes centred on each 60fps frame
            ff.stdin.write(shot(t))
            if n % 180 == 0: print('subframe', n, flush=True)
        ff.stdin.close()
        rc = ff.wait()
        if rc == 0:
            os.replace(tmp, os.path.join(HERE, 'video.mp4'))
        print('ffmpeg rc', rc)
    b.close()
