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
// name@domain.tld: no spaces, no doubled or edge dots, a letters-only TLD.
const EMAIL_PATTERN = /^(?!\.)(?!.*\.\.)[A-Za-z0-9._%+'-]+(?<!\.)@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;

// Content checks that catch keyboard-mash answers. Each returns an error
// message, or nothing when the answer looks real.
const words = (value) => value.split(/\s+/).filter(Boolean);
// A run of 6+ consonants ("sdfghjk") rarely appears in real words.
const looksMashed = (value) => /[bcdfghjklmnpqrstvwxz]{6,}/i.test(value) || /(.)\1{4,}/.test(value);

const CHECKS = {
  'f-name': (value) => {
    if (!/^[\p{L}][\p{L}\p{M}' .-]*$/u.test(value)) return 'Use letters only for your name.';
    if (value.replace(/[^\p{L}]/gu, '').length < 2 || looksMashed(value)) return 'Please enter your real name.';
  },
  'f-email': (value) => {
    if (!EMAIL_PATTERN.test(value)) return 'Enter an email address like name@example.com.';
  },
  'f-phone': (value) => {
    if (/[^\d\s().+-]/.test(value)) return 'Use numbers only, like (347) 555-0100.';
    const digits = value.replace(/\D/g, '');
    const us = digits.length === 10 || (digits.length === 11 && digits.startsWith('1'));
    const intl = value.trim().startsWith('+') && digits.length >= 8 && digits.length <= 15;
    if (!us && !intl) return 'Enter a 10-digit phone number, like (347) 555-0100.';
    if (/^(\d)\1+$/.test(digits.slice(-10)) || /^0123456789$|^1234567890$/.test(digits.slice(-10))) {
      return 'Please enter a real phone number.';
    }
  },
  'f-business': (value) => {
    if (!/\p{L}/u.test(value) || value.length < 2 || looksMashed(value)) return 'Please enter your business or project name.';
  },
  'f-details': (value) => {
    if (words(value).length < 4 || value.length < 20 || looksMashed(value)) {
      return 'Please add a sentence or two about your project.';
    }
  },
};

function labelFor(field) {
  if (field.matches('fieldset')) {
    return field.querySelector('legend').firstChild.textContent.trim();
  }
  const input = field.querySelector('input, select, textarea');
  return field.querySelector(`label[for="${input.id}"]`).firstChild.textContent.trim();
}

function validate(form) {
  const problems = [];

  form.querySelectorAll('[data-required-group]').forEach((group) => {
    if (!group.querySelector('input:checked')) {
      problems.push({ id: group.id, focus: group.querySelector('input'), message: 'Choose at least one option.' });
    }
  });

  form.querySelectorAll('input[required]:not([type="radio"]), select[required], textarea[required]').forEach((input) => {
    if (!input.value.trim()) {
      const message = input.matches('select') ? 'Please choose an option.' : 'This field is required.';
      problems.push({ id: input.id, focus: input, message });
    }
  });

  // Filled-in answers (required or optional) must also look real.
  Object.entries(CHECKS).forEach(([id, check]) => {
    const input = form.querySelector(`#${id}`);
    const value = input.value.trim();
    const message = value && check(value);
    if (message) problems.push({ id, focus: input, message });
  });

  // A call or text needs a number to reach.
  const phone = form.querySelector('#f-phone');
  if (form.querySelector('[data-needs-phone]:checked') && !phone.value.trim()) {
    problems.push({ id: phone.id, focus: phone, message: 'Add a phone number so I can call or text you.' });
  }

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

// The Google Form has no contact-method or phone question, so both go at
// the top of the project details answer. The on-page-only fields are
// dropped from what's sent.
function buildPayload(form) {
  const data = new FormData(form);
  const contact = data.get('contact');
  const phone = (data.get('phone') || '').trim();
  data.delete('contact');
  data.delete('phone');

  const lines = [`Preferred contact: ${contact}`];
  if (phone) lines.push(`Phone: ${phone}`);
  data.set(DETAILS_ENTRY, `${lines.join('\n')}\n\n${data.get(DETAILS_ENTRY)}`);
  // Skipped optional questions (budget) are left out rather than sent blank.
  [...data.keys()].forEach((key) => {
    if (data.getAll(key).every((value) => value === '')) data.delete(key);
  });
  return new URLSearchParams(data);
}

function saveDraft(form) {
  const fields = [...new FormData(form)].filter(([, value]) => value !== '');
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

  // Without JS the browser's own required-field checks stop an empty send;
  // with JS the checks above take over and show inline messages instead.
  form.noValidate = true;
  const success = document.querySelector('[data-form-success]');
  const honeypot = form.querySelector('[data-honeypot]');
  const connected = ![...form.elements].some((el) => el.name && el.name.includes('REPLACE'));
  const fallback = `<a href="mailto:${EMAIL}">${EMAIL}</a>`;
  const draftNote = form.querySelector('[data-draft-note]');
  if (restoreDraft(form)) draftNote.hidden = false;
  form.addEventListener('input', () => saveDraft(form));
  form.addEventListener('change', () => saveDraft(form));
  form.querySelector('[data-draft-clear]').addEventListener('click', () => {
    clearDraft();
    form.reset();
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
      const contact = form.querySelector('[name="contact"]:checked').value;
      success.querySelector('[data-success-followup]').textContent =
        contact === 'Email' ? 'an email' : 'a text';
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
