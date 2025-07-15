import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
// import react from '@vitejs/plugin-react';
import { createLogger, defineConfig } from 'vite';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

const configHorizonsViteErrorHandler = `
const observer = new MutationObserver((mutations) => {
	for (const mutation of mutations) {
		for (const addedNode of mutation.addedNodes) {
			if (
				addedNode.nodeType === Node.ELEMENT_NODE &&
				(
					addedNode.tagName?.toLowerCase() === 'vite-error-overlay' ||
					addedNode.classList?.contains('backdrop')
				)
			) {
				handleViteOverlay(addedNode);
			}
		}
	}
});

observer.observe(document.documentElement, {
	childList: true,
	subtree: true
});

function handleViteOverlay(node) {
	if (!node.shadowRoot) {
		return;
	}

	const backdrop = node.shadowRoot.querySelector('.backdrop');

	if (backdrop) {
		const overlayHtml = backdrop.outerHTML;
		const parser = new DOMParser();
		const doc = parser.parseFromString(overlayHtml, 'text/html');
		const messageBodyElement = doc.querySelector('.message-body');
		const fileElement = doc.querySelector('.file');
		const messageText = messageBodyElement ? messageBodyElement.textContent.trim() : '';
		const fileText = fileElement ? fileElement.textContent.trim() : '';
		const error = messageText + (fileText ? ' File:' + fileText : '');

		window.parent.postMessage({
			type: 'horizons-vite-error',
			error,
		}, '*');
	}
}
`;

const configHorizonsRuntimeErrorHandler = `
window.onerror = (message, source, lineno, colno, errorObj) => {
	const errorDetails = errorObj ? JSON.stringify({
		name: errorObj.name,
		message: errorObj.message,
		stack: errorObj.stack,
		source,
		lineno,
		colno,
	}) : null;

	window.parent.postMessage({
		type: 'horizons-runtime-error',
		message,
		error: errorDetails
	}, '*');
};
`;

const configHorizonsConsoleErrroHandler = `
const originalConsoleError = console.error;
console.error = function(...args) {
	originalConsoleError.apply(console, args);

	let errorString = '';

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (arg instanceof Error) {
			errorString = arg.stack || \`\${arg.name}: \${arg.message}\`;
			break;
		}
	}

	if (!errorString) {
		errorString = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
	}

	window.parent.postMessage({
		type: 'horizons-console-error',
		error: errorString
	}, '*');
};
`;

const configWindowFetchMonkeyPatch = `
const originalFetch = window.fetch;

window.fetch = function(...args) {
	const url = args[0] instanceof Request ? args[0].url : args[0];

	// Skip WebSocket URLs
	if (url.startsWith('ws:') || url.startsWith('wss:')) {
		return originalFetch.apply(this, args);
	}

	return originalFetch.apply(this, args)
		.then(async response => {
			const contentType = response.headers.get('Content-Type') || '';

			// Exclude HTML document responses
			const isDocumentResponse =
				contentType.includes('text/html') ||
				contentType.includes('application/xhtml+xml');

			if (!response.ok && !isDocumentResponse) {
					const responseClone = response.clone();
					const errorFromRes = await responseClone.text();
					const requestUrl = response.url;
					console.error(\`Fetch error from \${requestUrl}: \${errorFromRes}\`);
			}

			return response;
		})
		.catch(error => {
			if (!url.match(/\.html?$/i)) {
				console.error(error);
			}

			throw error;
		});
};
`;

const addTransformIndexHtml = {
	name: 'add-transform-index-html',
	transformIndexHtml(html) {
		return {
			html,
			tags: [
				{
					tag: 'script',
					attrs: { type: 'module' },
					children: configHorizonsRuntimeErrorHandler,
					injectTo: 'head',
				},
				{
					tag: 'script',
					attrs: { type: 'module' },
					children: configHorizonsViteErrorHandler,
					injectTo: 'head',
				},
				{
					tag: 'script',
					attrs: {type: 'module'},
					children: configHorizonsConsoleErrroHandler,
					injectTo: 'head',
				},
				{
					tag: 'script',
					attrs: { type: 'module' },
					children: configWindowFetchMonkeyPatch,
					injectTo: 'head',
				},
			],
		};
	},
};

console.warn = () => {};

const logger = createLogger()
const loggerError = logger.error

logger.error = (msg, options) => {
	if (options?.error?.toString().includes('CssSyntaxError: [postcss]')) {
		return;
	}

	loggerError(msg, options);
}

export default defineConfig({
	customLogger: logger,
	plugins: [
		addTransformIndexHtml,
		VitePWA({
			registerType: 'autoUpdate',
			includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
			manifest: {
				name: 'Deacon: Church Command Center',
				short_name: 'Deacon',
				description: 'Comprehensive church management system built by someone who understands ministry needs.',
				theme_color: '#3b82f6',
				background_color: '#3b82f6',
				display: 'standalone',
				orientation: 'portrait-primary',
				scope: '/',
				start_url: '/',
				icons: [
					{
						src: 'android-chrome-192x192.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'maskable any'
					},
					{
						src: 'android-chrome-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable any'
					},
					{
						src: 'apple-touch-icon.png',
						sizes: '180x180',
						type: 'image/png'
					},
					{
						src: 'favicon-32x32.png',
						sizes: '32x32',
						type: 'image/png'
					},
					{
						src: 'favicon-16x16.png',
						sizes: '16x16',
						type: 'image/png'
					}
				],
				shortcuts: [
					{
						name: 'Dashboard',
						short_name: 'Dashboard',
						description: 'View church dashboard',
						url: '/dashboard',
						icons: [{ src: 'favicon-32x32.png', sizes: '32x32' }]
					},
					{
						name: 'People',
						short_name: 'People',
						description: 'Manage church members',
						url: '/people',
						icons: [{ src: 'favicon-32x32.png', sizes: '32x32' }]
					},
					{
						name: 'Events',
						short_name: 'Events',
						description: 'Manage church events',
						url: '/events',
						icons: [{ src: 'favicon-32x32.png', sizes: '32x32' }]
					}
				]
			}
		})
	],
	server: {
		cors: true,
		headers: {
			'Cross-Origin-Embedder-Policy': 'credentialless',
		},
		allowedHosts: true,
		host: '0.0.0.0',
		port: 5173,
		proxy: {
			'/api': {
				target: process.env.VITE_API_URL || 'http://localhost:3001',
				changeOrigin: true,
				secure: false,
			}
		}
	},
	resolve: {
		extensions: ['.jsx', '.js', '.tsx', '.ts', '.json', ],
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
	build: {
		outDir: 'dist',
		sourcemap: true,
	},
});
