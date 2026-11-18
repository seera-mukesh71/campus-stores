# Campus Stores

Campus Stores is a Product Engineer work sample set at a fictional campus media equipment desk. Work through a club’s screening, from equipment pickup to a partial return and the next morning’s handover. Open **Candidate brief** in the app for the assignment.

## My submission

### 1. Where to look

- `app.js`: all behaviour changes (data model, register, request page, return flow, issue form, desk book, robustness).
- `styles.css`: status badges, inline panels, in-form errors, and touch-target sizes.
- `index.html`: only the restart button is wrapped so it can show a confirm step. The Candidate brief is unchanged.
- `README.md`: this write-up.

Review the latest commit on `main`. I split the history into small `Step Na/Nb` commits, one idea each, so it can be read in order.

**How I checked it:** I drove the real `index.html` in Microsoft Edge with small Playwright scripts after every commit. The scripts covered the full Friday-to-Saturday shift, the corrupt and old saved data cases, two open tabs, and a 375 px phone width, and checked that there were no console errors. I kept those scripts outside the repo, so the submission stays plain HTML, CSS and JS with no dev dependencies.

### 2. One moment the product handles well

Issuing equipment against an approved request. During the Friday 3:45 pm pickup I tried to put the Sony A6400 camera on the Film Society request (RQ-214). The desk refused: *"This equipment type is outside the approved request."* I then tried to issue a second adapter (AD-15) after AD-12 was already out on the same request. That was refused too: *"The approved quantity of this equipment type is already on loan."* The unit in the workshop (PR-06) never appears as an option. The product won't let the counter hand out the wrong kit, and it says why in plain words. I kept these checks as the safety net under everything I added.

### 3. One moment I would change

Saturday, 9:00 am. On Friday at 7:30 pm Kabir returned the projector and speaker, and I closed both slips. He told me Leela had the adapter and would bring it at nine. The app had nowhere to record that, so all I could do was write a free-text note in the Desk book.

Next morning, taking over as the new attendant, the Loan register showed:

- `L-404 · AD-12` with `RQ-214 · Kabir Sen · Due Fri 8 pm`. The slip named Kabir, not Leela. It didn't say what AD-12 is or which bin it lives in, and nothing marked it as late, even though Fri 8 pm had passed thirteen hours earlier.
- Just below it, the Debate Union microphone with an identical **Record return** button.

Leela walks in holding "an adapter". To close the right slip I had to look up AD-12 in Inventory, find the hand-off in the Desk book, and trust that she was holding AD-12 and not AD-15 (same type, same bin C4). Then **Record return** closed the slip in one click, with no confirm and no undo. The whole job hangs on the paperwork, and the paperwork no longer matched who had the kit.

### 4. The change

The one idea: **follow the job (the Film Society’s kit), not the paperwork (individual slips).**

- **Fulfilment on the request page.** Each approved item shows *Not issued*, *Out (with whom, due when, which slip)* or *Returned (by whom, when)*. A summary sits on top: `2 of 3 returned · 1 overdue (USB-C → HDMI adapter, with Leela Das)`. The request list shows the same short status for each form.
- **Holder and promise on the slip.** **Update holder / promise** records that Leela has the adapter and promised it for Sat 9 am. The original collector (Kabir) stays on the slip. Rows now read in plain words: unit, model, bin, request, collector, current holder, due time, and a status badge (*Out*, *Due soon*, *Overdue*, *Returned*, *Returned late*). Every badge states the status in text, so colour is never the only signal.
- **Safe return.** **Record return** opens an inline panel showing the unit ID, model, bin and holder. It asks who brought it back and asks you to tick *"This is the unit in my hand (Belkin AVC002, bin C4)"*. **Undo return** is available for the rest of that shift.
- **Handover notes tied to items.** A Desk book note can be about a specific open slip. The note then also appears on that slip and on the request page, where the morning shift is already looking.
- **Smarter issue form.** Once you pick a request, the unit list shows only available units of approved types. The request's note ("USB-C-only laptop…") is shown, *Return by* defaults to the request's due time, and **Issue all remaining approved items** issues the whole kit in one action. Every refusal is shown inside the form as well as in the status bar.
- **Robustness.**
  - Focus returns to where you were after each update.
  - Buttons and selects are at least 44 px tall on small screens.
  - Restart needs a second click to confirm.
  - Two open tabs no longer overwrite each other's slips.
  - Inventory says who has a unit that is on loan.
  - Saved data is checked strictly, and older saves are migrated to the new format.

### 5. The same job with the change

- **Fri 3:45 pm, pickup.** On the Loan register: **New issue slip** → choose *RQ-214* → choose *Kabir Sen* → **Issue all remaining approved items**. That's 4 actions, or 5 counting opening the tab; issuing the kit used to take about 19 clicks and selects (three separate slips). Slips L-402 (PR-04), L-403 (SP-02) and L-404 (AD-12) are created, all due Fri 8 pm. The camera is never offered.
- **Fri 7:30 pm, partial return.** **Record return** on the projector, confirm the unit, close. The same for the speaker. On the adapter slip, **Update holder / promise** → *Leela Das*, *Sat 9 am*. The status bar reads *"Handed to Leela, promised Sat 9 am."*
- **Sat 9:00 am, morning shift.** The Requests list already shows the Film Society form with `2 of 3 returned · 1 overdue`. Opening it shows `2 of 3 returned · 1 overdue (USB-C → HDMI adapter, with Leela Das)`. On the register, L-404 reads `AD-12 · Belkin AVC002 · bin C4`, *Was due Fri 8 pm*, *With Leela Das · promised Sat 9 am*, **Overdue**. The microphone next to it says *Due soon*, so the two are no longer identical. **Record return** shows *Belkin AVC002, bin C4, now with Leela Das*. I tick the box and confirm, and the status reads *"AD-12 (Belkin AVC002) returned by Leela Das. Slip L-404 closed. Undo available."*

### 6. What I would keep

- **One slip per physical unit.** It's what makes a partial return possible: the projector and speaker can come back while the adapter stays open. I built on it rather than replacing it.
- **The issue-time checks against the approved request.** They still run on every issue, including **Issue all remaining**.
- **The overall layout:** four tabs, a status bar, and a shift banner that moves the story forward.

### 7. One observation at a real counter

At a real handover, I would time how long the incoming attendant takes to correctly name the open Film Society item: which unit, who has it, and whether it's late. I'd measure from sitting down to answering. I would also count wrong-slip closes, such as closing the microphone instead of the adapter, or AD-15 instead of AD-12. Comparing both numbers for a few handovers before and after the change would tell me whether it helped. If the time doesn't drop, or attendants still open the Desk book first, the change didn't work.

### 8. What I did not do / limits

- **Limited testing.** One tester (me), one browser (Microsoft Edge, driven with Playwright, plus manual checks), and no real desk staff or club members. The action counts and the "Done when" checks come from my own run-throughs, not from observing anyone else.
- **Product judgments.** "Holder", "promise" and "overdue" are my reading of the brief. The original app wasn't broken by its own spec; it just didn't model these things.
- **Overdue rule.** A slip is marked *Overdue* once it passes its *original* due time, even when a later promise (such as Leela's Sat 9 am) hasn't run out yet. The approved request said Fri 8 pm, and the club missed it. A verbal promise is useful information but shouldn't hide that fact from the next shift. So the promise is shown on its own line next to the badge rather than replacing it. Exactly on a due time counts as "due now", not late.
- **Not attempted:** real authentication, barcode scanning of units, notifications to clubs, quantities above one per item type, and a server, so all data stays in the browser's local storage.

---

## Run the app

Open `index.html` in a modern browser. The app includes its scripts, styles, and icons and can run offline.

To serve it over local HTTP, run this from the repository folder and visit `http://localhost:8000`.

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

On Windows, use `python` instead of `python3`.

Each browser stores its own sample shift locally when browser storage is available. **Restart sample shift** restores the fictional starting records.

## Source

- `index.html` contains the desk layout, candidate brief, and bundled icons.
- `app.js` contains the sample records and interactions.
- `styles.css` defines the desktop and mobile layouts.

Icon license notices are in [third-party/lucide-LICENSE.txt](third-party/lucide-LICENSE.txt).


## Submit your work

1. [Fork Campus Stores](https://github.com/virinchi-healthcare/campus-stores/fork) into your GitHub account. Complete the candidate brief and push your changes to your public fork. In your README, point reviewers to your work and explain the decision you made.
2. In your fork, open **Commits**, select the final commit you want reviewed, and copy the page URL. It should look like `https://github.com/YOUR-USERNAME/campus-stores/commit/COMMIT-SHA`.
3. [Submit your work through the Google Form](https://docs.google.com/forms/d/e/1FAIpQLScvzoh1R4WS-SkiwAVBQbMvniieJYSoOEfLMyVo5CyjOvYUgQ/viewform). Your **roll number**, **email ID**, and **final commit link from your public fork** are required. Enter your roll number and email ID in the form only.
