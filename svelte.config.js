import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			// Railway uses PORT env var
			envPrefix: ''
		})
	}
};

export default config;
