
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: undefined,
  entryPointToBrowserMapping: {
  "../../../My Documents/Review My Driving/review-my-driving/node_modules/qrcode/lib/browser.js": [
    {
      "path": "../../../My Documents/Review My Driving/review-my-driving/chunk-6YGRSBBZ.js",
      "dynamicImport": false
    },
    {
      "path": "../../../My Documents/Review My Driving/review-my-driving/chunk-25N2FLV6.js",
      "dynamicImport": false
    }
  ],
  "../../../My Documents/Review My Driving/review-my-driving/src/app/shop/product-page/product-page.component.ts": [
    {
      "path": "../../../My Documents/Review My Driving/review-my-driving/chunk-QZVR45VL.js",
      "dynamicImport": false
    },
    {
      "path": "../../../My Documents/Review My Driving/review-my-driving/chunk-2ABACWFA.js",
      "dynamicImport": false
    },
    {
      "path": "../../../My Documents/Review My Driving/review-my-driving/chunk-EDUGDP7J.js",
      "dynamicImport": false
    },
    {
      "path": "../../../My Documents/Review My Driving/review-my-driving/chunk-25N2FLV6.js",
      "dynamicImport": false
    }
  ],
  "../../../My Documents/Review My Driving/review-my-driving/src/app/order-confirmation/order-confirmation.component.ts": [
    {
      "path": "../../../My Documents/Review My Driving/review-my-driving/chunk-JXCXRYF5.js",
      "dynamicImport": false
    },
    {
      "path": "../../../My Documents/Review My Driving/review-my-driving/chunk-EXHOAULC.js",
      "dynamicImport": false
    },
    {
      "path": "../../../My Documents/Review My Driving/review-my-driving/chunk-EDUGDP7J.js",
      "dynamicImport": false
    },
    {
      "path": "../../../My Documents/Review My Driving/review-my-driving/chunk-25N2FLV6.js",
      "dynamicImport": false
    }
  ]
},
  assets: {
    'index.csr.html': {size: 2135, hash: '9f29ac1362301abbc3cc830ea58c2778a83206e5a4c69aadfde9f04a800feea7', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 2648, hash: '47c6ffa3f14cf91645c17001e7d572f8f70037dc9b0aface43f2ac3a47f3666d', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-IE2MQNBH.css': {size: 101721, hash: 'R3UTQusmAQ0', text: () => import('./assets-chunks/styles-IE2MQNBH_css.mjs').then(m => m.default)}
  },
};
