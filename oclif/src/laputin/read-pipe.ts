export function readPipe(): Promise<string | undefined> {
    return new Promise((resolve) => {
        const stdin = process.openStdin();
        stdin.setEncoding('utf-8');

        if (stdin.isTTY) {
            resolve('');
        }

        let data = '';
        stdin.on('data', (chunk) => {
            data += chunk;
        });

        stdin.on('error', (error) => {
            console.log('Error when reading stdin: ', error);
        });

        stdin.on('end', () => {
            resolve(data);
        });
    });
}
