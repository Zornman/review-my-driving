import { Handler } from '@netlify/functions';
import {
  AngularNodeAppEngine,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';

const angularApp = new AngularNodeAppEngine();

const handler = async (event, context) => {
  try {
    const req = {
      url: event.path,
      method: event.httpMethod,
      headers: event.headers,
      body: event.body,
    };

    const response = await angularApp.handle(req);

    if (!response) {
      return { statusCode: 404, body: 'Not Found' };
    }

    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.body,
    };
  } catch (error) {
    console.error('SSR Error:', error);
    return {
      statusCode: 500,
      body: 'Internal Server Error',
    };
  }
};

export { handler };