"""Pre-record the patient narration with a natural neural voice (Microsoft Edge TTS).

Browser speech voices differ by device and often sound robotic. This script turns each
patient-video caption into an MP3 that the player plays instead.

Usage (needs Python 3.9+ and internet):
    pip install edge-tts
    python tools/make-narration.py                    # every condition, English
    python tools/make-narration.py htn t2d            # only these condition ids
    python tools/make-narration.py --lang zh          # Chinese, from js/i18n-zh.js
    python tools/make-narration.py --durations        # only rewrite js/audio-durations.js

Writes audio/<id>/<n>.mp3 (or audio/<id>-a/, -b/ for multi-part videos), one file per scene,
from the patient captions in js/diseases/*.js. Other languages go to audio/<id>-a-zh/ and so on,
reading each caption's translation from js/i18n-<lang>.js. Afterwards js/audio-durations.js
lists every clip's length, which the player uses to keep translated narration in step with
the animation. Re-run after changing a caption so the audio matches the text again.
"""
import asyncio
import json
import pathlib
import re
import sys

import edge_tts

VOICES = {
    'en': 'en-US-AvaMultilingualNeural',  # warm, conversational; also try en-US-EmmaMultilingualNeural
    'zh': 'zh-CN-XiaoxiaoNeural',         # warm, clear Mandarin
}
RATE = '-5%'  # a touch slower than default for young listeners
ROOT = pathlib.Path(__file__).resolve().parent.parent
BYTES_PER_SEC = 6000  # Edge TTS writes 48 kbps MP3


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


def write_durations():
    durs = {f'audio/{p.parent.name}/{p.name}': round(p.stat().st_size / BYTES_PER_SEC, 2)
            for p in sorted((ROOT / 'audio').glob('*/*.mp3'))}
    body = ',\n'.join(f'  {json.dumps(k)}: {v}' for k, v in durs.items())
    (ROOT / 'js' / 'audio-durations.js').write_text(
        '// Recorded clip lengths in seconds, written by tools/make-narration.py.\n'
        f'window.AUDIO_DUR = {{\n{body},\n}};\n', encoding='utf-8')


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
    else:
        asyncio.run(main(set(args), lang))
