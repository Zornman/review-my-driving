
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: undefined,
  entryPointToBrowserMapping: {
  "node_modules/qrcode/lib/browser.js": [
    {
      "path": "chunk-TWOBDT7A.js",
      "dynamicImport": false
    }
  ],
  "src/app/shop/product-page/product-page.component.ts": [
    {
      "path": "chunk-A3K6QF6S.js",
      "dynamicImport": false
    }
  ],
  "src/app/order-confirmation/order-confirmation.component.ts": [
    {
      "path": "chunk-DOR3DZPH.js",
      "dynamicImport": false
    }
  ]
},
  assets: {
    'index.csr.html': {size: 3983, hash: 'f40acb31330e2cf1ef59fea1785f199f8f6f714ab2bda5da4f6e38f12443f90a', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 3015, hash: 'c196030185abaac00dc524fd454f75e407fd41d13c7584d8fbeefcaad7d21523', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-IE2MQNBH.css': {size: 101721, hash: 'R3UTQusmAQ0', text: () => import('./assets-chunks/styles-IE2MQNBH_css.mjs').then(m => m.default)}
  },
};
