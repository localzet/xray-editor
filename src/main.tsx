import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'

import { App } from './app'

const container = document.getElementById('root')
if (!container) throw new Error('Не удалось найти корневой элемент')

const root = createRoot(container)
root.render(
    <StrictMode>
        <App />
    </StrictMode>
)
