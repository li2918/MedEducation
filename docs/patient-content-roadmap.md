# Patient portal content roadmap

The patient portal is organised as **patient population → medical category → diagnosis**
(`js/catalog.js`). Every diagnosis is a population-specific topic. A topic plays an
animation only when content made and reviewed **for that population** exists. Until then it
is listed and searchable as *Coming soon*. Adult animations are never relabelled as
pediatric or pregnancy content.

Status is tracked on two separate axes:

| Field | Values | Meaning |
|---|---|---|
| `contentStatus` | `available`, `coming-soon` | Whether an animation exists for this population |
| `clinicalReviewStatus` | `pending`, `reviewed` | Whether a clinician has signed off. *Available* never implies *reviewed*. |

To publish a module, register its content in `MedData` (`js/diseases/<file>.js`). Then set
`contentId` on the catalog topic. Content status follows automatically.

## What may be shared, and what must be new

**Shared:** the animation engine, anatomy drawings, physiological primitives (glucose,
insulin, vessels, organs), the player, and the page layout.

**Written and reviewed per population:**
- mechanism narration
- clinical explanation and diagnostic criteria
- warning signs and emergency box
- treatment information
- the example patient
- questions for the care team (caregiver or teen voice for pediatrics)
- quiz and related topics

## Current state

| Population | Topics | With animation |
|---|---|---|
| Adults | 31 | 11 modules (13 topics: sciatica and neuropathy open existing modules) |
| Pediatrics | 27 | 0 |
| Pregnancy & Postpartum | 33 | 0 |

All available modules are marked *Draft · pending clinical review*.

## Proposed order for new modules

Priority reflects how common the condition is, the safety stakes, and what the existing
engine can show well. Each line notes what must differ from the adult module of the same
concept.

### Pregnancy & Postpartum (first)

1. **Preeclampsia**: an abnormal placenta releases factors that injure blood vessel
   linings, leading to high blood pressure and organ effects (kidney, liver, brain), plus
   the warning signs. Also covers postpartum preeclampsia. *Not* "ordinary hypertension
   in pregnancy".
2. **Gestational diabetes**: placental hormones → more insulin resistance → greater
   insulin demand → high blood sugar when the pancreas cannot keep up. Covers screening,
   effects on the baby, and checking after birth. *Not* the adult type 2 story.
3. **Pregnancy warning signs**: urgent maternal signs during pregnancy and after birth,
   with when to call. Needs maternity clinical review before release.
4. **Gestational and chronic hypertension in pregnancy**: definitions by timing
   (before or after 20 weeks), monitoring, and how each relates to preeclampsia.
5. **Preexisting type 1 and type 2 diabetes in pregnancy**: planning before pregnancy,
   changing insulin needs by trimester, and low-blood-sugar risk.
6. **How the placenta works** and **how pregnancy changes insulin sensitivity**: these
   physiology modules are reused as background inside items 1 and 2.
7. **Postpartum depression and anxiety**: listed under Postpartum Recovery, with crisis
   guidance. There is no separate mental-health portal.
8. **Thyroid & Hormone Conditions** (category added; all *Coming soon*):
   - *How pregnancy changes thyroid tests*: normal pregnancy changes (for example a lower
     TSH in early pregnancy, pregnancy-specific ranges), kept clearly apart from disease.
   - *Hypothyroidism in pregnancy*: hypothyroidism present before pregnancy, Hashimoto's
     thyroiditis, and the higher thyroid hormone need during pregnancy.
   - *Hyperthyroidism in pregnancy*: Graves' disease, effects of excess thyroid hormone,
     and pregnancy-specific monitoring.
   - *Gestational transient thyrotoxicosis*: hCG briefly stimulating the thyroid in early
     pregnancy, and how it is told apart from Graves' disease.
   - *Postpartum thyroiditis*: inflammation after birth with a possible high phase, a
     possible low phase, or only one of them.
   - Future: *thyroid nodules during pregnancy*; *thyroid function and the baby's
     development*.

   Animation plan for each: the mother's thyroid gland → making thyroid hormone →
   what pregnancy changes (hCG, higher needs, test ranges) → effects on the mother →
   the baby's development as context → why monitoring may be needed. Patient-friendly
   cartoons; never the adult hypothyroidism or hyperthyroidism modules relabelled.
   Clinical content must be reviewed against the current (2026) American Thyroid
   Association guidance for thyroid disease in pregnancy and postpartum before release.
   Search: broad test words ("low TSH pregnancy", "high TSH pregnancy") deliberately list
   several thyroid topics, including the normal-changes topic, rather than pointing to one
   diagnosis.

### Pediatrics

1. **Type 1 diabetes in children**: autoimmune loss of beta cells and insulin from the
   start. Covers warning signs of DKA, the caregiver's role, and school. *Not* the adult
   type 2 story.
2. **Asthma in children**: triggers, spacer and mask technique, action plan, school.
   Parent and child voices.
3. **Bronchiolitis**: infant airways, signs of breathing distress, feeding and hydration.
4. **High blood pressure in children**: percentile-based diagnosis for age, sex, and
   height, and more frequent secondary causes in young children.
5. **Type 2 diabetes in children and teens**: teen-focused, with the faster course than
   in adults.
6. **Common childhood illnesses** (ear infection, strep throat, influenza, gastroenteritis,
   hand-foot-and-mouth): short modules on when to see a doctor and hydration.
7. **Growth and development** topics: these need a developmental-pediatrics review and
   a careful tone for families.

### Adults (remaining)

Heart failure, atrial fibrillation, coronary artery disease, stroke, chronic kidney
disease, and type 1 diabetes in adults come first. They can reuse the existing heart,
kidney, and diabetes engines.

## Release checklist for a new population module

- [ ] Population-specific script reviewed by a clinician in that field
- [ ] Animation uses that population's physiology and an example patient of the right age or stage
- [ ] Warning signs and emergency box written for that population
- [ ] Questions, quiz, and related topics written for that audience
- [ ] English and Chinese text added
- [ ] `contentId` set in `js/catalog.js`; `clinicalReviewStatus` updated only after sign-off
- [ ] `qa-pop` acceptance checks and patient playback QA pass
