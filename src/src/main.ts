import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';

// Remove the initial loader
const initialLoader = document.querySelector('.initial-loader');
if (initialLoader) {
  initialLoader.remove();
}

const app = mount(App, {
  target: document.getElementById('app')!,
});

export default app;