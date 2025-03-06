import { render } from '@netlify/angular-runtime/common-engine';

export default async function handler(request: Request) {
    try {
        const html = await render({ url: request.url }); // ✅ Pass the request URL to the render function
        return new Response(html.body, {
            headers: { 'Content-Type': 'text/html' },
        });
    } catch (error) {
        console.error('❌ SSR Error:', error);
        return new Response('<h1>Internal Server Error</h1>', { status: 500 });
    }
}
