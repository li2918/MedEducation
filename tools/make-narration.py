"""Pre-record the narration with a natural neural voice (Microsoft Edge TTS).

Browser speech voices differ by device and often sound robotic, and a downloaded video cannot
capture them. This script turns each caption into an MP3 that the player plays instead.

Usage (needs Python 3.9+ and internet):
    pip install edge-tts imageio-ffmpeg
    python tools/make-narration.py                    # every patient condition, English
    python tools/make-narration.py htn t2d            # only these condition ids
    python tools/make-narration.py --lang zh          # Chinese, from js/i18n-zh.js
    python tools/make-narration.py --pharm            # every medication class (provider portal)
    python tools/make-narration.py --pharm glp1-ra    # only these classes
    python tools/make-narration.py --durations        # only rewrite js/audio-durations.js

Patient videos: writes audio/<id>/<n>.mp3 (or audio/<id>-a/, -b/ for multi-part videos), one
file per scene, from the patient captions in js/diseases/*.js. Other languages go to
audio/<id>-a-zh/ and so on, reading each caption's translation from js/i18n-<lang>.js.

Medication classes (--pharm): writes audio/pharm/<class-id>/<n>.mp3 from what each scene
actually says (its `say` text, or its caption). Those texts come from the running page, so this
mode opens a headless Edge or Chrome (set MEDMOTION_BROWSER to its path if it is not found).
Pharmacology clips are loudness-normalised (about -16 LUFS) with ffmpeg; the imageio-ffmpeg
package brings its own copy, or put ffmpeg on the PATH.

Afterwards js/audio-durations.js lists every clip's length (the player fits each scene to its
clip) and, for pharmacology clips, a fingerprint of the words it was made from. If a caption
changes and the clips are not re-recorded, the player sees the mismatch and uses the browser
voice for that class instead of playing the wrong words. Re-run after changing a caption.
"""
import asyncio
import json
import os
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile

import edge_tts

VOICES = {
    'en': 'en-US-AvaMultilingualNeural',  # warm, conversational; also try en-US-EmmaMultilingualNeural
    'zh': 'zh-CN-XiaoxiaoNeural',         # warm, clear Mandarin
}
RATE = '-5%'  # a touch slower than default for young listeners
ROOT = pathlib.Path(__file__).resolve().parent.parent
LOUDNESS = 'loudnorm=I=-16:TP=-1.5:LRA=11'
PHARM_BITRATE = '64k'  # Edge TTS sends 24 kHz / 48 kbps speech; 64 kbps keeps it after normalising


def videos(src):
    """(suffix, captions) for each patient video. `const patientScenes = [` is a single video;
    `const patientScenesA = [`, `patientScenesB`, ... are parts, saved as <id>-a, <id>-b, ..."""
    for m in re.finditer(r'const patientScenes(\w*) = \[(.*?)\n  \];', src, re.S):
        found = re.finditer(r"caption: (['\"])(.*?)(?<!\\)\1,", m.group(2))
        caps = [c.group(2).replace("\\'", "'").replace('\\"', '"') for c in found]
        yield ('-' + m.group(1).lower() if m.group(1) else ''), caps


def translations(lang):
    """The {english: translation} object inside js/i18n-<lang>.js (written as strict JSON)."""
    src = (ROOT / 'js' / f'i18n-{lang}.js').read_text(encoding='utf-8')
    return json.loads(src[src.index('{', src.index('I18N.add')):src.rindex('}') + 1])


def text_tag(s):
    """Same short hash as textTag() in js/engine.js (djb2-xor over UTF-16 code units, base 36)."""
    h = 5381
    data = s.encode('utf-16-le')
    for i in range(0, len(data), 2):
        h = (((h * 33) & 0xFFFFFFFF) ^ (data[i] | data[i + 1] << 8)) & 0xFFFFFFFF
    digits = '0123456789abcdefghijklmnopqrstuvwxyz'
    out = ''
    while True:
        h, r = divmod(h, 36)
        out = digits[r] + out
        if not h:
            return out


async def record(text, path, voice, tries=4):
    """The free TTS service sometimes returns no audio; wait and retry."""
    for attempt in range(1, tries + 1):
        try:
            await edge_tts.Communicate(text, voice, rate=RATE).save(str(path))
            return
        except edge_tts.exceptions.NoAudioReceived:
            if attempt == tries:
                raise
            await asyncio.sleep(2 * attempt)


def ffmpeg_exe():
    exe = shutil.which('ffmpeg')
    if exe:
        return exe
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        return None


def normalise(path, ffmpeg):
    """Even out loudness so every clip plays at the same level."""
    tmp = path.with_suffix('.tmp.mp3')
    subprocess.run([ffmpeg, '-v', 'error', '-y', '-i', str(path), '-af', LOUDNESS, '-ar', '24000', '-ac', '1',
                    '-codec:a', 'libmp3lame', '-b:a', PHARM_BITRATE, str(tmp)], check=True)
    tmp.replace(path)


# MPEG audio frame header tables (bitrates in kbps), for reading clip lengths without extra tools.
_BITRATES = {
    1: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],  # MPEG-1 Layer III
    2: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],      # MPEG-2/2.5 Layer III
}


def mp3_seconds(path):
    """Length of a constant-bitrate MP3: audio bytes / bitrate from its first frame header."""
    data = path.read_bytes()
    start = 0
    if data[:3] == b'ID3':
        start = 10 + ((data[6] & 0x7F) << 21 | (data[7] & 0x7F) << 14 | (data[8] & 0x7F) << 7 | (data[9] & 0x7F))
    for i in range(start, len(data) - 4):
        if data[i] == 0xFF and data[i + 1] & 0xE0 == 0xE0:
            version = (data[i + 1] >> 3) & 3          # 3 = MPEG-1, 2 = MPEG-2, 0 = MPEG-2.5
            kbps = _BITRATES[1 if version == 3 else 2][data[i + 2] >> 4]
            if kbps:
                return (len(data) - i) * 8 / (kbps * 1000)
    return 0.0


def write_durations(says=None):
    """Rewrite js/audio-durations.js: every clip's length, and the pharmacology word fingerprints
    (kept from the previous file for classes not re-recorded this time)."""
    path = ROOT / 'js' / 'audio-durations.js'
    old = {}
    if path.exists():
        m = re.search(r'window\.AUDIO_SAY = (\{.*?\});', path.read_text(encoding='utf-8'), re.S)
        if m:
            old = json.loads(re.sub(r',\s*\}', '}', m.group(1)))
    tags = {k: v for k, v in {**old, **(says or {})}.items() if (ROOT / k).exists()}
    durs = {p.relative_to(ROOT).as_posix(): round(mp3_seconds(p), 2) for p in sorted((ROOT / 'audio').rglob('*.mp3'))}
    body = ',\n'.join(f'  {json.dumps(k)}: {v}' for k, v in durs.items())
    tag_body = ',\n'.join(f'  {json.dumps(k)}: {json.dumps(v)}' for k, v in sorted(tags.items()))
    path.write_text(
        '// Recorded clip lengths in seconds, written by tools/make-narration.py.\n'
        f'window.AUDIO_DUR = {{\n{body},\n}};\n'
        '// Fingerprint of the words each pharmacology clip was recorded from (see textTag in engine.js).\n'
        f'window.AUDIO_SAY = {{\n{tag_body}\n}};\n', encoding='utf-8')


def find_browser():
    env = os.environ.get('MEDMOTION_BROWSER')
    if env:
        return env
    for name in ('msedge', 'microsoft-edge', 'google-chrome', 'chromium', 'chromium-browser', 'chrome'):
        exe = shutil.which(name)
        if exe:
            return exe
    for p in (r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe', r'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
              r'C:\Program Files\Google\Chrome\Application\chrome.exe',
              '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'):
        if os.path.exists(p):
            return p
    sys.exit('No Edge or Chrome found for --pharm; set MEDMOTION_BROWSER to its path.')


def pharm_texts():
    """{class id: [spoken text per scene]}, read from the scripts clinician.html loads."""
    html = (ROOT / 'clinician.html').read_text(encoding='utf-8')
    srcs = [s.split('?')[0] for s in re.findall(r'<script[^>]*src="([^"]+)"', html) if 'clinician.js' not in s]
    tags = ''.join(f'<script src="{(ROOT / s).as_uri()}"></script>' for s in srcs)
    page = ('<!doctype html><meta charset="utf-8"><body><pre id="out">running</pre>' + tags +
            "<script>const out = {}; Object.values(MedLib.classes).forEach((cls) => {"
            " try { out[cls.id] = MedAnim.scenesFor(cls).map((sc) => sc.say || sc.caption || ''); }"
            " catch (e) { out[cls.id] = 'error: ' + e; } });"
            " document.getElementById('out').textContent = JSON.stringify(out);</script>")
    with tempfile.TemporaryDirectory() as tmp:
        f = pathlib.Path(tmp) / 'export.html'
        f.write_text(page, encoding='utf-8')
        res = subprocess.run([find_browser(), '--headless=new', '--disable-gpu', '--allow-file-access-from-files',
                              f'--user-data-dir={pathlib.Path(tmp) / "profile"}', '--virtual-time-budget=20000',
                              '--dump-dom', f.as_uri()], capture_output=True, text=True, encoding='utf-8', timeout=180)
    m = re.search(r'<pre id="out">(.*?)</pre>', res.stdout, re.S)
    if not m or m.group(1) == 'running':
        sys.exit('Could not read the scene texts from the browser.')
    import html as html_mod
    return json.loads(html_mod.unescape(m.group(1)))


async def main_pharm(only):
    texts = pharm_texts()
    ffmpeg = ffmpeg_exe()
    if not ffmpeg:
        print('  ffmpeg not found (pip install imageio-ffmpeg): clips are saved without loudness normalising')
    says = {}
    for cid, lines in sorted(texts.items()):
        if only and cid not in only:
            continue
        if isinstance(lines, str):
            print(f'  skipped {cid}: {lines}')
            continue
        out = ROOT / 'audio' / 'pharm' / cid
        if out.exists():
            shutil.rmtree(out)  # a class can lose scenes; never leave old extra clips behind
        out.mkdir(parents=True)
        for i, text in enumerate(lines, 1):
            spoken = re.sub(r'[↑↓]', '', text).strip()
            if not spoken:
                continue
            path = out / f'{i}.mp3'
            await record(spoken, path, VOICES['en'])
            if ffmpeg:
                normalise(path, ffmpeg)
            says[path.relative_to(ROOT).as_posix()] = text_tag(text)
            print(f'pharm/{cid}/{i}.mp3  {spoken}')
    write_durations(says)


async def main(only, lang):
    dic = translations(lang) if lang != 'en' else None
    for path in sorted((ROOT / 'js' / 'diseases').glob('*.js')):
        src = path.read_text(encoding='utf-8')
        m = re.search(r"MedData\.register\(\{\s*id: '([^']+)'", src)
        if not m or (only and m.group(1) not in only):
            continue
        for suffix, caps in videos(src):
            name = m.group(1) + suffix + ('' if lang == 'en' else f'-{lang}')
            out = ROOT / 'audio' / name
            out.mkdir(parents=True, exist_ok=True)
            for i, text in enumerate(caps, 1):
                if dic is not None:
                    if text not in dic:
                        print(f'  missing {lang} translation: {name}/{i}: {text[:60]}')
                        continue
                    text = dic[text]
                await record(text, out / f'{i}.mp3', VOICES[lang])
                print(f'{name}/{i}.mp3  {text}')
    write_durations()


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')  # Chinese captions print on any console
    args = sys.argv[1:]
    lang = 'en'
    if '--lang' in args:
        k = args.index('--lang'); lang = args[k + 1]; del args[k:k + 2]
    if '--durations' in args:
        write_durations()
    elif '--pharm' in args:
        args.remove('--pharm')
        asyncio.run(main_pharm(set(args)))
    else:
        asyncio.run(main(set(args), lang))
