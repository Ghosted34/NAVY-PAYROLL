# Review Notes — 2026 Emolument Process Guide

**Fourth pass.** Role names settled and the guide updated in place.

## Role names — now consistent across both documents

| Abbrev | Full name | Scope |
|---|---|---|
| DO | **Duty Officer** | Ship |
| FO | **Finance Officer** | Ship |
| CPO | **Central Pay Officer** | Command |
| EMOL ADMIN | Emolument Administrator | Global |

The six video scripts previously said "Flag Officer" and now say **Finance
Officer** throughout. `03-flag-officer-FO.md` was renamed to
`03-finance-officer-FO.md`.

---

## Changes applied to the .docx

| # | Change | Where |
|---|---|---|
| 1 | "Financial Officer" → "Finance Officer" | Step 6 header, para 59 |
| 2 | "Central Pay Office" → "Central Pay Officer" *(the role only)* | Overview para 10, §1.1 roles table |
| 3 | Password `mypassword123` → `••••••••` | Step 1 table |
| 4 | `FO_APPROVAL` → `FO_APPROVED` | Step 7 table |
| 5 | "CPO Comfirmed" → "CPO Confirmed" | Step 7 outcome table |
| 6 | "DO Approved" → "DO Reviewed" (×2, matches the `DO_REVIEWED` enum) | Steps 5 and 6 outcome tables |
| 7 | Deleted the "screenshot placeholders … once available" sentence | Para 11 |
| 8 | "CPO Selects **Ship**" → "CPO Selects **Command**" | Step 7 header |
| 9 | Rewrote the CPO opening to describe command scope | Para 68 |
| 10 | Fig 7.1 caption: "ship statictics" → "command selection" | Step 7 figures |

Left alone as instructed: **NAVAL HEADQUATERS**, and **Central Pay Office** as
the officer's ship / unit / establishment.

New para 68 text:

> The Central Pay Officer, also with a special tab, logs in and selects their
> command. Unlike the DO and FO, who work one ship at a time, the CPO sees every
> ship under the command in a single queue and may filter by ship or by payroll
> class. From there the CPO opens the Stats page, goes to Pending, and validates
> or rejects the first record — the same process followed by the DO and FO.

Validated against the original (299 paragraphs in, 299 out, XSD clean) and
rendered to PDF to confirm nothing shifted. All 28 screenshots intact.

---

## The one thing still outstanding: "Remarks (optional)"

This is a build issue, not a document one, but it will end up in the guide's
screenshots and in the explainer videos, so it is worth fixing first.

**What happens.** On the DO, FO and CPO Pending screens, the action modal has a
free-text box labelled **"Remarks (optional)"** and two buttons — approve and
reject. Approving with the box empty works fine. Rejecting with the box empty
does not: the server returns HTTP 400 and the approver sees an error telling
them a reason is required, immediately after the label told them it wasn't.

**Why it is that way.** The label and the rule live in different files and were
written to different assumptions:

| Layer | File | Behaviour |
|---|---|---|
| UI label | `public/ship-sections/do/pending.html:40` | "Remarks (optional)" |
| | `public/ship-sections/fo/pending.html:40` | "Remarks (optional)" |
| | `public/ship-sections/cpo/pending.html:42` | "Remarks (optional)" |
| Server | `do.service.js:196` | rejects empty remarks — "Rejection reason (remarks) is required." |
| | `fo.service.js:397` | same |
| | `cpo.service.js:226` | same |
| | `admin.service.js:427` | "remarks is required." |

The same box serves both buttons, so the label can only be right for one of
them. The server is correct to insist — a rejection clears the entire approval
trail and sends the officer back to a blank form, and they need to know why.
Approvals genuinely don't need a reason.

**Options, cheapest first:**

1. **Relabel** to "Remarks (required if rejecting)". One-word fix in three
   files, no logic change. Removes the surprise, though the field still reads
   as required when the officer is about to approve.
2. **Swap the label on click** — "Remarks (optional)" until Reject is pressed,
   then "Reason for rejection (required)", with client-side validation so the
   approver never reaches the server error. Better experience, maybe twenty
   lines across the three files.
3. **Split the modal** into separate approve and reject dialogs. Cleanest, most
   work, probably not worth it for this.

Option 2 is the one I'd pick, but option 1 is enough to unblock recording.

**Why it matters for your deliverables.** Fig 5.3, 6.3 and 7.3 in the guide all
show this dialog, and videos 2, 3 and 4 each demonstrate a rejection on camera.
If the label is fixed first, both sets of material are accurate. If not, three
videos will visibly contradict themselves, and re-recording is more expensive
than the fix. The scripts currently work around it by telling approvers a reason
is required whatever the label says — that line can come out once it's fixed.
