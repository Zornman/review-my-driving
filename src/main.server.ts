import { CommonEngine } from '@angular/ssr/node';
import { join } from 'path';

const distFolder = join(process.cwd(), 'dist/review-my-driving/browser');
const indexHtml = join(distFolder, 'index.html');
const commonEngine = new CommonEngine();

export default async function render(params: { url?: string } = {}): Promise<string> {
    const { url = '/' } = params; // ✅ Ensure URL is always defined
    return commonEngine.render({
        documentFilePath: indexHtml,
        url
    });
}