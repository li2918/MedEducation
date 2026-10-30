"""Pre-record the patient narration with a natural neural voice (Microsoft Edge TTS).

Browser speech voices differ by device and often sound robotic. This script turns each
patient-video caption into an MP3 that the player plays instead.

Usage (needs Python 3.9+ and internet):
    pip install edge-tts
    python tools/make-narration.py            # every condition
    python tools/make-narration.py htn t2d    # only these condition ids

Writes audio/<id>/<n>.mp3 (or audio/<id>-a/, -b/ for multi-part videos), one file per scene,
from the patient captions in js/diseases/*.js.
Re-run after changing a caption so the audio matches the text again.
"""
import asyncio
import pathlib
import re
import sys

import edge_tts

VOICE = 'en-US-AvaMultilingualNeural'  # warm, conversational; also try en-US-EmmaMultilingualNeural
RATE = '-5%'                            # a touch slower than default for young listeners
ROOT = pathlib.Path(__file__).resolve().parent.parent


def videos(src):
    """(suffix, captions) for each patient video. `const patientScenes = [` is a single video;
    `const patientScenesA = [`, `patientScenesB`, ... are parts, saved as <id>-a, <id>-b, ..."""
    for m in re.finditer(r'const patientScenes(\w*) = \[(.*?)\n  \];', src, re.S):
        found = re.finditer(r"caption: (['\"])(.*?)(?<!\\)\1,", m.group(2))
        caps = [c.group(2).replace("\\'", "'").replace('\\"', '"') for c in found]
        yield ('-' + m.group(1).lower() if m.group(1) else ''), caps


async def record(text, path, tries=4):
    """The free TTS service sometimes returns no audio; wait and retry."""
    for attempt in range(1, tries + 1):
        try:
            await edge_tts.Communicate(text, VOICE, rate=RATE).save(str(path))
            return
        except edge_tts.exceptions.NoAudioReceived:
            if attempt == tries:
                raise
            await asyncio.sleep(2 * attempt)


async def main(only):
    for path in sorted((ROOT / 'js' / 'diseases').glob('*.js')):
        src = path.read_text(encoding='utf-8')
        m = re.search(r"MedData\.register\(\{\s*id: '([^']+)'", src)
        if not m or (only and m.group(1) not in only):
            continue
        for suffix, caps in videos(src):
            name = m.group(1) + suffix
            out = ROOT / 'audio' / name
            out.mkdir(parents=True, exist_ok=True)
            for i, text in enumerate(caps, 1):
                await record(text, out / f'{i}.mp3')
                print(f'{name}/{i}.mp3  {text}')


if __name__ == '__main__':
    asyncio.run(main(set(sys.argv[1:])))
