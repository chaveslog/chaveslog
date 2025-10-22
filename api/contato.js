export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Método não permitido');

  const { nome, email, telefone, mensagem, 'g-recaptcha-response': token } = req.body;
  if (!token) return res.status(400).send('Token do reCAPTCHA ausente.');

  const secretKey = process.env.RECAPTCHA_SECRET;

  // Validação do reCAPTCHA
  const verify = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `secret=${secretKey}&response=${token}`
  });

  const verifyJson = await verify.json();
  if (!verifyJson.success) {
    console.log('Erro reCAPTCHA:', verifyJson);
    return res.status(403).send(`Erro: reCAPTCHA inválido. ${JSON.stringify(verifyJson)}`);
  }

  // Envia ao Getform
  const formEndpoint = process.env.GETFORM_ENDPOINT;
  const send = await fetch(formEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome, email, telefone, mensagem })
  });

  if (send.ok) {
    res.redirect(302, '/obrigado.html');
  } else {
    res.status(500).send('Erro ao enviar formulário.');
  }
}
