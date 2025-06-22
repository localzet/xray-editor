import { Box, Code, Paper, Title, useMantineColorScheme } from '@mantine/core'
import { monacoTheme } from '@/shared/lib/monaco-theme'
import Editor, { Monaco } from '@monaco-editor/react'
import { useEffect, useRef, useState } from 'react'

import { ConfigEditorActionsFeature } from '@features/config/config-editor-actions/ui'
import { ConfigValidationFeature } from '@features/config/config-validation/ui'
import { MonacoSetupFeature } from '@features/config/monaco-setup/lib'

import { Props } from './interfaces'

export function ConfigEditorWidget(props: Props) {
    const { config, version } = props
    const [result, setResult] = useState('')
    const [isConfigValid, setIsConfigValid] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const { colorScheme } = useMantineColorScheme()

    const editorRef = useRef<unknown>(null)
    const monacoRef = useRef<unknown>(null)

    useEffect(() => {
        if (!monacoRef.current) return
        MonacoSetupFeature.setup(monacoRef.current as Monaco)
    }, [monacoRef.current])

    const handleEditorDidMount = (monaco: Monaco) => {
        monaco.editor.defineTheme('GithubDark', {
            ...monacoTheme
        })
    }

    return (
        <Box>
            <Paper mb="md" p={0} radius="xs" withBorder>
                <Editor
                    beforeMount={handleEditorDidMount}
                    defaultLanguage="json"
                    height="600px"
                    loading={'Загрузка редактора...'}
                    onChange={() =>
                        ConfigValidationFeature.validate(
                            editorRef,
                            monacoRef,
                            setResult,
                            setIsConfigValid,
                            version
                        )
                    }
                    onMount={(editor, monaco) => {
                        editorRef.current = editor
                        monacoRef.current = monaco
                        ConfigValidationFeature.validate(
                            editorRef,
                            monacoRef,
                            setResult,
                            setIsConfigValid,
                            version
                        )
                    }}
                    options={{
                        autoClosingBrackets: 'always',
                        autoClosingQuotes: 'always',
                        autoIndent: 'full',
                        automaticLayout: true,
                        bracketPairColorization: true,
                        detectIndentation: true,
                        folding: true,
                        foldingStrategy: 'indentation',
                        fontSize: 14,
                        formatOnPaste: true,
                        formatOnType: true,
                        guides: {
                            bracketPairs: true,
                            indentation: true
                        },
                        insertSpaces: true,
                        minimap: { enabled: true },
                        quickSuggestions: true,
                        scrollBeyondLastLine: false,
                        tabSize: 2
                    }}
                    theme={colorScheme === 'dark' ? 'GithubDark' : 'light'}
                    value={JSON.stringify(config, null, 2)}
                />
            </Paper>

            <ConfigEditorActionsFeature
                editorRef={editorRef}
                isConfigValid={isConfigValid}
                isSaving={isSaving}
                monacoRef={monacoRef}
                setIsSaving={setIsSaving}
                setResult={setResult}
            />

            {result && (
                <>
                    <Title mb="xs" order={4}>
                        Результат проверки
                    </Title>
                    <Code block p="md">
                        {result}
                    </Code>
                </>
            )}
        </Box>
    )
}
