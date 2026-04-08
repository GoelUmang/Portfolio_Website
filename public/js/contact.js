const form      = document.getElementById('contact-form');
const submit    = document.getElementById('cf-submit');
const btnText   = document.getElementById('cf-btn-text');
const statusEl  = document.getElementById('cf-status');

function showStatus(msg, color) {
  statusEl.textContent   = msg;
  statusEl.style.color   = color;
  statusEl.style.display = 'inline';
}

// Fetch a fresh single-use CSRF token before every submission
async function getCsrfToken() {
  const res = await fetch('/api/csrf-token');
  if (!res.ok) throw new Error('Failed to fetch CSRF token');
  const { token } = await res.json();
  return token;
}

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const name    = document.getElementById('cf-name').value.trim();
  const email   = document.getElementById('cf-email').value.trim();
  const subject = document.getElementById('cf-subject').value.trim();
  const message = document.getElementById('cf-message').value.trim();

  if (!name || !email || !message) {
    showStatus('// Name, email, and message are required.', '#F87171');
    return;
  }

  submit.disabled        = true;
  btnText.textContent    = 'Transmitting…';
  statusEl.style.display = 'none';

  try {
    const csrfToken = await getCsrfToken();
    const website   = document.getElementById('website')?.value ?? '';

    const res = await fetch('/api/contact', {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({ name, email, subject, message, website }),
    });
    const data = await res.json();

    if (res.ok) {
      showStatus('// Message transmitted successfully.', 'var(--green)');
      form.reset();
    } else {
      showStatus(`// Error: ${data.error}`, '#F87171');
    }
  } catch {
    showStatus('// Network error — please try again.', '#F87171');
  } finally {
    submit.disabled     = false;
    btnText.textContent = 'Transmit Message';
  }
});
