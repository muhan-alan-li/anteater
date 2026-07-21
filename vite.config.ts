import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: 'auto',
            manifest: {
                name: 'Anteater - Student Loan Advisor',
                short_name: 'Anteater',
                description: 'Chatbot for Canadian federal and BC student loan guidelines',
                theme_color: '#2196F3',
                background_color: '#FFF',
                display: 'standalone',
                orientation: 'portrait-primary',
                scope: '/',
                start_url: '/',
                icons: [
                    { src: 'icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
                    { src: 'icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
                ]
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg}']
            },
            devOptions: { enabled: true }
        })
    ],
    resolve: {
        alias: {
            '@': '/src'
        }
    }
})
