
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: [
  {
    "renderMode": 1,
    "route": "/"
  },
  {
    "renderMode": 1,
    "route": "/index"
  },
  {
    "renderMode": 1,
    "route": "/home"
  },
  {
    "renderMode": 1,
    "route": "/shop"
  },
  {
    "renderMode": 1,
    "route": "/register"
  },
  {
    "renderMode": 1,
    "route": "/product/*"
  },
  {
    "renderMode": 1,
    "route": "/cart"
  },
  {
    "renderMode": 1,
    "route": "/checkout"
  },
  {
    "renderMode": 1,
    "route": "/orderConfirmation/*"
  },
  {
    "renderMode": 1,
    "route": "/login"
  },
  {
    "renderMode": 1,
    "route": "/account"
  },
  {
    "renderMode": 1,
    "route": "/settings"
  },
  {
    "renderMode": 1,
    "route": "/about"
  },
  {
    "renderMode": 1,
    "route": "/contact"
  },
  {
    "renderMode": 1,
    "redirectTo": "/index",
    "route": "/**"
  }
],
  assets: {
    'index.csr.html': {size: 2615, hash: '55363cb4d9ed74e443e1c6fed57a60b66ccf93cb56d6dc0734da1e2a61a235a9', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1802, hash: 'abcf6e0cce35b0ed4563b3baaf3648c17e95b23b9c7915e155872ac91490f574', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-MEOOYSM6.css': {size: 64260, hash: 'XMCSHNLbazM', text: () => import('./assets-chunks/styles-MEOOYSM6_css.mjs').then(m => m.default)}
  },
};
