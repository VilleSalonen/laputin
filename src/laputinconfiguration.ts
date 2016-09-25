import fs = require("fs");

export class LaputinConfiguration {
	public fileOpener: String = "vlc";
	public identification: String = "quick";
	public monitoring: Boolean = true;
	public gitVersioning: Boolean = true;
	public port: number = 33333;
	public ignoredExtensions: Array<String> = ["db"];
		
	// {"fileOpener":"vlc","identification":"quick","monitoring":"true","gitVersioning":"true","port":"33333", "ignoredExtensions": ["jpg", "mp3"]}
	
    constructor(private _configFilePath: string) {
		if(!fs.existsSync(_configFilePath)) {
			return;
		}
		
		var _contents = JSON.parse(fs.readFileSync(_configFilePath, "utf8"));
		this.fileOpener = _contents['fileOpener'];
		this.identification = _contents['identification'];
		this.monitoring = _contents['monitoring'];
		this.gitVersioning = _contents['gitVersioning'];
		this.port = _contents['port'];
		this.ignoredExtensions = _contents['ignoredExtensions'];
    }
	
	
	
}