const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '..', 'dist');
const indexPath = path.join(distPath, 'index.html');
const manifestSrc = path.join(__dirname, '..', 'web', 'manifest.json');
const manifestDest = path.join(distPath, 'manifest.json');

// 1. Copy Manifest
if (fs.existsSync(manifestSrc)) {
    fs.copyFileSync(manifestSrc, manifestDest);
    console.log('✅ manifest.json copied to dist/');
}

// 2. Patch index.html
if (fs.existsSync(indexPath)) {
    let html = fs.readFileSync(indexPath, 'utf8');

    // Add PWA Meta Tags
    const pwaTags = `
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no" />
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="RouteMate">
    <meta name="theme-color" content="#0D0D0D">
    <link rel="manifest" href="/manifest.json">
    <link rel="apple-touch-icon" href="/favicon.ico">`;

    // Replace viewport and add tags
    html = html.replace(/<meta name="viewport"[^>]+>/, pwaTags);

    // Fix Background Colors
    html = html.replace(/html,\s*body\s*{[^}]+}/g, `html, body {
        height: 100% !important;
        background-color: #0D0D0D !important;
        margin: 0 !important;
        overscroll-behavior: none;
      }`);

    html = html.replace(/#root\s*{[^}]+}/g, `#root {
        display: flex;
        height: 100% !important;
        flex: 1;
        background-color: #0D0D0D !important;
      }`);

    fs.writeFileSync(indexPath, html);
    console.log('✅ index.html patched with PWA tags and dark background');
}
