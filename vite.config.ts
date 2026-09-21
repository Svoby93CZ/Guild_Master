import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    // Na GitHub Pages hra běží v podadresáři podle názvu repozitáře, jinde
    // v kořeni. Cestu nastavuje proměnná BASE_PATH (viz .github/workflows/
    // deploy.yml); bez ní se staví pro kořen, takže `npm run dev` i hosting
    // typu Netlify fungují beze změny.
    base: process.env.BASE_PATH || '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
