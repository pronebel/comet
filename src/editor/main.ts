// register all node types!
import './nodeRegistry';
// styles
import './style/theme.css';
import './style/app.css';
import './style/dark-theme.css';
import './style/light-theme.css';

import App from './ui/App.svelte';

const target = document.getElementById('app') as HTMLElement;

const app = new App({
    target,
});

export default app;
