import { fetchWithProgress } from '@/shared/utils/fetch-with-progress'
import { useEffect, useState } from 'react'
import { consola } from 'consola/browser'

import { LoadingScreen } from '@/shared/ui/loading-screen'
import { DEFAULT_CONFIG } from '@/shared/constants'

import { ConfigPageComponent } from '../components/config.page.component'

export function ConfigPageConnector() {
    const [downloadProgress, setDownloadProgress] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [version, setVersion] = useState<string>('')

    const config = DEFAULT_CONFIG
    useEffect(() => {
        const initWasm = async () => {
            try {
                const go = new window.Go()
                const wasmInitialized = new Promise<void>((resolve) => {
                    window.onWasmInitialized = () => {
                        consola.info('WASM-модуль инициализирован')
                        resolve()
                    }
                })

                const wasmBytes = await fetchWithProgress('main.wasm', setDownloadProgress)

                const { instance } = await WebAssembly.instantiate(wasmBytes, go.importObject)
                go.run(instance)
                await wasmInitialized

                if (typeof window.XrayParseConfig === 'function') {
                    setIsLoading(false)
                } else {
                    throw new Error('XrayParseConfig не инициализирован')
                }

                if (typeof window.XrayGetVersion === 'function') {
                    const xrayVersion = window.XrayGetVersion()
                    setVersion(xrayVersion)
                }
            } catch (err: unknown) {
                consola.error('Ошибка инициализации WASM:', err)
                setIsLoading(false)
            }
        }

        initWasm()
        return () => {
            delete window.onWasmInitialized
        }
    }, [])

    if (isLoading) {
        return <LoadingScreen text={'Загрузка модуля WASM...'} value={downloadProgress} />
    }

    return <ConfigPageComponent config={config} version={version} />
}
