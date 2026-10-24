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

function doPost(e) {
  const answers = (e && e.parameter) || {};
  if (!answers.name || !answers.email || !answers.details) {
    return reply({ ok: false, error: 'Missing required answers' });
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const row = COLUMNS.map(([, field]) => (field ? clean(answers[field]) : new Date()));
    getSheet().appendRow(row);
  } finally {
    lock.releaseLock();
  }

  notify(answers);
  return reply({ ok: true });
}

function getSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMNS.map(([heading]) => heading));
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, COLUMNS.length).setFontWeight('bold');
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
