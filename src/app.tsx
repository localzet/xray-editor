import '@mantine/core/styles.layer.css'
import '@mantine/nprogress/styles.layer.css'

import './global.css'

import { NavigationProgress } from '@mantine/nprogress'
import { MantineProvider } from '@mantine/core'

import { ConfigPageConnector } from '@pages/config/ui/connectors/config.page.connector'

import { theme } from './shared/theme'

export function App() {
    return (
        <MantineProvider defaultColorScheme="dark" theme={theme}>
            <NavigationProgress />
            <ConfigPageConnector />
        </MantineProvider>
    )
}
