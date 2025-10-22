// /api/contato.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Método não permitido');
  }

  // 1) Lê o corpo bruto (x-www-form-urlencoded)
  const rawBody = await new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => resolve(data));
  });

  const params = new URLSearchParams(rawBody);
  const token = params.get('g-recaptcha-response');

  if (!token) {
    return res.status(400).send('Token do reCAPTCHA ausente.');
  }

  // 2) Valida reCAPTCHA no Google
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
  if (!(verifyJson && verifyJson.success === true)) {
    // deixe esta linha enquanto testa; depois você pode simplificar a mensagem.
    return res.status(403).send('Erro: reCAPTCHA inválido. ' + JSON.stringify(verifyJson));
  }

  // (opcional) garante que o token foi emitido para o seu domínio
  if (verifyJson.hostname) {
    const okHosts = ['chaveslog.com.br', 'www.chaveslog.com.br'];
    if (!okHosts.includes(verifyJson.hostname)) {
      return res.status(403).send('Erro: host inválido na verificação.');
    }
  }

  // 3) Encaminha ao Getform com o MESMO corpo (mantém todos os campos)
  const fwd = await fetch(process.env.GETFORM_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: rawBody
  });

  if (!fwd.ok) {
    const txt = await fwd.text().catch(() => '');
    return res.status(502).send('Erro ao enviar para Getform. ' + txt);
  }

  // 4) Redireciona
  res.statusCode = 302;
  res.setHeader('Location', '/obrigado.html');
  return res.end();
}
