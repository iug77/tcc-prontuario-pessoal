// Armazenamento de arquivos no Cloudflare R2 (S3-compatível).
// Os documentos clínicos NÃO ficam mais embutidos em base64 no banco:
// o conteúdo vai para o bucket R2 e a tabela Registro guarda apenas a chave do objeto.
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const BUCKET = process.env.R2_BUCKET || '';

// Verifica se todas as variáveis de ambiente do R2 estão presentes.
function r2Configurado() {
  return Boolean(ACCOUNT_ID && ACCESS_KEY_ID && SECRET_ACCESS_KEY && BUCKET);
}

let clienteCache = null;
function obterCliente() {
  if (!r2Configurado()) {
    throw new Error('Cloudflare R2 não configurado (variáveis R2_* ausentes).');
  }
  if (!clienteCache) {
    clienteCache = new S3Client({
      region: 'auto',
      endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: ACCESS_KEY_ID,
        secretAccessKey: SECRET_ACCESS_KEY,
      },
    });
  }
  return clienteCache;
}

// Faz upload de um buffer para o bucket sob a chave informada.
async function uploadObjeto(chave, buffer, contentType) {
  const cliente = obterCliente();
  await cliente.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: chave,
      Body: buffer,
      ContentType: contentType || 'application/octet-stream',
    })
  );
  return chave;
}

// Baixa o objeto e retorna seu conteúdo como Buffer.
async function obterBufferObjeto(chave) {
  const cliente = obterCliente();
  const resposta = await cliente.send(
    new GetObjectCommand({ Bucket: BUCKET, Key: chave })
  );

  const chunks = [];
  for await (const chunk of resposta.Body) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

// Gera uma URL assinada temporária (GET) para exibição/download direto pelo navegador.
async function gerarUrlAssinada(chave, expiraSegundos = 3600) {
  const cliente = obterCliente();
  return getSignedUrl(
    cliente,
    new GetObjectCommand({ Bucket: BUCKET, Key: chave }),
    { expiresIn: expiraSegundos }
  );
}

// Remove o objeto do bucket (ignora erros para não bloquear a exclusão do registro).
async function removerObjeto(chave) {
  if (!chave) return;
  try {
    const cliente = obterCliente();
    await cliente.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: chave }));
  } catch (erro) {
    console.warn('[R2] Falha ao remover objeto', chave, erro.message);
  }
}

module.exports = {
  r2Configurado,
  uploadObjeto,
  obterBufferObjeto,
  gerarUrlAssinada,
  removerObjeto,
};
