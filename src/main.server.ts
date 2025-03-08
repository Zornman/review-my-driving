import { CommonEngine } from '@angular/ssr/node';
import { join } from 'path';

const distFolder = join(process.cwd(), 'dist/review-my-driving/browser');
const indexHtml = join(distFolder, 'index.html');
const commonEngine = new CommonEngine();

export default async function render({ url }: { url: string }): Promise<string> {
    return commonEngine.render({
        documentFilePath: indexHtml,
        url
    });
}