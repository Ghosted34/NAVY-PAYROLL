# E-Emolument Explainer Video Scripts

Six scripts, one per audience. Each is written to be fed into an AI voice tool
and laid over a screen recording of the matching portal.

| # | File | Audience | Runtime |
|---|------|----------|---------|
| 1 | `01-personnel-officer.md` | All personnel filling their own form | ~5:35 |
| 2 | `02-duty-officer-DO.md` | Duty Officers (DO) | ~3:05 |
| 3 | `03-finance-officer-FO.md` | Finance Officers (FO) | ~3:10 |
| 4 | `04-central-pay-officer-CPO.md` | Central Pay Officers (CPO) | ~3:00 |
| 5 | `05-emolument-admin-setup.md` | Admins — setting up a cycle | ~4:20 |
| 6 | `06-emolument-admin-cycle.md` | Admins — running the cycle | ~4:15 |

Total narration: ~24 minutes, ~3,480 words.

## How each script is laid out

Two columns:

- **NARRATION** — the exact words to be spoken. Feed this to the voice tool.
- **ON SCREEN** — what to record or show at that moment. Do not feed this to
  the voice tool.

Each file ends with a **NARRATION ONLY** block: the same words with no stage
directions, ready to paste straight into your voice tool in one go.

---

# Production

## What the visuals actually are

**This is a screen-recorded product demo, not a generated video.** Almost every
frame is a recording of the real portal. You do not need AI-generated images —
generating a picture of "an officer at a computer" would be worse than showing
the actual screen the viewer has to click.

What you need to produce:

| Asset | How many | How to make it |
|---|---|---|
| Screen recordings | 6 (one per script) | OBS Studio or ShareX — free. Record 1920x1080, follow the ON SCREEN column. |
| Title cards | 6 | Canva or PowerPoint. Navy crest, video title, plain navy background. |
| Closing cards | 6 | Same template, the closing line from each script. |
| Approval-chain diagram | 1, reused | The `DRAFT → SUBMITTED → …` chain below, drawn once and reused in videos 1 and 4. |
| Zoom/highlight callouts | throughout | Added in the editor, not pre-made. |

Everything above is layout work, not illustration. Build the cards once as a
template and swap the text.

## Recording the demo

- Use a **demo or staging database** with dummy personnel. Never record against
  live data — service numbers, NINs and bank account numbers appear on screen
  throughout.
- Use the **same dummy officer across all six videos** so the story connects:
  they fill in video 1, their DO authenticates in video 2, and so on.
- Move the mouse slowly and deliberately. Pause a beat after each click.
- Record silently, then lay the generated voice over it. Do not try to time
  your clicks to the audio while recording — match them in the editor.
- Record at 1920x1080 in a maximised window. The portals are responsive, so a
  smaller window will change the layout.

## Voice tools

At roughly 3,480 words — about 20,000 characters including spaces — the whole
set is small. Character quotas are not a constraint here; a single paid month
covers all six videos with room to re-record.

**ElevenLabs** is the strongest option for this and the one to start with. Its
paid tiers in 2026 run Starter at about $5/month, Creator at about $22/month
and Pro at about $99/month, with a free tier at 10,000 characters. Roughly
1,000 characters produces a minute of speech. Creator would cover this project
several times over; Starter would likely cover a single pass. Confirm current
pricing and, importantly, **commercial usage rights on the tier you pick** —
lower tiers have historically had restrictions, and this is official Service
material.

Alternatives worth knowing:

- **Microsoft Azure AI Speech** — the pragmatic choice for a government
  deployment. Pay-as-you-go per character, generous free tier, and it comes
  with the procurement, data-residency and compliance paperwork a Service
  organisation will ask for. Voice quality is a step below ElevenLabs but
  entirely acceptable for instructional narration.
- **Google Cloud Text-to-Speech** — same category as Azure. Good voices,
  pay-as-you-go, easy to script for batch generation.
- **Amazon Polly** — cheapest at volume, the most robotic of the four. Fine if
  budget is the binding constraint.
- **PlayHT / Murf** — subscription tools aimed at exactly this use case.
  Murf in particular has a built-in editor for syncing voice to screen
  recordings, which saves an editing step.

**Avatar tools (HeyGen, Synthesia)** are a different thing and probably wrong
here. A talking presenter competes with the screen for attention, and these
scripts are almost entirely "click this, then this". Consider an avatar only
for the opening 15 seconds of video 1 if someone wants a human face on it.

**Text-to-video tools (Sora, Runway, Veo)** are not applicable. They generate
imagined footage; you need the actual interface.

### Practical voice notes

- Pick **one voice and use it across all six videos.** Consistency matters
  more than which voice you pick.
- Choose a measured, formal delivery. Do not use an energetic marketing voice.
- **Say the tricky words out loud before you commit.** Ship names, "emolument"
  itself, and rank abbreviations are where TTS most often stumbles. Most tools
  let you correct pronunciation with a custom dictionary or phonetic spelling.
- Generate each script as **one block**, not scene by scene — the tool keeps
  its pacing consistent across a single generation.
- Listen to the whole file before editing. Regenerating is cheap; re-editing
  around a bad take is not.

## Suggested workflow

1. Record all six screen demos first, silently.
2. Generate all six voice tracks in one sitting, same voice, same settings.
3. Edit: lay voice over recording, trim the recording to fit the narration
   (not the other way round), add title and closing cards.
4. Add zoom and highlight callouts where the ON SCREEN column asks for them.
5. Review video 1 with two or three personnel who have never seen the system
   before you cut the remaining five.

---

## Tone

Formal but plain. Service-appropriate, no slang, short sentences, second
person ("you"). Written for viewers who are not confident with computers, so
every instruction names the exact button or menu item as it appears on screen.

## Conventions used

- Button and menu names are written **exactly** as they appear in the build,
  in bold.
- Approval stages are given in full the first time, then abbreviated.
- Numbers, ranks and service numbers shown on screen should be dummy data.

## The approval chain these scripts describe

```
DRAFT  →  SUBMITTED  →  DO_REVIEWED  →  FO_APPROVED  →  CPO_CONFIRMED  →  accepted by Admin
 (you)     (you)         (Duty Off)      (Fin Off)       (Central Pay)      (payroll update)
```

A rejection at **any** stage does not step the form back one place. It resets
the form to draft, clears the entire approval trail, and returns the officer to
a blank submission. The form must then pass the full chain again — DO, then FO,
then CPO — regardless of who rejected it. All six scripts say this explicitly.

A reason is **mandatory** on every rejection. The three Pending screens label
the field "Remarks (optional)", but the server returns an error if it is empty.
See `REVIEW-NOTES-process-guide.md`.
