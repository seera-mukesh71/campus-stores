(() => {
  const storageKey = "campus-stores.shift.v2";
  const legacyKey = "campus-stores.shift.v1";
  const root = document.getElementById("campus-stores");
  const q = (selector) => root.querySelector(selector);
  const requests = [
    {
      id: "RQ-214",
      club: "Film Society",
      event: "Courtyard screening",
      owner: "Isha Rao",
      due: "Fri 8 pm",
      items: ["HDMI projector", "Portable speaker", "USB-C → HDMI adapter"],
      note: "Playback is from a USB-C-only laptop. The host will collect at 4 pm.",
    },
    {
      id: "RQ-209",
      club: "Debate Union",
      event: "Finals rehearsal",
      owner: "Tara Shah",
      due: "Sat 10 am",
      items: ["Wireless microphone"],
      note: "Rehearsal runs into the evening.",
    },
    {
      id: "RQ-217",
      club: "Photo Circle",
      event: "Street portrait walk",
      owner: "Dev Menon",
      due: "Sat noon",
      items: ["Digital camera"],
      note: "Collection on Saturday morning.",
    },
  ];
  const assets = [
    { id: "PR-04", type: "HDMI projector", model: "BenQ MH550", bin: "A2" },
    {
      id: "PR-06",
      type: "HDMI projector",
      model: "Epson EB-X49",
      bin: "Workshop",
      repair: true,
    },
    { id: "SP-02", type: "Portable speaker", model: "JBL Eon One", bin: "B1" },
    { id: "SP-05", type: "Portable speaker", model: "Bose S1", bin: "B2" },
    {
      id: "AD-12",
      type: "USB-C → HDMI adapter",
      model: "Belkin AVC002",
      bin: "C4",
    },
    {
      id: "AD-15",
      type: "USB-C → HDMI adapter",
      model: "Anker A8312",
      bin: "C4",
    },
    { id: "MI-09", type: "Wireless microphone", model: "Shure BLX", bin: "B3" },
    { id: "CA-03", type: "Digital camera", model: "Sony A6400", bin: "D2" },
  ];
  const people = [
    "Isha Rao",
    "Kabir Sen",
    "Leela Das",
    "Tara Shah",
    "Dev Menon",
  ];
  // Desk time is counted in minutes since Friday 00:00 so "late" can be computed.
  const shifts = [
    {
      time: "Friday · 3:45 pm",
      minutes: 945,
      title: "Pickup at the counter",
      text: "Kabir is here for the Film Society screening. The film starts at four. Can he leave with everything he needs?",
      next: "Move to return time",
    },
    {
      time: "Friday · 7:30 pm",
      minutes: 1170,
      title: "The kit comes back in pieces",
      text: "Kabir has brought back the projector and speaker. “Leela still has the adapter. She’ll drop it off tomorrow at nine.” Take the return and hand over to the morning shift.",
      next: "Move to next morning",
    },
    {
      time: "Saturday · 9:00 am",
      minutes: 1980,
      title: "Morning shift",
      text: "You’ve just taken over. Leela walks in with an adapter. Work out what was outstanding from the screening and close the loan for the right item.",
    },
  ];
  // Every return-by label the desk uses, in minutes since Friday 00:00.
  const dueTimes = {
    "Fri 8 pm": 1200,
    "Sat 9 am": 1980,
    "Sat 10 am": 2040,
    "Sat noon": 2160,
  };
  const dueLabels = Object.keys(dueTimes);
  const filters = ["All items", "On shelf", "On loan", "In repair"];
  const pages = [
    ["Requests", "clipboard-list"],
    ["Inventory", "package"],
    ["Loan register", "book-open"],
    ["Desk book", "messages-square"],
  ];
  // Loan shape (v2):
  //   who        – person who collected it at the counter (never changes)
  //   holder     – person who physically has it now
  //   promised   – promised-return label when it differs from `due`, else null
  //   returnedBy / returnedAt – filled in when the slip is closed
  const original = () => ({
    version: 2,
    tab: "Requests",
    phase: 0,
    selected: "",
    filter: "All items",
    loans: [
      {
        num: 401,
        req: "RQ-209",
        asset: "MI-09",
        who: "Tara Shah",
        due: "Sat 10 am",
        back: false,
        holder: "Tara Shah",
        promised: null,
        returnedBy: null,
        returnedAt: null,
      },
    ],
    notes: [],
    editing: false,
    handoff: null, // slip number whose "Update holder / promise" form is open
    confirming: null, // slip number whose return-confirm panel is open
    formError: "", // message shown inside the open form (role="alert")
    onlyOpen: true,
    notice: "Sample shift · All records are fictional.",
  });
  let s = original();
  const getAsset = (id) => assets.find((x) => x.id === id);
  const getReq = (id) => requests.find((x) => x.id === id);
  const out = (id) => s.loans.find((l) => l.asset === id && !l.back);
  const isDue = (x) => typeof x === "string" && Object.hasOwn(dueTimes, x);
  const isPerson = (x) => people.includes(x);
  const isClock = (x) => shifts.some((sh) => sh.time === x);
  const nowMinutes = (phase = s.phase) => shifts[phase].minutes;
  const dueMinutes = (label) => (isDue(label) ? dueTimes[label] : NaN);
  const clockMinutes = (label) => {
    const sh = shifts.find((x) => x.time === label);
    return sh ? sh.minutes : NaN;
  };
  // Open and past the time it should be back (the promise, if one was made).
  // Exactly on time is "due now", not overdue.
  const isOverdue = (loan) =>
    !loan.back && nowMinutes() > dueMinutes(loan.promised || loan.due);
  // Late against the ORIGINAL due time: at return, or now if still open.
  const wasLate = (loan) => {
    const end = loan.back ? clockMinutes(loan.returnedAt) : nowMinutes();
    return end > dueMinutes(loan.due);
  };
  const esc = (x) =>
    String(x).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const opts = (list, selected = null) =>
    list
      .map(
        ([v, t]) =>
          '<option value="' +
          esc(v) +
          '"' +
          (v === selected ? " selected" : "") +
          ">" +
          esc(t) +
          "</option>",
      )
      .join("");
  const btn = (label, act, val = "", style = "") =>
    '<button type="button" data-action="' +
    act +
    '" data-val="' +
    esc(val) +
    '" class="' +
    style +
    '">' +
    esc(label) +
    "</button>";
  const head = (title, sub, control = "") =>
    '<div class="sectionhead"><div><h2>' +
    title +
    "</h2><small>" +
    sub +
    "</small></div>" +
    control +
    "</div>";
  const row = (label, sub, right) =>
    '<div class="row"><div><strong>' +
    esc(label) +
    "</strong><small>" +
    esc(sub) +
    "</small></div><div>" +
    right +
    "</div></div>";
  // kind: "" (neutral), "good", "warn" or "bad". The text always says the
  // status in words, so colour is never the only signal.
  const badge = (t, kind = "") =>
    '<span class="tag' + (kind ? " " + kind : "") + '">' + esc(t) + "</span>";
  // Badge text + kind for a slip.
  function loanStatus(l) {
    if (l.back) return wasLate(l) ? ["Returned late", "warn"] : ["Returned", ""];
    if (isOverdue(l) || wasLate(l)) return ["Overdue", "bad"];
    if (dueMinutes(l.promised || l.due) - nowMinutes() <= 60)
      return ["Due soon", "warn"];
    return ["Out", ""];
  }
  // Plain-language lines describing a slip: what, for whom, where it is now.
  function loanLines(l) {
    const r = getReq(l.req);
    const lines = [
      "For " + r.id + " · " + r.club + " · collected by " + l.who,
    ];
    if (l.back) {
      lines.push(
        l.returnedBy
          ? "Returned by " + l.returnedBy + " · " + l.returnedAt
          : "Returned (time not recorded)",
      );
    } else {
      lines.push((wasLate(l) ? "Was due " : "Due ") + l.due);
      if (l.holder !== l.who || l.promised)
        lines.push(
          "With " + l.holder + (l.promised ? " · promised " + l.promised : ""),
        );
    }
    return lines;
  }
  // Inline form: who has the unit now, and when they promised to bring it.
  function handoffForm(l) {
    const later = dueLabels.filter((d) => dueMinutes(d) >= nowMinutes());
    return (
      '<form data-handoff data-num="' +
      l.num +
      '" class="inlineform"><div class="form"><label><span>Now held by</span><select name="holder" required>' +
      opts(
        people.map((p) => [p, p]),
        l.holder,
      ) +
      '</select></label><label><span>Promised back</span><select name="promised">' +
      opts(
        [["", "No new promise (due " + l.due + ")"]].concat(
          later.map((d) => [d, d]),
        ),
        l.promised || "",
      ) +
      '</select></label></div><div class="buttons"><button type="submit" class="primary">Save holder / promise</button>' +
      btn("Cancel", "handoff-cancel") +
      "</div></form>"
    );
  }
  const formError = () =>
    '<p role="alert" class="formerror" data-formerror>' +
    esc(s.formError) +
    "</p>";
  // Inline confirm panel: make the attendant check the physical unit
  // (model + bin) and say who brought it back before the slip closes.
  function returnForm(l) {
    const a = getAsset(l.asset);
    return (
      '<form data-return data-num="' +
      l.num +
      '" class="inlineform"><p><b>Close L-' +
      l.num +
      " · " +
      esc(a.id) +
      "</b> — " +
      esc(a.model) +
      " · bin " +
      esc(a.bin) +
      " · now with " +
      esc(l.holder) +
      '</p><div class="form"><label><span>Returned by</span><select name="by">' +
      opts(
        people.map((p) => [p, p]),
        l.holder,
      ) +
      '</select></label><label class="check full"><input type="checkbox" name="inhand" /><span>This is the unit in my hand (' +
      esc(a.model) +
      ", bin " +
      esc(a.bin) +
      ")</span></label></div>" +
      formError() +
      '<div class="buttons"><button type="submit" class="primary">Confirm return</button>' +
      btn("Cancel", "return-cancel") +
      "</div></form>"
    );
  }
  function loanTitle(l) {
    const a = getAsset(l.asset);
    return "L-" + l.num + " · " + a.id + " · " + a.model + " · bin " + a.bin;
  }
  // For each approved item type on a request, the latest slip for that type
  // (or null if it was never issued).
  function itemStates(r) {
    return r.items.map((type) => {
      const slips = s.loans.filter(
        (l) => l.req === r.id && getAsset(l.asset).type === type,
      );
      const loan = slips.length
        ? slips.reduce((a, b) => (b.num > a.num ? b : a))
        : null;
      return { type, loan };
    });
  }
  // "2 of 3 returned · 1 overdue (USB-C → HDMI adapter, with Leela Das)"
  function fulfilment(r, detail = true) {
    const st = itemStates(r);
    const returned = st.filter((x) => x.loan && x.loan.back).length;
    const notIssued = st.filter((x) => !x.loan).length;
    const open = st.filter((x) => x.loan && !x.loan.back);
    const late = open.filter((x) => loanStatus(x.loan)[0] === "Overdue");
    const parts = [returned + " of " + st.length + " returned"];
    if (notIssued) parts.push(notIssued + " not issued");
    if (open.length > late.length) parts.push(open.length - late.length + " out");
    if (late.length)
      parts.push(
        late.length +
          " overdue" +
          (detail
            ? " (" +
              late.map((x) => x.type + ", with " + x.loan.holder).join("; ") +
              ")"
            : ""),
      );
    return parts.join(" · ");
  }
  // One line per approved item: Not issued / Out — with X, due Y / Returned by X.
  function itemLine({ type, loan }) {
    let text, tag;
    if (!loan) {
      text = "Not issued";
      tag = badge("Not issued");
    } else if (!loan.back) {
      const [t, kind] = loanStatus(loan);
      text =
        "Out — with " +
        loan.holder +
        ", due " +
        loan.due +
        (loan.promised ? " · promised " + loan.promised : "") +
        " · L-" +
        loan.num +
        " · " +
        loan.asset;
      tag = badge(t, kind);
    } else {
      text =
        (loan.returnedBy
          ? "Returned by " + loan.returnedBy + ", " + loan.returnedAt
          : "Returned") +
        " · L-" +
        loan.num +
        " · " +
        loan.asset;
      tag = badge(...loanStatus(loan));
    }
    return (
      '<li class="row" data-item="' +
      esc(type) +
      '"><div><strong>' +
      esc(type) +
      "</strong><small>" +
      esc(text) +
      '</small></div><div class="rowend">' +
      tag +
      "</div></li>"
    );
  }
  function requestPage() {
    let html = head(
      "Approved requests",
      "Student Activities Office · 3 approved forms",
    );
    if (s.selected) {
      const r = getReq(s.selected);
      html +=
        btn("Back to list", "close") +
        '<div class="record"><small>' +
        esc(r.id) +
        " · Approved</small><h3>" +
        esc(r.event) +
        "</h3><p>" +
        esc(r.club) +
        " · Filed by " +
        esc(r.owner) +
        "</p><p><b>Return by</b> " +
        esc(r.due) +
        '</p><p class="summary" data-summary><b>' +
        esc(fulfilment(r)) +
        "</b></p><p><b>Approved equipment</b></p><ul class=\"items\">" +
        itemStates(r).map(itemLine).join("") +
        "</ul><p>" +
        esc(r.note) +
        "</p></div>";
    } else
      html += requests
        .map((r) =>
          row(
            r.event,
            r.id + " · " + r.club + " · " + fulfilment(r, false),
            btn("View form", "request", r.id),
          ),
        )
        .join("");
    return html;
  }
  function inventory() {
    let html = head(
      "Inventory",
      "Physical units · home shelf and current availability",
    );
    html +=
      '<div class="buttons"><label>Show <select data-filter>' +
      opts(
        filters.map((f) => [f, f]),
      ) +
      "</select></label></div>";
    for (const a of assets) {
      const status = a.repair
        ? "In repair"
        : out(a.id)
          ? "On loan"
          : "On shelf";
      if (s.filter !== "All items" && s.filter !== status) continue;
      html += row(
        a.id + " · " + a.type,
        a.model + " · " + a.bin,
        badge(status, status === "On shelf" ? "good" : ""),
      );
    }
    return html;
  }
  function register() {
    let html = head(
      "Loan register",
      "One slip per physical unit",
      s.editing
        ? btn("Cancel", "cancel")
        : btn("New issue slip", "new", "", "primary"),
    );
    if (s.editing) {
      const available = assets.filter((a) => !a.repair && !out(a.id));
      const select = (label, key, options) =>
        "<label><span>" +
        label +
        '</span><select name="' +
        key +
        '" required><option value="">Select…</option>' +
        opts(options) +
        "</select></label>";
      return (
        html +
        '<form data-issue><div class="form">' +
        select(
          "Approved request",
          "req",
          requests.map((r) => [r.id, r.id + " · " + r.club]),
        ) +
        select(
          "Unit leaving the desk",
          "asset",
          available.map((a) => [a.id, a.id + " · " + a.type]),
        ) +
        select(
          "Collected by",
          "who",
          people.map((p) => [p, p]),
        ) +
        select(
          "Return by",
          "due",
          dueLabels.map((d) => [d, d]),
        ) +
        '</div><button type="submit" class="primary">Save issue slip</button></form>'
      );
    }
    html +=
      '<div class="buttons">' +
      ["Outstanding", "All slips"]
        .map(
          (v, i) =>
            '<button type="button" data-action="scope" data-val="' +
            i +
            '" aria-pressed="' +
            (s.onlyOpen === (i === 0)) +
            '">' +
            v +
            "</button>",
        )
        .join("") +
      "</div>";
    const shown = s.loans
      .filter((l) => !s.onlyOpen || !l.back)
      .slice()
      .reverse();
    if (!shown.length) html += "<p>No outstanding slips.</p>";
    for (const l of shown) {
      const [text, kind] = loanStatus(l);
      html +=
        '<div class="row" data-loan="' +
        l.num +
        '"><div><strong>' +
        esc(loanTitle(l)) +
        "</strong>" +
        loanLines(l)
          .map((x) => "<small>" + esc(x) + "</small>")
          .join("") +
        '</div><div class="rowend">' +
        badge(text, kind) +
        (l.back
          ? ""
          : btn("Update holder / promise", "handoff", String(l.num)) +
            btn("Record return", "return", String(l.num))) +
        "</div></div>";
      if (!l.back && s.handoff === l.num) html += handoffForm(l);
      if (!l.back && s.confirming === l.num) html += returnForm(l);
    }
    return html;
  }
  function deskbook() {
    let html = head(
      "Desk book",
      "Messages from clubs and notes for the next shift",
    );
    const entries = [
      [
        "Friday · 3:20 pm",
        "Isha Rao · Film Society",
        "Kabir Sen is picking up our whole screening kit. Please issue it in his name. I’m setting up in the courtyard.",
      ],
      [
        "Friday · 3:30 pm",
        "Tara Shah · Debate Union",
        "Our microphone stays with me overnight. I’ll return it by 10 am Saturday.",
      ],
    ];
    if (s.phase >= 1)
      entries.push([
        "Friday · 7:30 pm",
        "Kabir Sen · Film Society",
        "I brought the projector and speaker. Leela Das has our adapter. She’ll be at the counter at 9 am tomorrow.",
      ]);
    for (const n of s.notes)
      entries.push([shifts[n.phase].time, "Counter handover", n.text]);
    for (const [t, author, body] of entries.slice().reverse())
      html +=
        '<article class="record"><small>' +
        esc(t) +
        "</small><h3>" +
        esc(author) +
        "</h3><p>" +
        esc(body) +
        "</p></article>";
    return (
      html +
      '<form data-note><div class="form"><label class="full"><span>Note for the next shift</span><textarea name="note" rows="2" maxlength="400" required></textarea></label></div><button type="submit">Add handover note</button></form>'
    );
  }
  const screens = {
    Requests: requestPage,
    Inventory: inventory,
    "Loan register": register,
    "Desk book": deskbook,
  };
  function paint() {
    const phase = shifts[s.phase];
    q("[data-clock]").textContent = phase.time;
    q("[data-shift-title]").textContent = phase.title;
    q("[data-shift]").textContent = phase.text;
    const advance = q('[data-action="advance"]');
    advance.hidden = !phase.next;
    advance.textContent = phase.next || "";
    q("[data-nav]").innerHTML = pages
      .map(
        ([n, icon]) =>
          '<button type="button" data-action="tab" data-val="' +
          n +
          '" aria-pressed="' +
          (s.tab === n) +
          '"><svg aria-hidden="true" class="store-icon"><use href="#icon-' +
          icon +
          '"></use></svg>' +
          n +
          "</button>",
      )
      .join("");
    q("[data-page]").innerHTML = screens[s.tab]();
    if (q("[data-filter]")) q("[data-filter]").value = s.filter;
    q("[data-status]").textContent = s.notice;
  }
  function commit(msg) {
    if (msg) s.notice = msg;
    paint();
    try {
      localStorage.setItem(storageKey, JSON.stringify(s));
    } catch {
      q("[data-status]").textContent +=
        " Browser storage is unavailable. Progress lasts for this visit.";
    }
  }
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-action]");
    if (!b) return;
    const v = b.dataset.val;
    s.formError = "";
    switch (b.dataset.action) {
      case "restart":
        s = original();
        break;
      case "advance":
        if (s.phase < 2) s.phase++;
        s.notice = "Shift time updated.";
        break;
      case "tab":
        s.tab = v;
        s.editing = false;
        s.handoff = null;
        s.confirming = null;
        break;
      case "handoff":
        s.handoff = Number(v);
        s.confirming = null;
        break;
      case "return-cancel":
        s.confirming = null;
        break;
      case "handoff-cancel":
        s.handoff = null;
        break;
      case "close":
        s.selected = "";
        break;
      case "request":
        s.selected = v;
        break;
      case "new":
        s.editing = true;
        break;
      case "cancel":
        s.editing = false;
        break;
      case "scope":
        s.onlyOpen = v === "0";
        break;
      case "return": {
        // Opens the confirm panel; nothing closes until it is confirmed.
        const l = s.loans.find((l) => l.num === Number(v));
        if (!l || l.back) return;
        s.confirming = l.num;
        s.handoff = null;
        break;
      }
    }
    commit();
  });
  root.addEventListener("change", (e) => {
    if (e.target.matches("[data-filter]")) {
      s.filter = e.target.value;
      commit();
    }
  });
  // Show a validation problem inside the open form and in the status bar.
  function fail(msg) {
    s.formError = msg;
    commit(msg);
  }
  root.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    const form = new FormData(f);
    if (f.matches("[data-note]")) {
      const text = String(form.get("note")).trim();
      if (!text) return;
      s.notes.push({ phase: s.phase, text, loanNum: null });
      commit("Handover note saved.");
      return;
    }
    if (f.matches("[data-return]")) {
      const l = s.loans.find((x) => x.num === Number(f.dataset.num) && !x.back);
      if (!l) return fail("This slip is already closed.");
      const a = getAsset(l.asset);
      const by = form.get("by");
      if (!isPerson(by)) return fail("Choose who brought the unit back.");
      if (form.get("inhand") !== "on")
        return fail(
          "Check the unit in your hand is " +
            a.model +
            " from bin " +
            a.bin +
            " before closing L-" +
            l.num +
            ".",
        );
      l.back = true;
      l.returnedBy = by;
      l.returnedAt = shifts[s.phase].time;
      s.confirming = null;
      commit(
        a.id +
          " (" +
          a.model +
          ") returned by " +
          by +
          ". Slip L-" +
          l.num +
          " closed.",
      );
      return;
    }
    if (f.matches("[data-handoff]")) {
      const l = s.loans.find((x) => x.num === Number(f.dataset.num) && !x.back);
      const holder = form.get("holder");
      const promised = form.get("promised") || null;
      if (!l || !isPerson(holder) || (promised !== null && !isDue(promised))) {
        q("[data-status]").textContent =
          "Could not update this slip. Choose a person and a return time.";
        return;
      }
      const moved = holder !== l.holder;
      l.holder = holder;
      l.promised = promised;
      s.handoff = null;
      const first = holder.split(" ")[0];
      commit(
        (moved ? "Handed to " + first : first + " still has it") +
          (promised ? ", promised " + promised : "") +
          ".",
      );
      return;
    }
    if (!f.matches("[data-issue]")) return;
    const [req, asset, who, due] = ["req", "asset", "who", "due"].map((k) =>
      form.get(k),
    );
    const unit = getAsset(asset),
      r = getReq(req);
    if (!r || !unit || unit.repair || out(asset) || !people.includes(who))
      return;
    if (!r.items.includes(unit.type)) {
      q("[data-status]").textContent =
        "This equipment type is outside the approved request. Choose an approved unit.";
      return;
    }
    if (
      s.loans.some(
        (l) => l.req === req && !l.back && getAsset(l.asset).type === unit.type,
      )
    ) {
      q("[data-status]").textContent =
        "The approved quantity of this equipment type is already on loan.";
      return;
    }
    const num = Math.max(400, ...s.loans.map((l) => l.num)) + 1;
    s.loans.push({
      num,
      req,
      asset,
      who,
      due,
      back: false,
      holder: who,
      promised: null,
      returnedBy: null,
      returnedAt: null,
    });
    s.editing = false;
    commit("Issued " + asset + " to " + who + " on slip L-" + num + ".");
  });
  // Turn a v1 saved shift into v2 shape. Validation happens afterwards in restore().
  function migrateV1(d) {
    if (
      !d ||
      typeof d !== "object" ||
      d.version !== 1 ||
      !Array.isArray(d.loans) ||
      !Array.isArray(d.notes)
    )
      return null;
    return {
      ...d,
      version: 2,
      loans: d.loans.map((l) =>
        l && typeof l === "object"
          ? {
              ...l,
              holder: l.who,
              promised: null,
              returnedBy: null,
              returnedAt: null,
            }
          : l,
      ),
      notes: d.notes.map((n) =>
        n && typeof n === "object" ? { ...n, loanNum: null } : n,
      ),
    };
  }
  // Strictly check a saved v2 shift. Returns a clean state built only from
  // known keys, or null if anything is wrong.
  function restore(d) {
    const isObj = (x) => !!x && typeof x === "object" && !Array.isArray(x);
    const orNull = (x, ok) => x === null || ok(x);
    const validLoan = (l) =>
      isObj(l) &&
      Number.isInteger(l.num) &&
      typeof l.req === "string" &&
      !!getReq(l.req) &&
      typeof l.asset === "string" &&
      !!getAsset(l.asset) &&
      isPerson(l.who) &&
      isDue(l.due) &&
      typeof l.back === "boolean" &&
      isPerson(l.holder) &&
      orNull(l.promised, isDue) &&
      orNull(l.returnedBy, isPerson) &&
      orNull(l.returnedAt, isClock);
    if (
      !isObj(d) ||
      d.version !== 2 ||
      typeof d.tab !== "string" ||
      !Object.hasOwn(screens, d.tab) ||
      !Number.isInteger(d.phase) ||
      d.phase < 0 ||
      d.phase > 2 ||
      typeof d.selected !== "string" ||
      (d.selected !== "" && !getReq(d.selected)) ||
      !filters.includes(d.filter) ||
      typeof d.editing !== "boolean" ||
      typeof d.onlyOpen !== "boolean" ||
      typeof d.notice !== "string" ||
      !Array.isArray(d.loans) ||
      !d.loans.length ||
      !d.loans.every(validLoan) ||
      !Array.isArray(d.notes)
    )
      return null;
    const nums = d.loans.map((l) => l.num);
    if (new Set(nums).size !== nums.length) return null;
    const openAssets = d.loans.filter((l) => !l.back).map((l) => l.asset);
    if (new Set(openAssets).size !== openAssets.length) return null;
    const validNote = (n) =>
      isObj(n) &&
      Number.isInteger(n.phase) &&
      n.phase >= 0 &&
      n.phase <= 2 &&
      typeof n.text === "string" &&
      orNull(n.loanNum, (k) => nums.includes(k));
    if (!d.notes.every(validNote)) return null;
    return {
      ...original(),
      version: 2,
      tab: d.tab,
      phase: d.phase,
      selected: d.selected,
      filter: d.filter,
      editing: d.editing,
      onlyOpen: d.onlyOpen,
      notice: d.notice,
      loans: d.loans.map((l) => ({
        num: l.num,
        req: l.req,
        asset: l.asset,
        who: l.who,
        due: l.due,
        back: l.back,
        holder: l.holder,
        promised: l.promised,
        returnedBy: l.returnedBy,
        returnedAt: l.returnedAt,
      })),
      notes: d.notes.map((n) => ({
        phase: n.phase,
        text: n.text,
        loanNum: n.loanNum,
      })),
    };
  }
  // Load v2; if there is none, migrate v1 once. Anything invalid → fresh shift.
  function load() {
    let raw, migrated = false;
    try {
      raw = localStorage.getItem(storageKey);
      if (raw === null) {
        raw = localStorage.getItem(legacyKey);
        migrated = raw !== null;
      }
    } catch {
      return; // Storage unavailable: keep the fresh shift.
    }
    if (raw === null) return;
    let d;
    try {
      d = JSON.parse(raw);
    } catch {
      return; // Corrupt JSON: keep the fresh shift.
    }
    const next = restore(migrated ? migrateV1(d) : d);
    if (!next) return;
    s = next;
    if (migrated) commit("Saved shift updated to the new format.");
    else paint();
  }
  paint();
  load();
})();
