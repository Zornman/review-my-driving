"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const isLocal = process.env.FUNCTIONS_EMULATOR === 'true';
exports.environment = void 0;
exports.environment = {
    production: !isLocal,
    apiBaseUrl:  isLocal ? 'http://127.0.0.1:5001/review-my-driving/us-central1/{function}' : "https://{function}-fjxkvsc44a-uc.a.run.app",
    adminUserId: 'GwRYEmeJSqQGhU7HBZNl48lZCdS2',
    stripePublishableKey: isLocal ? 'pk_test_51Qmnk12KeQqbDqTp84aakGQdasoxAei93E0X8RQ0WcJvnhSmGISShHFzOyUJ3IbxYGIvK2kEDPPiNgiwdADPiBwS00kE1aqBwL' : 'pk_live_51Qmnk12KeQqbDqTpfy5fLW19Q5wVaHlWtYti2sY5J4k11Nve1CWpbw6vqy6GRXX1OSAsOwaK1N6YoquOPXMhMv5T00iMOb079H',
    stripeSecretKey: isLocal ? '"sk_test_51Qmnk12KeQqbDqTp1LmXaaEy5b60tEaSWG0G7Mw75vx8dHLiRCLikpSZ1TR6iPwBJgiRqtTB0HMCOSnLhZQI5SON00hsL7CqCa"' : "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",
    firebase: {
        privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCSHYT0hxo5PKWj\nhsm42YI8zHrmjA3AlT3PiLkUkC4S6MCrCPhHQwppOzwsP1VnWFixAH5b1d4b+H+s\npmPrt0E8hu/TRFBk5QFU5CxzafmyE38SMIHl0MfqHC/Udh4KmG+ALZ1qFTzbd4ZX\nGKr1Qo/Bw//x7Rtimt939fKFhmVQSnDgxC5y+kvwhqUKKpuB1eJIOGSCERlz2gpz\nqtHVUWtkSqkqSRW7zSHXsqf5xvoconuC9uTbSQQthr+CiUDQ2pz9F+Kg676PbnWl\nOa+OFhfRsdMWs0baQpgxzraTOvcimp1MbNv2J8/RLV11K9mU0ZkgmrPqd2BleDiQ\nCCFj/n9rAgMBAAECggEADU/5NBo3Dm3zHXIDYP8YOZfbvrOV8Sznw8fOLQxx1jE0\nlKCtljiKc0n9Un62tkK7We0UliNnKB886qsCQZChtfUJVrNLq9WdiHF9h0ppgIr8\nMdkPjLO38yF8Thww4oA+8Gu3gtnKgKhkKf1KXiwhUuMbp5wVuacooxJadUXoZyct\n4Wqll92PezDuvLNnOcpBpzm1Ynb38hsRhJaIlh3g9dfPqZn0SpJ0bS14xqjrRexe\nWxkuvRgdAD1iOvFQRDanKh1voQ0VD7zr1sGt+v7zlrWuJsHYPfC0pfkPjMrxdJZo\nIUtD0DpkHPIHMwtI19K2tkDlDNY/uYuWl3lCoYiUEQKBgQDChxJQGH/lFlAYyOYq\n55JFZd7is18WrbAQc4SVPa7hINGycmo/Yx36OAlXBMsVbNwSDjsQg/jDi+JUu1NT\nVOvIDolYZ5+ZR2libA6CprHJ+yEzPNq6lmtKy2Ah26nffptN50gpPnnDefZqnosI\nkCgrfmuQHOt3hqq+CLrmowKoWQKBgQDASfr312fzfUmhPGqkxZbE6GEcygHIE5f2\n17eSWufSLM1RYPtEbIuyuOshMJd8S6MSZue9Q1cxpz4DnA5jlD7yZWub0vhHi5b+\nOpqopt6ZI6QCZjcVuljBmiZ8zLmu63lXYekvPrlPNaNpz3KPdZxUKvf9sxScQ3UG\nH42fIWXtYwKBgDpTSXhegCpuEEH+KpT+rerE6plKct5X4YxtNnmQ7xhtQLKif5zV\n2S0nFBXVSBb6dtmrDqabC0GGdaw2Jnu74J4xTZkGKOJKeRybjZY66N/IvmGgg2yi\noTTh2ccNF9f9HA+1ovtK0jN8JBg/xSwiHQk9dH7XTPqflB46e9+fTLKxAoGBAKmd\nWFxgTNiSDm3ETkmT5T9Bv8/WPKYQ6n4ZoFrgBxb04BNFmb6shLmctgNrymQgj/K+\nhPIEwZgR7vjeIi8iaDgG0Fn+SXVKo2ETrrLPpxCsSJK5OSPYYUw9Pm/dYnjySvGS\nc09yY6GELeY6z9HNq5zu3huSaL7CHirNkG3q1u8DAoGAcWZcz8380AryJpVi8Odu\nn8JxvUeghUtoisxVZ5VFxQNB6XZiHgpVuWx5LCM25a+GUNufEikLThZw52QEpZgV\nhI+pre0xrYjkjPSozv34JONaOOo0zYivpZU/x5eeAZ1GdmwfoKNjSO6ZFF68vuVY\nl8EK7LGbowxI3gPwjq+syWU=\n-----END PRIVATE KEY-----\n"
    }
};
//# sourceMappingURL=environment.js.map