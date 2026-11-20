// ============================================================
// Code.gs — saves contact-page inquiries to a Google Sheet
// Google Apps Script web app. The contact form (js/contact-form.js) posts
// its fields here; each inquiry becomes one row, and an email lets Dylan
// know a new one arrived.
//
// Setup (once):
// 1. Create a blank Google Sheet (sheets.new).
// 2. Extensions → Apps Script. Replace everything in Code.gs with this
//    file and click Save.
// 3. Deploy → New deployment → type "Web app". Execute as: Me.
//    Who has access: Anyone. Click Deploy and allow access (Google warns
//    the app isn't verified: Advanced → Go to project → Allow).
// 4. Copy the Web app URL (ends in /exec) into the form's action in
//    contact/index.html.
// After editing this file later: Deploy → Manage deployments → edit →
// Version: New version, so the same URL serves the new code.
// ============================================================

const SHEET_NAME = 'Inquiries';
// Submissions that fail the spam checks land here instead, with the reason,
// and send no email. Nothing is thrown away, so a real lead caught by
// mistake can still be found.
const FILTERED_SHEET_NAME = 'Filtered';
const NOTIFY_EMAIL = 'dylan@dylandwight.com';
const MAX_LENGTH = 5000;

// [column heading, form field name]; the order here is the column order.
const COLUMNS = [
  ['Submitted', null],
  ['Name', 'name'],
  ['Email', 'email'],
  ['Phone', 'phone'],
  ['Preferred contact', 'contact'],
  ['Business or organization', 'business'],
  ['Service', 'service'],
  ['Timeline', 'timeline'],
  ['Budget', 'budget'],
  ['Project details', 'details'],
];

// ---- Spam checks ------------------------------------------------------
// The form's URL is public, so bots post to it directly and skip every check
// in js/contact-form.js. These run on every submission, here on the server.

// Fastest a person can fill the form, in milliseconds since the page loaded.
const MIN_FILL_MS = 4000;

// Must match the <option> values in contact/index.html.
const ALLOWED = {
  service: [
    'Landing page', 'Small-business website', 'Website redesign', 'Responsive front-end build',
    'Basic brand direction or design assets', 'SEO foundations', 'Accessibility cleanup',
    'Website maintenance or technical support', 'Other',
  ],
  timeline: [
    'As soon as possible', 'Within 1 month', 'Within 1–3 months',
    'More than 3 months from now', 'I’m still figuring it out',
  ],
  contact: ['Email', 'Google Meet video call'],
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
// Lines from cold-pitch templates seen in the Sheet. Add more as new ones show up.
const PITCH_PHRASES = [
  /opt out here/i,
  /came in through your contact (page|form)/i,
  /just filled (in|out) your contact form/i,
];

// Returns why a submission looks like spam, or '' when it looks real.
function spamReason(answers) {
  const get = (field) => String(answers[field] || '').trim();
  const name = get('name');
  const details = get('details');

  // Filled only by the page's script, so a direct post has none.
  const fillMs = Number(get('form_ms'));
  if (!get('form_ms') || !Number.isFinite(fillMs)) return 'Not sent from the website form';
  if (get('hp')) return 'Hidden spam-trap field was filled';
  if (fillMs < MIN_FILL_MS) return `Sent ${Math.round(fillMs / 1000)}s after the page loaded`;

  if (!/^[\p{L}][\p{L}\p{M}'’ .-]*$/u.test(name)) return 'Name has links, numbers or symbols';
  if (!EMAIL_PATTERN.test(get('email'))) return 'Email address is not valid';
  for (const [field, options] of Object.entries(ALLOWED)) {
    if (!options.includes(get(field))) return `Unexpected ${field}: "${get(field).slice(0, 40)}"`;
  }
  if (details.split(/\s+/).filter(Boolean).length < 4) return 'Project details are too short';
  if (PITCH_PHRASES.some((p) => p.test(details))) return 'Reads like a sales pitch';
  return '';
}

function doPost(e) {
  const answers = (e && e.parameter) || {};
  if (!answers.name || !answers.email || !answers.details) {
    return reply({ ok: false, error: 'Missing required answers' });
  }

  const reason = spamReason(answers);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const row = COLUMNS.map(([, field]) => (field ? clean(answers[field]) : new Date()));
    if (reason) {
      getSheet(FILTERED_SHEET_NAME, ['Reason']).appendRow([...row, reason]);
    } else {
      getSheet(SHEET_NAME).appendRow(row);
    }
  } finally {
    lock.releaseLock();
  }

  if (!reason) notify(answers);
  // Same answer either way, so bots can't tell what was caught.
  return reply({ ok: true });
}

function getSheet(name, extraHeadings = []) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    const headings = [...COLUMNS.map(([heading]) => heading), ...extraHeadings];
    sheet.appendRow(headings);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headings.length).setFontWeight('bold');
  }
  return sheet;
}

// Trims and caps each answer. A leading = + - or @ would make Sheets treat
// the answer as a formula, so those get a ' in front to keep it plain text.
function clean(value) {
  const text = String(value || '').trim().slice(0, MAX_LENGTH);
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

// A failed email shouldn't lose the inquiry: the row is already saved.
function notify(answers) {
  try {
    const body = COLUMNS.filter(([, field]) => field)
      .map(([heading, field]) => `${heading}: ${String(answers[field] || '—').trim()}`)
      .join('\n\n');
    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      replyTo: answers.email,
      subject: `New inquiry from ${String(answers.name).trim()}`,
      body: `${body}\n\nAll inquiries: ${SpreadsheetApp.getActiveSpreadsheet().getUrl()}`,
    });
  } catch (error) {
    console.error(error);
  }
}

function reply(result) {
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}
