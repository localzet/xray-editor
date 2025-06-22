declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Go: typeof window.Go
        onWasmInitialized?: () => void
        XrayGetVersion?: () => string

        XrayParseConfig: (config: string) => null | string
    }
}

export {}
