// /api/contato.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method Not Allowed');
  }

  // Lê o corpo bruto (x-www-form-urlencoded)
  const rawBody = await new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => resolve(data));
  });

  const params = new URLSearchParams(rawBody);
  const token = params.get('g-recaptcha-response');

  if (!token) {
    return res.status(400).send('Erro: reCAPTCHA não encontrado.');
  }

  // Verifica token no Google
  const verifyResp = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      secret: process.env.RECAPTCHA_SECRET,
      response: token,
      remoteip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || ''
    })
  });

  const verifyJson = await verifyResp.json();
  const ok = verifyJson && verifyJson.success === true;

  // (Opcional) trava por hostname
  if (ok && verifyJson.hostname) {
    const permitido = ['chaveslog.com.br', 'www.chaveslog.com.br'];
    if (!permitido.includes(verifyJson.hostname)) {
      return res.status(403).send('Erro: host inválido na verificação.');
    }
  }

  if (!ok) {
  return res
    .status(403)
    .send('Erro: reCAPTCHA inválido. ' + JSON.stringify(verifyJson));
}

  // Encaminha para o Getform com o mesmo corpo
  const fwd = await fetch(process.env.GETFORM_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: rawBody
  });

  if (!fwd.ok) {
    const txt = await fwd.text().catch(() => '');
    return res.status(502).send('Falha ao encaminhar para Getform. ' + txt);
  }

  // Redireciona para página de obrigado (crie /obrigado.html se quiser)
  res.statusCode = 302;
  res.setHeader('Location', '/obrigado.html');
  return res.end();
}
