export const DEFAULT_CONFIG = {
    inbounds: [
        {
            listen: '127.0.0.1',
            port: 10808,
            protocol: 'socks',
            settings: {
                udp: true
            },
            sniffing: {
                enabled: true,
                destOverride: ['http', 'tls']
            }
        }
    ],
    outbounds: [
        {
            protocol: 'vless',
            settings: {
                vnext: [
                    {
                        address: '',
                        port: 443,
                        users: [
                            {
                                id: 'user',
                                encryption: 'none',
                                flow: 'xtls-rprx-vision'
                            }
                        ]
                    }
                ]
            },
            streamSettings: {
                network: 'tcp',
                security: 'tls',
                tlsSettings: {
                    serverName: '',
                    allowInsecure: false,
                    fingerprint: 'chrome'
                }
            },
            tag: 'proxy'
        }
    ]
}
