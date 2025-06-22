import { ActionIcon, Group, Text, Title } from '@mantine/core'
import { StickyHeader } from '@/shared/ui/sticky-header'
import { PiGithubLogo, PiStar } from 'react-icons/pi'

import classes from './header.module.css'

export function HeaderWidget() {
    return (
        <StickyHeader className={classes.root} px="md">
            <Group h="100%" justify="space-between">
                <Title order={3}>Xray Config Editor</Title>
            </Group>
        </StickyHeader>
    )
}
