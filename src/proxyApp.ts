import express from 'express';
import https from 'https';
import zlib from 'zlib';
import path from 'path';
import fs from 'fs';

const TARGET_HOST = 'pwmarco-og-06656c44b005-d9e101c9f09c.herokuapp.com';
const TARGET_ORIGIN = `https://${TARGET_HOST}`;
const LOGO_DIRECT_URL = 'https://i.ibb.co/Q3g9fGSt/1791541921524.png';
const TG_CHANNEL = 'https://t.me/GBFreestudy';
const BRAND_NAME = 'GB STUDY';

export const app = express();

app.disable('x-powered-by');

// Permissive CORS and media range headers
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges, ETag');
  if (_req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Serve the user's icon for any logo or favicon request
const localLogoPath = path.join(process.cwd(), 'public', 'gb-study-logo.png');

const handleLogo = (_req: express.Request, res: express.Response) => {
  if (fs.existsSync(localLogoPath)) {
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.sendFile(localLogoPath);
  }
  return res.redirect(302, LOGO_DIRECT_URL);
};

// Catch-all logo and icon handler
app.use((req, res, next) => {
  const p = req.path.toLowerCase();
  if (
    p.includes('logo') ||
    p.includes('favicon') ||
    p.includes('apple-touch-icon') ||
    p.endsWith('gb-study-logo.png') ||
    p.endsWith('pw-marco-logo-2026.png') ||
    p.endsWith('logo-2026.png')
  ) {
    return handleLogo(req, res);
  }
  next();
});

// Client-side DOM enhancer for 100% branding and seamless PDF/Notes opening
const ENHANCER_SCRIPT = `
<script id="gb-study-enhancer">
(function() {
  const BRAND_NAME = "${BRAND_NAME}";
  const BRAND_TG = "${TG_CHANNEL}";
  const BRAND_LOGO = "${LOGO_DIRECT_URL}";

  // Force icon CSS rules to replace any logo image instantaneously
  const style = document.createElement('style');
  style.id = 'gb-study-styles';
  style.textContent = \`
    img[src*="logo"], img[src*="pw-marco"], img[alt*="PW-MARCO"], img[alt*="GB STUDY"] {
      content: url("\${BRAND_LOGO}") !important;
    }
    #gb-pdf-modal {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 9999999;
      background: rgba(0, 0, 0, 0.88);
      backdrop-filter: blur(8px);
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
  \`;
  document.head.appendChild(style);

  // In-app PDF & Notes viewer to prevent popup blocker failures
  function ensurePdfModal() {
    if (document.getElementById('gb-pdf-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'gb-pdf-modal';
    modal.innerHTML = \`
      <div style="background:#0f172a;border:1px solid rgba(255,255,255,0.15);border-radius:16px;width:100%;max-width:1050px;height:90vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,0.7);">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-bottom:1px solid rgba(255,255,255,0.1);background:#1e293b;">
          <div style="display:flex;align-items:center;gap:12px;">
            <img src="\${BRAND_LOGO}" style="width:30px;height:30px;border-radius:8px;object-fit:cover;" />
            <span style="font-weight:700;color:#fff;font-size:15px;letter-spacing:0.5px;">GB STUDY - Notes & PDF Viewer</span>
          </div>
          <div style="display:flex;gap:10px;align-items:center;">
            <a id="gb-pdf-download" href="#" target="_blank" download style="background:#10b981;color:#fff;padding:7px 16px;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none;display:inline-flex;align-items:center;gap:6px;transition:0.2s;">
              Download PDF
            </a>
            <a id="gb-pdf-open" href="#" target="_blank" style="background:#334155;color:#fff;padding:7px 16px;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none;transition:0.2s;">
              Open in New Tab
            </a>
            <button id="gb-pdf-close" style="background:transparent;border:none;color:#94a3b8;font-size:24px;cursor:pointer;padding:0 8px;line-height:1;margin-left:8px;">✕</button>
          </div>
        </div>
        <div style="flex:1;position:relative;background:#111;">
          <iframe id="gb-pdf-frame" src="" style="width:100%;height:100%;border:none;"></iframe>
        </div>
      </div>
    \`;
    document.body.appendChild(modal);
    document.getElementById('gb-pdf-close').onclick = () => {
      modal.style.display = 'none';
      document.getElementById('gb-pdf-frame').src = '';
    };
  }

  window.gbOpenPdf = function(url) {
    ensurePdfModal();
    const modal = document.getElementById('gb-pdf-modal');
    const frame = document.getElementById('gb-pdf-frame');
    const downloadBtn = document.getElementById('gb-pdf-download');
    const openBtn = document.getElementById('gb-pdf-open');
    frame.src = url;
    downloadBtn.href = url;
    openBtn.href = url;
    modal.style.display = 'flex';
  };

  // Intercept window.open to guarantee Notes and PDFs open without popup blocking
  const originalOpen = window.open;
  window.open = function(url, target, features) {
    if (url && (url.includes('.pdf') || url.includes('static.pw.live') || url.includes('/api/GetPdf'))) {
      window.gbOpenPdf(url);
      return null;
    }
    if (url === 'about:blank' || !url) {
      return {
        location: {
          set href(newUrl) {
            if (newUrl && (newUrl.includes('.pdf') || newUrl.includes('static.pw.live') || newUrl.includes('/api/GetPdf'))) {
              window.gbOpenPdf(newUrl);
            } else if (newUrl) {
              window.location.href = newUrl;
            }
          }
        }
      };
    }
    try {
      return originalOpen.call(window, url, target, features);
    } catch (e) {
      if (url) window.location.href = url;
    }
  };

  function applyGBBranding() {
    try {
      // Document title
      if (document.title && /PW[- ]?MARCO/i.test(document.title)) {
        document.title = document.title.replace(/PW[- ]?MARCO/gi, BRAND_NAME);
      }

      // Icons and Favicons
      document.querySelectorAll('link[rel*="icon"], link[rel="apple-touch-icon"]').forEach(el => {
        el.href = BRAND_LOGO;
      });

      // Images
      document.querySelectorAll('img').forEach(img => {
        const src = img.getAttribute('src') || '';
        const alt = img.getAttribute('alt') || '';
        if (src.includes('pw-marco') || src.includes('favicon') || /PW[- ]?MARCO/i.test(alt)) {
          img.src = BRAND_LOGO;
          img.srcset = '';
          if (img.alt) img.alt = img.alt.replace(/PW[- ]?MARCO/gi, BRAND_NAME);
        }
      });

      // Telegram Links
      document.querySelectorAll('a').forEach(a => {
        const href = a.getAttribute('href') || '';
        if (href.includes('t.me/official_marco') || href.includes('t.me/marco_')) {
          a.setAttribute('href', BRAND_TG);
        }
        if (a.textContent && /PW[- ]?MARCO/i.test(a.textContent)) {
          a.textContent = a.textContent.replace(/PW[- ]?MARCO/gi, BRAND_NAME);
        }
      });

      // Text nodes
      const walker = document.createTreeWalker(document.body || document.documentElement, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        if (node.nodeValue && /PW[- ]?MARCO/i.test(node.nodeValue)) {
          node.nodeValue = node.nodeValue.replace(/PW[- ]?MARCO/gi, BRAND_NAME);
        }
      }
    } catch (e) {
      // Ignore
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      ensurePdfModal();
      applyGBBranding();
    });
  } else {
    ensurePdfModal();
    applyGBBranding();
  }

  const observer = new MutationObserver(applyGBBranding);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true
  });
})();
</script>
`;

// Helper: Routes that MUST NOT be transformed (pure stream/binary/encrypted token passthrough)
function isUntouchedRoute(urlPath: string): boolean {
  return (
    urlPath.startsWith('/api/v/') ||
    urlPath.startsWith('/api/v?') ||
    urlPath.startsWith('/api/primary-stream') ||
    urlPath.startsWith('/api/GetPdf') ||
    urlPath.startsWith('/api/Schedule') ||
    urlPath.includes('.m3u8') ||
    urlPath.includes('.mpd') ||
    urlPath.includes('.ts') ||
    urlPath.includes('.mp4') ||
    urlPath.includes('.pdf')
  );
}

function transformBody(body: string, contentType: string): string {
  // 1. Telegram replacements
  body = body.replaceAll('https://t.me/official_marco_22', TG_CHANNEL);
  body = body.replaceAll('http://t.me/official_marco_22', TG_CHANNEL);
  body = body.replaceAll('https://t.me/marco_batches', TG_CHANNEL);
  body = body.replaceAll('t.me/official_marco_22', 't.me/GBFreestudy');
  body = body.replaceAll('official_marco_22', 'GBFreestudy');

  // 2. Name replacements
  body = body.replaceAll('PW-MARCO', BRAND_NAME);
  body = body.replaceAll('PW - MARCO', BRAND_NAME);
  body = body.replaceAll('PW_MARCO', 'GB_STUDY');

  // 3. Logo replacements
  body = body.replaceAll('/pw-marco-logo-2026.png?v=pw-marco-2026c', LOGO_DIRECT_URL);
  body = body.replaceAll('/pw-marco-logo-2026.png', LOGO_DIRECT_URL);
  body = body.replaceAll('/favicon.png?v=pw-marco-2026c', LOGO_DIRECT_URL);
  body = body.replaceAll('/favicon.png', LOGO_DIRECT_URL);
  body = body.replaceAll('/apple-touch-icon.png?v=pw-marco-2026c', LOGO_DIRECT_URL);
  body = body.replaceAll('/apple-touch-icon.png', LOGO_DIRECT_URL);
  body = body.replaceAll('https://ibb.co/0R7qc34v', LOGO_DIRECT_URL);

  // Inject enhancer into HTML
  if (contentType.includes('text/html')) {
    if (body.includes('</head>')) {
      body = body.replace('</head>', `${ENHANCER_SCRIPT}</head>`);
    } else if (body.includes('</body>')) {
      body = body.replace('</body>', `${ENHANCER_SCRIPT}</body>`);
    } else {
      body += ENHANCER_SCRIPT;
    }
  }

  return body;
}

// Redirect root to /study/batches as requested
app.get('/', (_req, res) => {
  res.redirect(302, '/study/batches');
});

// Proxy handler
app.use((req, res) => {
  const targetPath = req.originalUrl;
  const isUntouched = isUntouchedRoute(targetPath);

  const headers: Record<string, string | string[]> = {};
  for (const [key, val] of Object.entries(req.headers)) {
    if (val === undefined) continue;
    const lower = key.toLowerCase();
    if (['host', 'connection'].includes(lower)) continue;
    headers[lower] = val;
  }

  headers['host'] = TARGET_HOST;
  headers['origin'] = TARGET_ORIGIN;
  if (headers['referer'] && typeof headers['referer'] === 'string') {
    headers['referer'] = headers['referer'].replace(/https?:\/\/[^\/]+/, TARGET_ORIGIN);
  }

  // Preserve guest session cookie if missing
  let cookieHeader = (req.headers.cookie || '') as string;
  if (!cookieHeader.includes('guest_id')) {
    cookieHeader = cookieHeader ? `${cookieHeader}; guest_id=gb_study_guest` : 'guest_id=gb_study_guest';
  }
  headers['cookie'] = cookieHeader;

  const options: https.RequestOptions = {
    hostname: TARGET_HOST,
    port: 443,
    path: targetPath,
    method: req.method,
    headers: headers,
  };

  const proxyReq = https.request(options, (proxyRes) => {
    const statusCode = proxyRes.statusCode || 200;
    const contentType = proxyRes.headers['content-type'] || '';
    const contentEncoding = proxyRes.headers['content-encoding'];
    const isTransformable = !isUntouched && /text|javascript|json|html|xml|x-component/i.test(contentType);

    res.status(statusCode);

    // Forward headers with iframe & CORS permissions
    for (const [key, val] of Object.entries(proxyRes.headers)) {
      if (val === undefined) continue;
      const lower = key.toLowerCase();
      if (['x-frame-options', 'content-security-policy', 'content-security-policy-report-only'].includes(lower)) {
        continue;
      }
      if (lower === 'set-cookie') {
        const cookies = Array.isArray(val) ? val : [val];
        const sanitized = cookies.map((c) =>
          c.replace(/;\s*Domain=[^;]+/gi, '')
           .replace(/;\s*SameSite=[^;]+/gi, '')
           .concat('; SameSite=None; Secure; Partitioned')
        );
        res.setHeader('set-cookie', sanitized);
        continue;
      }
      res.setHeader(key, val);
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges, ETag');

    // 1. For video streams, chunks, media, PDFs, or untouched routes -> pipe directly byte-for-byte!
    if (!isTransformable) {
      proxyRes.pipe(res);
      return;
    }

    // 2. For UI HTML / JS / JSON -> buffer and apply branding replacements
    const chunks: Buffer[] = [];
    proxyRes.on('data', (chunk) => chunks.push(chunk));
    proxyRes.on('end', () => {
      const rawBuffer = Buffer.concat(chunks);
      try {
        let decompressed = rawBuffer;

        if (contentEncoding === 'gzip') {
          decompressed = zlib.gunzipSync(rawBuffer);
        } else if (contentEncoding === 'br') {
          decompressed = zlib.brotliDecompressSync(rawBuffer);
        } else if (contentEncoding === 'deflate') {
          decompressed = zlib.inflateSync(rawBuffer);
        }

        const utf8String = decompressed.toString('utf-8');
        const transformedString = transformBody(utf8String, contentType);
        const transformedBuffer = Buffer.from(transformedString, 'utf-8');

        res.removeHeader('content-encoding');
        res.setHeader('content-length', transformedBuffer.length);
        res.send(transformedBuffer);
      } catch (err) {
        console.error('Transform error, serving raw buffer:', err);
        res.send(rawBuffer);
      }
    });
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy request error:', err);
    if (!res.headersSent) {
      res.status(502).send('Bad Gateway: Unable to reach upstream server');
    }
  });

  req.pipe(proxyReq);
});

export default app;
