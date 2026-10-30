# MedMotion

A medical visualization platform that turns complex diseases, pathophysiology, and drug mechanisms into short, narrated animations: 30–60 s for patients, and modular organ-by-organ animations for clinicians.

This is a static prototype for the US market (English). It uses no build step and has no dependencies.

## Run it

Open `index.html` in Chrome or Edge. That's it.

- On the home page, choose **patient** or **healthcare provider**. There is no sign-in.
- Deep links: `patient.html#t2d`, `clinician.html#htn/pharm/raas`, `clinician.html#t2d/patho/kidney`.

Narration uses the browser's built-in text-to-speech (Web Speech API). On Windows, Edge offers the most natural voices.

## What's in it

| | Patient portal | Clinician portal |
|---|---|---|
| Animation | One ~60 s, 7-chapter story per condition | 1–3 scenes per organ and per drug class |
| Extras | Key points, questions for your doctor, 3-question teach-back quiz | Body map with stage slider, findings by stage, PD/PK/AE/contraindications/monitoring, references |
| Conditions | Type 2 diabetes, hypertension, high cholesterol, COPD, asthma, GERD, osteoarthritis, tendon pain, back pain, muscle pain (Parts 1-2) | T2D (8 organs + 4 drug classes), HTN (5 organs + 3 drug classes); the others are coming soon |

Search handles lay terms, abbreviations, ICD-10 codes, and typos (`diabetis`, `HTN`, `E11`, `high bp`). Roadmap conditions show up as "coming soon" with a request button.

## How it works

All animation is drawn programmatically on a 960×540 canvas. Nothing is pre-rendered video.

```
js/primitives.js   Drawing kit: cells, keys/locks, vessels, organs, glomerulus, fundus, neurons, gauges…
js/engine.js       Player: timeline, scrubbing, chapters, captions, TTS narration, fullscreen
js/scenes.js       Reusable scene templates (icon rows, red-flag card, body hotspots, pathways, tubule…)
js/registry.js     Condition registry + fuzzy search
js/diseases/*.js   Content: one file per condition (patient script + clinician organs/drugs)
js/lungs.js        Shared cartoon pieces for breathing conditions (airways, mucus, lungs)
js/bodymap.js      Clickable SVG body map
js/patient.js      Patient portal page logic
js/clinician.js    Clinician portal page logic
```

A scene is `{ label, caption, draw(ctx, p, s) }`. `p` is progress (0–1) through the scene and `s` is seconds elapsed. Scene length stretches automatically so the narration can finish. Randomness is seeded, so scrubbing always shows the same frame.

### Narration

Patient videos play pre-recorded MP3 narration from `audio/<id>/<n>.mp3` (one file per scene) in a natural neural voice. If the files are missing, the player falls back to the browser's speech voices, which differ by device and can sound robotic. To create or refresh the audio after editing captions:

```
pip install edge-tts
python tools/make-narration.py
```

**Deploying:** the HTML pages load scripts and styles with a `?v=` version (for example `js/engine.js?v=20261031a`). Change that version in `index.html`, `patient.html`, and `clinician.html` whenever you publish, so browsers never mix old scripts with new narration.

**Download video:** the `⬇ Video` button plays the video once in real time while recording it, then saves an MP4 (or WebM) with the narration and burned-in captions. Keep the tab visible while it records. The narration is only captured from the website (http/https), not from a page opened as a local file.

### Adding a condition

1. Create `js/diseases/<name>.js` and call `MedData.register({ id, name, icd10, aliases, patient, clinician })`. Use `diabetes.js` as the template. A condition with only `patient` (or only `clinician`) content shows as coming soon in the other portal.
2. Add a `<script>` tag for it to `patient.html` and `clinician.html`.
   To split the patient story into parts, give `patient.videos: [{ title, length, audio, scenes }, ...]` instead of `scenes` (see `diabetes.js`). Name the arrays `patientScenesA`, `patientScenesB`, ... so `tools/make-narration.py` writes `audio/<id>-a/`, `audio/<id>-b/`.
3. Remove it from the `comingSoon` list in `js/registry.js`.

## Important limitations

- **Content is AI-drafted and has not been clinically reviewed.** Every page shows a "Draft · pending clinical review" badge. A licensed clinician must review the content before any real use.
- There is no sign-in: anyone can open either portal. A production build would need real identity verification (for example, an NPPES NPI lookup) before granting provider access.
- This is for education only: no diagnosis and no individualized dosing.
