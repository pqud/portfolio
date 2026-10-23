import { copyFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// shortcut: base is '/'. Set base to '/<repo>/' when the site is a GitHub project page, not a user page.
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'pages-404',
      closeBundle() {
        copyFileSync('dist/index.html', 'dist/404.html')
      },
    },
  ],
})
