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
const PW_MARCO_IMG_HASH = 'file-000000008d1c8211a64b48d531d3d091';

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

// Local asset paths
const localLogoPath = path.join(process.cwd(), 'public', 'gb-study-logo.png');
const telegramBannerPath = path.join(process.cwd(), 'public', 'telegram-banner.png');
const carouselBannerPath = path.join(process.cwd(), 'public', 'gb-study-carousel.jpg');
const batchCardPath = path.join(process.cwd(), 'public', 'gb-study-batch-card.png');

const handleLogo = (_req: express.Request, res: express.Response) => {
  if (fs.existsSync(localLogoPath)) {
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.sendFile(localLogoPath);
  }
  return res.redirect(302, LOGO_DIRECT_URL);
};

// Serve custom batch card image (replaces PW-MARCO batch thumbnail)
app.get(['/gb-study-batch-card.png', '/gb-study-batch-card.jpg'], (_req, res) => {
  if (fs.existsSync(batchCardPath)) {
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.sendFile(batchCardPath);
  }
  return res.redirect(302, LOGO_DIRECT_URL);
});

// Serve custom banners
app.get('/telegram-banner.png', (_req, res) => {
  if (fs.existsSync(telegramBannerPath)) {
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.sendFile(telegramBannerPath);
  }
  res.redirect(302, LOGO_DIRECT_URL);
});

app.get(['/gb-study-carousel.jpg', '/gb-banner-2.jpg'], (_req, res) => {
  if (fs.existsSync(carouselBannerPath)) {
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.sendFile(carouselBannerPath);
  }
  res.redirect(302, LOGO_DIRECT_URL);
});

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

// Client-side DOM enhancer: GB STUDY branding on banners, batch cards, and opening Notes directly in a NEW TAB!
const ENHANCER_SCRIPT = `
<script id="gb-study-enhancer">
(function() {
  const BRAND_NAME = "${BRAND_NAME}";
  const BRAND_TG = "${TG_CHANNEL}";
  const BRAND_LOGO = "${LOGO_DIRECT_URL}";
  const BATCH_CARD_IMG = "/gb-study-batch-card.png";
  const BANNER_IMG_1 = "/gb-study-carousel.jpg";
  const BANNER_IMG_2 = "/telegram-banner.png";
  const PW_MARCO_REGEX = /PW[\\s\\-_]*MARCO/gi;

  // Intercept window.open so Notes and PDFs open DIRECTLY in a NEW TAB without popup errors
  const originalOpen = window.open;
  window.open = function(url, target, features) {
    // If a direct URL is given (e.g. PDF link) -> open directly in new tab!
    if (url && url !== 'about:blank') {
      try {
        const win = originalOpen.call(window, url, target || '_blank', features);
        if (win) return win;
      } catch (e) {}
      const a = document.createElement('a');
      a.href = url;
      a.target = target || '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => a.remove(), 100);
      return {
        close: function() {},
        focus: function() {},
        blur: function() {},
        closed: false,
        location: { href: url }
      };
    }

    // If 'about:blank' was requested for async PDF loading:
    let popup = null;
    try {
      popup = originalOpen.call(window, 'about:blank', '_blank');
    } catch (e) {
      popup = null;
    }

    if (popup) {
      return popup;
    }

    // Fallback object with full Window mock methods so a?.close() never throws!
    return {
      close: function() {
        if (popup && !popup.closed) {
          try { popup.close(); } catch (e) {}
        }
      },
      focus: function() {
        if (popup && !popup.closed) {
          try { popup.focus(); } catch (e) {}
        }
      },
      blur: function() {},
      closed: false,
      location: {
        set href(newUrl) {
          if (popup && !popup.closed) {
            try {
              popup.location.href = newUrl;
              return;
            } catch (e) {}
          }
          const a = document.createElement('a');
          a.href = newUrl;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          document.body.appendChild(a);
          a.click();
          setTimeout(() => a.remove(), 100);
        },
        get href() {
          return popup ? popup.location.href : '';
        }
      }
    };
  };

  function applyGBBranding() {
    try {
      // Document title
      if (document.title && PW_MARCO_REGEX.test(document.title)) {
        document.title = document.title.replace(PW_MARCO_REGEX, BRAND_NAME);
      }

      // Icons and Favicons
      document.querySelectorAll('link[rel*="icon"], link[rel="apple-touch-icon"]').forEach(el => {
        el.href = BRAND_LOGO;
      });

      // Images, Logos, Banners & Batch Cards
      document.querySelectorAll('img').forEach(img => {
        const src = img.getAttribute('src') || '';
        const alt = img.getAttribute('alt') || '';

        // Replace PW MARCO batch card image with GB STUDY batch card image
        if (src.includes('${PW_MARCO_IMG_HASH}') || src.includes('YT0v1Fcc')) {
          img.src = BATCH_CARD_IMG;
          img.srcset = '';
        }

        // Replace logo
        if (src.includes('pw-marco') || src.includes('favicon') || PW_MARCO_REGEX.test(alt)) {
          img.src = BRAND_LOGO;
          img.srcset = '';
          if (img.alt) img.alt = img.alt.replace(PW_MARCO_REGEX, BRAND_NAME);
        }

        // Replace promotion / telegram banner
        if (src.includes('telegram-banner') || alt.toLowerCase().includes('promotion')) {
          img.src = BANNER_IMG_2;
          img.srcset = '';
        }

        // Replace carousel slides if they are default PW slides
        if (alt === 'Slide 1' && (src.includes('2cd05c71') || src.includes('pw.live'))) {
          img.src = BANNER_IMG_1;
          img.srcset = '';
        }
        if (alt === 'Slide 2' && (src.includes('4f17deae') || src.includes('pw.live'))) {
          img.src = BANNER_IMG_2;
          img.srcset = '';
        }
      });

      // Telegram Links
      document.querySelectorAll('a').forEach(a => {
        const href = a.getAttribute('href') || '';
        if (href.includes('t.me/official_marco') || href.includes('t.me/marco_')) {
          a.setAttribute('href', BRAND_TG);
        }
        if (a.textContent && PW_MARCO_REGEX.test(a.textContent)) {
          a.textContent = a.textContent.replace(PW_MARCO_REGEX, BRAND_NAME);
        }
      });

      // Text nodes replacement across the entire DOM
      const walker = document.createTreeWalker(document.body || document.documentElement, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        if (node.nodeValue && PW_MARCO_REGEX.test(node.nodeValue)) {
          node.nodeValue = node.nodeValue.replace(PW_MARCO_REGEX, BRAND_NAME);
        }
      }

      // Attributes replacement (placeholder, title, aria-label, alt)
      document.querySelectorAll('*').forEach(el => {
        ['alt', 'title', 'placeholder', 'aria-label'].forEach(attr => {
          const val = el.getAttribute(attr);
          if (val && PW_MARCO_REGEX.test(val)) {
            el.setAttribute(attr, val.replace(PW_MARCO_REGEX, BRAND_NAME));
          }
        });
      });
    } catch (e) {
      // Ignore
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyGBBranding);
  } else {
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

// Helper: Routes that MUST NOT be touched (pure video stream/binary/encrypted token passthrough)
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
  body = body.replaceAll('official_marco', 'GBFreestudy');

  // 2. Batch Card Image replacement (replaces PW-MARCO batch thumbnail with GB STUDY batch card)
  body = body.replaceAll('https://i.ibb.co/YT0v1Fcc/file-000000008d1c8211a64b48d531d3d091.png', '/gb-study-batch-card.png');
  body = body.replaceAll(PW_MARCO_IMG_HASH, 'gb-study-batch-card');

  // 3. Name replacements - All variations of PW MARCO to GB STUDY
  body = body.replace(/PW[\s\-_]*MARCO/gi, BRAND_NAME);
  body = body.replace(/\bpw[\s\-_]*marco\b/gi, BRAND_NAME);

  // 4. Batch "byName" or badges
  body = body.replaceAll('"byName":"PW"', `"byName":"${BRAND_NAME}"`);
  body = body.replaceAll('"byName": "PW"', `"byName": "${BRAND_NAME}"`);

  // 5. Logo replacements
  body = body.replaceAll('/pw-marco-logo-2026.png?v=pw-marco-2026c', LOGO_DIRECT_URL);
  body = body.replaceAll('/pw-marco-logo-2026.png', LOGO_DIRECT_URL);
  body = body.replaceAll('/favicon.png?v=pw-marco-2026c', LOGO_DIRECT_URL);
  body = body.replaceAll('/favicon.png', LOGO_DIRECT_URL);
  body = body.replaceAll('/apple-touch-icon.png?v=pw-marco-2026c', LOGO_DIRECT_URL);
  body = body.replaceAll('/apple-touch-icon.png', LOGO_DIRECT_URL);
  body = body.replaceAll('https://ibb.co/0R7qc34v', LOGO_DIRECT_URL);

  // 6. Carousel Banners replacement
  body = body.replaceAll('https://static.pw.live/5eb393ee95fab7468a79d189/ADMIN/2cd05c71-3897-4e88-9c73-3e307e0dde03.jpg', '/gb-study-carousel.jpg');
  body = body.replaceAll('https://static.pw.live/5eb393ee95fab7468a79d189/ADMIN/4f17deae-eab1-4b19-b5cb-2bb2291d60e5.jpg', '/telegram-banner.png');

  // 7. Fix Shaka Player unrecognized key .streaming.jumpLargeGaps error
  body = body.replaceAll('jumpLargeGaps:!0,', '');
  body = body.replaceAll('jumpLargeGaps:!0', '');
  body = body.replaceAll('jumpLargeGaps:true,', '');
  body = body.replaceAll('jumpLargeGaps:true', '');
  body = body.replaceAll(',jumpLargeGaps:!0', '');
  body = body.replaceAll(',jumpLargeGaps:true', '');

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

// Health and verification endpoints (returns JSON for verification status checks)
app.get(['/_health', '/health', '/api/health', '/status', '/_status'], (_req, res) => {
  res.json({ status: 'ok', name: BRAND_NAME });
});

// Root route: return JSON if Accept is application/json, otherwise redirect to /study/batches
app.get('/', (req, res) => {
  const accept = req.headers['accept'] || '';
  if (accept.includes('application/json') && !accept.includes('text/html')) {
    return res.json({ status: 'ok', name: BRAND_NAME, target: '/study/batches' });
  }
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
