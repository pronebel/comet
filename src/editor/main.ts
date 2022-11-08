// register all node types!
import './core/nodeRegistry';
// styles
import './style/app.css';
import './style/theme.css';
import './style/dark-theme.css';
import './style/light-theme.css';

import { Application } from './application';

// eslint-disable-next-line no-new
new Application({});

import App from './views/App.svelte';

const target = document.getElementById('app') as HTMLElement;

const app = new App({
    target,
});

export default app;

