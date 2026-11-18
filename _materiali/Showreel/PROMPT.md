# Showreel — prompt originale e come modificarlo

## Il prompt originale

```
<direction>
A 10-second motion design showreel that proves you are a world-class motion designer, built around who you are as Opus 5.5. Pick one visual concept from it and commit to it: name it in one line before you start. Every shot is made out of the previous one: shapes, type and color transform into the next scene instead of cutting or fading.
One typeface, a palette of at most three colors plus black and white, one consistent camera language.
No frames, corner labels or timecodes: they're the giveaway of AI-made motion.
Show range: kinetic type, shape morphing, a 2D-to-3D moment, a data or UI moment, and an end title. Give each one an equal share of the time.
Banned: particle bursts, glows, lens flares, camera shake, RGB split, crossfades, generic gradients, bouncy easing, holds longer than half a second, anything that looks like a template.
</direction>

<structure>
120 BPM, something happens on every beat.
First bar: hook. Then one technique per bar, each flowing out of the last. Last full bar: the strongest moment. Final half bar: end title, and the final frame matches the first so it loops.
</structure>

<build>
1. One HTML file at 1920x1080. Every style is computed from time inside window.seek(t): no CSS animations, no timers, no state carried between frames.
2. Use spring and exponential easing written as functions of time. Blur follows speed and direction on fast moves.
3. Write a soundtrack in code with the Web Audio API (OfflineAudioContext): a kick on every beat, a riser into the last full bar, a hit on each scene change. Render it to WAV.
4. Render with Playwright at 60fps, 3 subframes per frame blended with ffmpeg tmix for motion blur, then mux the audio.
5. Before the full render, render one frame per beat and look at them. Fix anything cluttered, off the beat, overlapping or hard to read.
</build>

<start>
Tell me the concept and show a beat-by-beat storyboard, then build it without asking me anything else. Give me the final MP4.
</start>
```

## Cosa c'è in questa cartella

- `index.html`: tutta l'animazione e la musica, in un solo file. Aprilo nel browser per vederla; in console puoi scrivere `seek(3.2)` per andare a un istante preciso.
- `render.py`: lo script che trasforma l'animazione in video (servono Python, Playwright e ffmpeg).
- `opus55_showreel.mp4`: il video finito.

## Come modificarlo in VS Code con Claude Code

Apri questa cartella in VS Code e chiedi a Claude Code, per esempio:

- «Nel file index.html sostituisci "Opus 5.5" con "LIKEMOMMADEME" e "motion, reasoned." con il mio ruolo.»
- «Cambia i colori: arancione → [colore], cobalto → [colore]. I colori sono nell'oggetto C in cima allo script.»
- «Trasforma questa animazione in un header del sito che si adatta alla larghezza dello schermo.»

Per rigenerare il video dopo le modifiche:

```
python3 render.py audio
python3 render.py video
ffmpeg -i video.mp4 -i audio.wav -map 0:v -map 1:a -c:v copy -c:a aac -shortest showreel.mp4
```

(`render.py` usa Google Chrome in `/usr/bin/google-chrome`: su Mac va cambiato il percorso, oppure chiedi a Claude Code di adattarlo.)

## Per una versione nuova da zero

Incolla il prompt originale in Claude e cambia la prima riga, per esempio:
«…built around who you are as LIKEMOMMADEME, Marketing & Creative Designer…».
Il risultato sarà diverso ogni volta: il prompt lascia libero il concept.
