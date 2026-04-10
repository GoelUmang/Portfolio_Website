const form      = document.getElementById('contact-form');
const submit    = document.getElementById('cf-submit');
const btnText   = document.getElementById('cf-btn-text');
const statusEl  = document.getElementById('cf-status');

function showStatus(msg, color) {
  statusEl.textContent   = msg;
  statusEl.style.color   = color;
  statusEl.style.display = 'inline';
}

// CSRF functionality removed as it is ineffective for public forms.

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
    const website   = document.getElementById('website')?.value ?? '';

    const res = await fetch('/api/contact', {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
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
