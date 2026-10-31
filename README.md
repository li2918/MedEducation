# MedMotion

A medical visualization platform that turns complex diseases, pathophysiology, and drug mechanisms into short, narrated animations: 30–60 s for patients, and modular organ-by-organ animations for clinicians.

This is a static prototype for the US market (English). It uses no build step and has no dependencies.

## Run it

Open `index.html` in Chrome or Edge. That's it.

- On the home page, choose **patient** or **healthcare provider**. There is no sign-in.
- Deep links: `patient.html#t2d`, `clinician.html#pharm/ace-inhibitors`, `clinician.html#t2d/patho/kidney`, `share.html#statins`. Older drug links such as `clinician.html#htn/pharm/raas` still open the matching class.

Narration uses the browser's built-in text-to-speech (Web Speech API). On Windows, Edge offers the most natural voices.

## What's in it

| | Patient portal | Clinician portal |
|---|---|---|
| Animation | One ~60 s, 7-chapter story per condition | 1–3 scenes per organ; a 30–60 s, 5-scene mechanism animation per medication class |
| Extras | Key points, questions for your doctor, 3-question teach-back quiz | Body map with stage slider, findings by stage; per class: mechanism, site of action, PD/PK, adverse effects, cautions, monitoring, indications by condition, references, review status, and a patient share link |
| Conditions | Type 2 diabetes, hypertension, high cholesterol, COPD, asthma, GERD, osteoarthritis, tendon pain, back pain, muscle pain, nerve pain (Parts 1-3) | Pathophysiology: T2D (8 organs), HTN (5 organs). Pharmacology: all 11 conditions, 53 medication classes from a shared library |

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
js/pharmacology/   Medication Mechanism Library (provider portal)
  library.js         Class / mechanism registry and condition mapping (MedLib)
  animations.js      Mechanism animation kit: 5 scenes per class from a config (MedAnim)
  stages.js          Custom stages: LDL receptors, triglyceride lipoproteins, parietal cell, synapse, RAAS…
  body.js            Whole-body scenes: the patient with the problem, body systems and zoom, whole-body result
  cinema.js          Hand-made cinematic stories for pilot classes (used instead of the generic builder)
  classes-*.js       Content: diabetes, hypertension, lipids, respiratory, GERD, MSK / neuropathic pain
share.html         Patient-friendly view of one medication class (share.html#<class id>)
```

A scene is `{ label, caption, draw(ctx, p, s) }`. `p` is progress (0–1) through the scene and `s` is seconds elapsed. Scene length stretches automatically so the narration can finish. Randomness is seeded, so scrubbing always shows the same frame.

### Medication Mechanism Library

Provider pharmacology is organized by medication class, not individual drug. A mechanism (one animation) is defined once and shared by every class that works that way (for example, short- and long-acting beta-2 agonists); combination inhalers reuse their components' mechanism scenes and then show the combined effect. `MedLib.map(conditionId, …)` lists the classes for each condition with a role (common / foundational, selected or add-on, specialist) and condition-specific notes, so a class used in several conditions keeps one shared description. Conditions without an organ-level module open in a pharmacology-only view. The patient share page shows only the plain-language captions and summary; it is a convenience view, not access control.

### Narration

Patient videos play pre-recorded MP3 narration from `audio/<id>/<n>.mp3` (one file per scene) in a natural neural voice. If the files are missing, the player falls back to the browser's speech voices, which differ by device and can sound robotic. To create or refresh the audio after editing captions:

```
pip install edge-tts
python tools/make-narration.py
```

**Deploying:** the HTML pages load scripts and styles with a `?v=` version (for example `js/engine.js?v=20261031s`). Change that version in `index.html`, `patient.html`, and `clinician.html` whenever you publish, so browsers never mix old scripts with new narration.

**Languages:** the patient portal has English and Chinese (language picker in the top bar, or `?lang=zh`). Text is translated by its English source string in `js/i18n-zh.js`; Chinese narration lives in `audio/<id>-a-zh/` and so on. After changing captions or labels, add their translations to `js/i18n-zh.js`, then run `python tools/make-narration.py --lang zh` (this also refreshes `js/audio-durations.js`, which keeps translated narration in step with the animation).

**Download video:** the `⬇ Video` button plays the video once in real time while recording it, then saves an MP4 (or WebM) with the narration and burned-in captions. Keep the tab visible while it records. The narration is only captured from the website (http/https), not from a page opened as a local file.

### Adding a condition

1. Create `js/diseases/<name>.js` and call `MedData.register({ id, name, icd10, aliases, patient, clinician })`. Use `diabetes.js` as the template. A condition with only `patient` (or only `clinician`) content shows as coming soon in the other portal.
2. Add a `<script>` tag for it to `patient.html` and `clinician.html`.
   To split the patient story into parts, give `patient.videos: [{ title, length, audio, scenes }, ...]` instead of `scenes` (see `diabetes.js`). Add `timing: 'audio'` to a part to fit each scene to its recorded English clip (clip length plus a 1.5 s finish, or the scene's own `dur` if a longer animation needs it) instead of stretching scenes to `length`; the musculoskeletal topics use this. An optional `patient.related: [{ id, why }]` lists related topics under the quiz. Name the arrays `patientScenesA`, `patientScenesB`, ... so `tools/make-narration.py` writes `audio/<id>-a/`, `audio/<id>-b/`.
3. Remove it from the `comingSoon` list in `js/registry.js`.

## Important limitations

- **Content is AI-drafted and has not been clinically reviewed.** Every page shows a "Draft · pending clinical review" badge. A licensed clinician must review the content before any real use.
- There is no sign-in: anyone can open either portal. A production build would need real identity verification (for example, an NPPES NPI lookup) before granting provider access.
- This is for education only: no diagnosis and no individualized dosing.
