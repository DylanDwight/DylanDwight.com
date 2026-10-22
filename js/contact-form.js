// ============================================================
// contact-form.js — project inquiry form → Google Form
// Validates in the page, then posts the fields to the Google Form's
// formResponse endpoint in the background and shows the result inline.
// Google doesn't send CORS headers, so the request is "no-cors": the
// browser can tell a network failure from a sent request, but can't read
// Google's reply. Without JS the form posts to Google directly.
// ============================================================

const EMAIL = 'dylan@dylandwight.com';
const DETAILS_ENTRY = 'entry.726235173';
// Unsent answers are kept in this browser so a refresh doesn't lose them,
// and are dropped after a day or once the inquiry is sent.
const DRAFT_KEY = 'dd-inquiry-draft';
const DRAFT_MAX_AGE = 24 * 60 * 60 * 1000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function labelFor(field) {
  if (field.matches('fieldset')) {
    return field.querySelector('legend').firstChild.textContent.trim();
  }
  const input = field.querySelector('input, textarea');
  return field.querySelector(`label[for="${input.id}"]`).firstChild.textContent.trim();
}

function validate(form) {
  const problems = [];

  form.querySelectorAll('[data-required-group]').forEach((group) => {
    if (!group.querySelector('input:checked')) {
      problems.push({ id: group.id, focus: group.querySelector('input'), message: 'Choose at least one option.' });
    }
  });

  form.querySelectorAll('input[required]:not([type="radio"]), textarea[required]').forEach((input) => {
    if (!input.value.trim()) {
      problems.push({ id: input.id, focus: input, message: 'This field is required.' });
    } else if (input.type === 'email' && !EMAIL_PATTERN.test(input.value.trim())) {
      problems.push({ id: input.id, focus: input, message: 'Enter an email address like name@example.com.' });
    }
  });

  // Keep the summary in the same order as the form.
  const order = [...form.querySelectorAll('[data-error-for]')].map((el) => el.dataset.errorFor);
  return problems.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
}

function clearErrors(form) {
  form.querySelectorAll('[data-error-for]').forEach((el) => {
    el.hidden = true;
    el.textContent = '';
  });
  form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
  form.querySelector('[data-form-errors]').hidden = true;
}

function showErrors(form, problems) {
  const summary = form.querySelector('[data-form-errors]');
  const list = summary.querySelector('[data-error-list]');
  list.replaceChildren();

  problems.forEach(({ id, focus, message }) => {
    const error = form.querySelector(`[data-error-for="${id}"]`);
    error.textContent = message;
    error.hidden = false;
    (focus.matches('[type="radio"], [type="checkbox"]') && focus.closest('fieldset') || focus)
      .setAttribute('aria-invalid', 'true');

    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = `#${id}`;
    link.textContent = `${labelFor(error.closest('.field'))}: ${message}`;
    link.addEventListener('click', (event) => {
      event.preventDefault();
      focus.focus();
    });
    item.append(link);
    list.append(item);
  });

  summary.querySelector('[data-error-count]').textContent =
    problems.length === 1 ? 'one field' : `${problems.length} fields`;
  summary.hidden = false;
  summary.focus();
}

// The Google Form has no follow-up question, so the preference (and phone
// number, if given) goes at the top of the project details answer. The
// on-page-only fields are dropped from what's sent.
function buildPayload(form) {
  const data = new FormData(form);
  const followup = data.get('followup');
  const phone = (data.get('phone') || '').trim();
  data.delete('followup');
  data.delete('phone');

  const lines = [`Preferred follow-up: ${followup}`];
  if (followup !== 'Email is fine' && phone) lines.push(`Phone: ${phone}`);
  data.set(DETAILS_ENTRY, `${lines.join('\n')}\n\n${data.get(DETAILS_ENTRY)}`);
  return new URLSearchParams(data);
}

function saveDraft(form) {
  // Only what the visitor typed or picked; the hidden answers are fixed.
  const fixed = [...form.querySelectorAll('input[type="hidden"]')].map((input) => input.name);
  const fields = [...new FormData(form)].filter(([name, value]) => value !== '' && !fixed.includes(name));
  try {
    if (fields.length) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ savedAt: Date.now(), fields }));
    } else {
      localStorage.removeItem(DRAFT_KEY);
    }
  } catch {
    // Storage blocked (private mode, site data off): the form still works.
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Nothing to clear.
  }
}

// Returns true when saved answers were put back into the form.
function restoreDraft(form) {
  let draft;
  try {
    draft = JSON.parse(localStorage.getItem(DRAFT_KEY));
  } catch {
    return false;
  }
  if (!draft || !Array.isArray(draft.fields)) return false;
  if (Date.now() - draft.savedAt > DRAFT_MAX_AGE) {
    clearDraft();
    return false;
  }

  draft.fields.forEach(([name, value]) => {
    form.querySelectorAll(`[name="${CSS.escape(name)}"]`).forEach((input) => {
      if (input.type === 'radio' || input.type === 'checkbox') {
        if (input.value === value) input.checked = true;
      } else {
        input.value = value;
      }
    });
  });
  return draft.fields.length > 0;
}

function setStatus(form, html) {
  form.querySelector('[data-form-status]').innerHTML = html;
}

function setBusy(form, busy) {
  const button = form.querySelector('[data-submit]');
  button.disabled = busy;
  button.setAttribute('aria-busy', String(busy));
  button.querySelector('[data-submit-label]').textContent = busy ? 'Sending…' : 'Send inquiry';
}

export function initContactForm() {
  const form = document.querySelector('[data-inquiry-form]');
  if (!form) return;

  const success = document.querySelector('[data-form-success]');
  const honeypot = form.querySelector('[data-honeypot]');
  const connected = ![...form.elements].some((el) => el.name && el.name.includes('REPLACE'));
  const fallback = `<a href="mailto:${EMAIL}">${EMAIL}</a>`;
  const phoneField = form.querySelector('[data-followup-phone]');
  const callChoice = form.querySelector('[data-followup-call]');

  // The phone field only appears once someone asks for a call.
  form.addEventListener('change', (event) => {
    if (event.target.name === 'followup') phoneField.hidden = !callChoice.checked;
  });

  const draftNote = form.querySelector('[data-draft-note]');
  if (restoreDraft(form)) {
    phoneField.hidden = !callChoice.checked;
    draftNote.hidden = false;
  }
  form.addEventListener('input', () => saveDraft(form));
  form.addEventListener('change', () => saveDraft(form));
  form.querySelector('[data-draft-clear]').addEventListener('click', () => {
    clearDraft();
    form.reset();
    phoneField.hidden = true;
    draftNote.hidden = true;
    form.querySelector('input:not([type="hidden"])').focus();
  });

  // Clear a field's error as soon as it's fixed. Text fields clear while
  // typing ('input'), not on blur ('change'): clearing on blur would shift the
  // layout mid-click when someone types and then clicks an option below.
  const clearIfFixed = (event) => {
    const field = event.target.closest('.field');
    const error = field && field.querySelector('[data-error-for]');
    if (!error || error.hidden) return;
    if (!validate(form).some((p) => p.id === error.dataset.errorFor)) {
      error.hidden = true;
      field.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
      if (field.matches('[aria-invalid]')) field.removeAttribute('aria-invalid');
    }
  };
  form.addEventListener('input', clearIfFixed);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearErrors(form);
    setStatus(form, '');

    const problems = validate(form);
    if (problems.length) {
      showErrors(form, problems);
      return;
    }

    // Bots fill every field; quietly pretend it worked.
    if (honeypot.value) {
      form.hidden = true;
      success.hidden = false;
      return;
    }

    if (!connected) {
      setStatus(form, `The form isn't connected yet, so nothing was sent. Please email ${fallback} instead.`);
      return;
    }

    setBusy(form, true);
    try {
      await fetch(form.action, {
        method: 'POST',
        mode: 'no-cors',
        body: buildPayload(form),
      });
      success.querySelector('[data-success-followup]').textContent = callChoice.checked
        ? "I'll email you a few times for a call"
        : "I'll reply by email";
      clearDraft();
      form.hidden = true;
      success.hidden = false;
      success.focus();
    } catch {
      setStatus(
        form,
        `Your inquiry didn't send. Check your connection and try again, or email ${fallback}. Nothing you typed has been lost.`
      );
      setBusy(form, false);
    }
  });
}
