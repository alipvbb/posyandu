export const getRequestBaseUrl = (req) => {
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  const forwardedHost = String(req.headers['x-forwarded-host'] || '').split(',')[0].trim();
  const host = forwardedHost || String(req.headers.host || '').split(',')[0].trim();
  const proto = forwardedProto || req.protocol || 'http';

  if (!host) return '';
  return `${proto}://${host}`;
};

export const buildPublicCardUrl = (req, publicToken) => {
  const base = getRequestBaseUrl(req);
  if (!base) return `/public/cards/${publicToken}`;
  return `${base}/public/cards/${publicToken}`;
};
