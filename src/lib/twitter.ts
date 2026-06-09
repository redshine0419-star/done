import crypto from 'crypto';
export async function postTweet(text: string): Promise<void> {
  const apiKey = process.env.TWITTER_API_KEY;
  const apiSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_SECRET;
  if (!apiKey || !apiSecret || !accessToken || !accessSecret) return;
  const url = 'https://api.twitter.com/2/tweets';
  const method = 'POST';
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString('hex');
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: apiKey, oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1', oauth_timestamp: timestamp,
    oauth_token: accessToken, oauth_version: '1.0',
  };
  const paramString = Object.keys(oauthParams).sort().map((k) => `${enc(k)}=${enc(oauthParams[k])}`).join('&');
  const baseString = [method, enc(url), enc(paramString)].join('&');
  const signingKey = `${enc(apiSecret)}&${enc(accessSecret)}`;
  const signature = crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');
  oauthParams['oauth_signature'] = signature;
  const authHeader = 'OAuth ' + Object.keys(oauthParams).sort().map((k) => `${enc(k)}="${enc(oauthParams[k])}"`).join(', ');
  await fetch(url, { method, headers: { Authorization: authHeader, 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) }).catch(() => {});
}
function enc(s: string): string { return encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`); }
export function buildTweetText(title: string, summary: string, url: string, hashtags: string): string {
  const base = `📝 ${title}\n\n${summary ? summary.slice(0, 80) + (summary.length > 80 ? '...' : '') + '\n\n' : ''}👉 ${url} ${hashtags}`;
  return base.slice(0, 280);
}
