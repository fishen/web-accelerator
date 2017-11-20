
function Package(lib, version, name) {
    this.name = name;
    this.version = version;
    this.lib = lib;
}
var CDNS = function () {
    this.format = function (package, urlFormat) {
        if (!package) return null;
        urlFormat = urlFormat || this.cdns[0].urlFormat;
        return urlFormat.replace('${name}', package.name).replace('${version}', package.version).replace("${lib}", package.lib);;
    }
    this.formats = function (package) {
        if (!package) return null;
        return this.cdns.map(m => this.format(package, m.urlFormat));
    }
    this.list = [
        { name: 'BootCDN', urlFormat: 'https://cdn.bootcss.com/${lib}/${version}/${name}' },
        { name: 'CDNJS', urlFormat: 'https://cdnjs.cloudflare.com/ajax/libs/${lib}/${version}/${name}' },
        { name: 'StaticFile', urlFormat: 'https://cdn.staticfile.org/${lib}/${version}/${name}' },
        { name: 'JsDelivr', urlFormat: 'https://cdn.jsdelivr.net/${lib}/${version}/${name}' },
    ];
    this.cdns = [];
    this.selectCDN = function () {
        this.cdns.length = 0;
        var package = new Package('jquery', '2.0.0', 'jquery.min.js');
        this.list.map(cdn => {
            var url = this.format(package, cdn.urlFormat);
            fetch(url, { method: 'HEAD', cache: 'no-cache' })
                .then(res => {
                    if (res.ok) {
                        this.cdns.push(cdn);
                        console.log(`CDN '${cdn.name}' set priority to '${this.cdns.length}'!`);
                    }
                })
        });
    }
    this.selectCDN();
}