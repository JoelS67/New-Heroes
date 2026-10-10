const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');

loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = loginForm.querySelector('button[type="submit"]');
  button.disabled = true;
  loginMessage.textContent = 'Verificando acesso…';
  loginMessage.classList.remove('is-error');

  try {
    const response = await fetch('/admin/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: loginForm.elements.username.value,
        password: loginForm.elements.password.value
      })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Não foi possível entrar.');
    window.location.replace('/admin');
  } catch (error) {
    loginMessage.textContent = error.message;
    loginMessage.classList.add('is-error');
    button.disabled = false;
  }
});
