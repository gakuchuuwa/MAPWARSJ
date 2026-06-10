import 'leaflet/dist/leaflet.css';
import '../style.css';
import { GameApp } from './app/GameApp';

if (import.meta.env.DEV) {
    import('./debug/perfEarly');
}

if (import.meta.env.PROD) {
    document.body.classList.add('mapwar-deploy');
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new GameApp();
    (window as any).gameApp = app;
    app.start();
});
