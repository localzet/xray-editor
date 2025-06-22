import { PiCheckSquareOffset } from 'react-icons/pi'
import { Button, Group } from '@mantine/core'

import { ChangeColorTheme } from '@features/config/change-color-theme/ui/change-color-theme'

import { Props } from './interfaces'

export function ConfigEditorActionsFeature(props: Props) {
    const { editorRef } = props

    const formatDocument = () => {
        if (!editorRef.current) return
        if (typeof editorRef.current !== 'object') return
        if (!('getAction' in editorRef.current)) return
        if (typeof editorRef.current.getAction !== 'function') return

        editorRef.current.getAction('editor.action.formatDocument').run()
    }

    return (
        <Group gap="xs" justify="space-between" mb="md">
            <Button
                leftSection={<PiCheckSquareOffset size={'1.4rem'} />}
                onClick={formatDocument}
                size="sm"
                variant="outline"
            >
                Форматировать
            </Button>
            <ChangeColorTheme />
        </Group>
    )
}
