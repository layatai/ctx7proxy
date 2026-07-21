const elements = {
  accounts: document.querySelector('#accounts'),
  accountForm: document.querySelector('#account-form'),
  settingsForm: document.querySelector('#settings-form'),
  status: document.querySelector('#status'),
  endpoint: document.querySelector('#endpoint'),
  message: document.querySelector('#message'),
  port: document.querySelector('#port'),
  launchAtLogin: document.querySelector('#launch-at-login')
};

let state;
let setupGuides;
let activeGuide = 'codex';

const notify = (message, isError = false) => {
  elements.message.textContent = message;
  elements.message.style.color = isError ? 'var(--danger)' : 'var(--acid)';
  setTimeout(() => { if (elements.message.textContent === message) elements.message.textContent = ''; }, 3500);
};

const render = (nextState) => {
  state = nextState;
  elements.status.className = `status ${state.runtime.state}`;
  elements.status.innerHTML = `<span></span><b>${state.runtime.state}</b>`;
  elements.endpoint.textContent = state.runtime.state === 'running' ? `${state.runtime.message}/mcp` : state.runtime.message;
  elements.port.value = state.port;
  elements.launchAtLogin.checked = state.launchAtLogin;
  elements.accounts.replaceChildren();

  if (state.accounts.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'No accounts yet. Add a key to activate the local proxy.';
    elements.accounts.append(empty);
    return;
  }

  for (const account of state.accounts) {
    const row = document.createElement('div');
    row.className = 'account';
    const details = document.createElement('div');
    const label = document.createElement('b');
    const key = document.createElement('code');
    label.textContent = account.label;
    key.textContent = account.maskedKey;
    details.append(label, key);
    const badge = document.createElement('code');
    badge.textContent = 'READY';
    const remove = document.createElement('button');
    remove.className = 'remove';
    remove.textContent = 'Remove';
    remove.addEventListener('click', async () => {
      try { render(await window.ctx7proxy.removeAccount(account.id)); }
      catch (error) { notify(error.message, true); }
    });
    row.append(details, badge, remove);
    elements.accounts.append(row);
  }
};

elements.accountForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = new FormData(elements.accountForm);
  try {
    render(await window.ctx7proxy.addAccount({ label: data.get('label'), apiKey: data.get('apiKey') }));
    elements.accountForm.reset();
    notify('Account added to the pool');
  } catch (error) { notify(error.message, true); }
});

elements.settingsForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = new FormData(elements.settingsForm);
  try {
    render(await window.ctx7proxy.updateSettings({
      port: Number(data.get('port')),
      launchAtLogin: data.get('launchAtLogin') === 'on',
      proxyApiKey: data.get('proxyApiKey') || undefined
    }));
    elements.settingsForm.elements.proxyApiKey.value = '';
    notify('Settings saved; proxy restarted');
  } catch (error) { notify(error.message, true); }
});

document.querySelector('#copy-endpoint').addEventListener('click', async () => {
  if (state.runtime.state !== 'running') return notify('Proxy is not running', true);
  await window.ctx7proxy.copyText(`${state.runtime.message}/mcp`);
  notify('MCP endpoint copied');
});
document.querySelector('#open-dashboard').addEventListener('click', () => window.ctx7proxy.openExternal('https://context7.com/dashboard'));

const setupDialog = document.querySelector('#setup-dialog');
const setupConfig = document.querySelector('#setup-config');
const configLocation = document.querySelector('#config-location');
const accessTokenNote = document.querySelector('#access-token-note');

const renderGuide = (guide) => {
  activeGuide = guide;
  setupConfig.textContent = setupGuides[guide];
  configLocation.textContent = guide === 'codex' ? '~/.codex/config.toml' : 'MCP client configuration';
  accessTokenNote.hidden = !setupGuides.requiresAccessToken;
  document.querySelectorAll('.setup-tab').forEach((tab) => {
    const selected = tab.dataset.guide === guide;
    tab.classList.toggle('active', selected);
    tab.setAttribute('aria-selected', String(selected));
  });
};

document.querySelector('#open-setup').addEventListener('click', async () => {
  try {
    setupGuides = await window.ctx7proxy.getSetupGuides();
    renderGuide('codex');
    setupDialog.showModal();
  } catch (error) { notify(error.message, true); }
});
document.querySelector('#close-setup').addEventListener('click', () => setupDialog.close());
setupDialog.addEventListener('click', (event) => {
  if (event.target === setupDialog) setupDialog.close();
});
document.querySelectorAll('.setup-tab').forEach((tab) => {
  tab.addEventListener('click', () => renderGuide(tab.dataset.guide));
});
document.querySelector('#copy-config').addEventListener('click', async () => {
  await window.ctx7proxy.copyText(setupGuides[activeGuide]);
  notify(`${activeGuide === 'codex' ? 'Codex' : 'MCP'} configuration copied`);
});

window.ctx7proxy.getState().then(render).catch((error) => notify(error.message, true));
