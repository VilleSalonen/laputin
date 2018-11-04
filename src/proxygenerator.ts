import child_process = require('child_process');
import fs = require('fs');
import path = require('path');

import { Library } from './library';
import { Query } from './query.model';
import { LaputinConfiguration } from './laputinconfiguration';

export class ProxyGenerator {
    constructor(private library: Library, private configuration: LaputinConfiguration) {
    }

    public async generateMissingProxies() {
        const files = await this.library.getFiles(new Query('', '', '', '', '', '', false));

        files.forEach(file => {
            const proxyPath = path.join(this.configuration.proxyDirectory, file.hash) + '.mp4';
            const incompleProxyPath = path.join(this.configuration.proxyDirectory, 'incomplete_' + file.hash) + '.mp4';

            const proxyExists = fs.existsSync(proxyPath);

            if (!proxyExists) {
                const command = 'ffmpeg -y ' +
                ' -i "' + file.path +
                '" -vcodec h264_nvenc -preset fast -vf "scale=w=min(iw\\,1280):h=-2" -b:a 128k ' +
                '"' + incompleProxyPath + '"';

                console.log('generating proxy for ' + file.path);
                child_process.execSync(command);

                fs.renameSync(incompleProxyPath, proxyPath);

                console.log('proxy generated for ' + file.path);
            }
        });
    }
}
