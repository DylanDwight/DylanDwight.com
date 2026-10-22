// ============================================================
// contact-form.js — project inquiry form → Google Form
// Validates in the page, then posts the fields to the Google Form's
// formResponse endpoint in the background and shows the result inline.
// Google doesn't send CORS headers, so the request is "no-cors": the
// browser can tell a network failure from a sent request, but can't read
// Google's reply. Without JS the form posts to Google directly.
// ============================================================

const EMAIL = 'dylan@dylandwight.com';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function labelFor(field) {
  if (field.matches('fieldset')) {
    return field.querySelector('legend').firstChild.textContent.trim();
  }
  const input = field.querySelector('input, textarea');
  if (input.type === 'checkbox') return 'Consent';
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
    const value = input.type === 'checkbox' ? input.checked : input.value.trim();
    if (!value) {
      const message = input.type === 'checkbox' ? 'Please tick the box to continue.' : 'This field is required.';
      problems.push({ id: input.id, focus: input, message });
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
        body: new URLSearchParams(new FormData(form)),
      });
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
