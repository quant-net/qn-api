/**
 * Entry point for esbuild bundling.
 *
 * Imports the App class and exposes it on `window` so the
 * inline <script> in main.html can instantiate it:
 *
 *   <script>
 *       const app = new App({{ data | tojson }});
 *   </script>
 */
import { App } from './app.js';

window.App = App;
