function ResolveResult(name, oldUrl, newUrl) {
    this.name = name;
    this.oldUrl = oldUrl;
    this.newUrl = newUrl;
}
function URLResolver() {
    this.cdns = new CDNS();
    this.getSuffix = function (url) {
        var matches = /\.(min\.)*(js|css)/.exec(url);
        return matches && matches.length > 0 && matches[0];
    };
    this.regex = {
        'lib': '[a-z\\.\\-]+',
        'version': '\\d+(\\.\\d+){0,2}',
        'name': '.+'
    };
    var self = this;
    this.strategies = {
        '/(${lib})/(${version})/(${name})': function (matches, url) {
            return new Package(matches[1], matches[2], matches[4]);
        },
        '/(${lib})(\\-|@)(${version})': function (matches, url) {
            var package = new Package(matches[1], matches[3], matches[1]);
            var suffix = self.getSuffix(url);
            package.name += suffix;
            return package;
        },
        '/(((js|css)/)?(${lib}?)\\.(min.)?(js|css))\\?v=(${version})': function (matches, url) {
            return new Package(matches[4], matches[7], matches[1]);
        }
    };
    this.resolve = function (url) {
        if (!url) return null;
        var keys = Object.keys(this.strategies);
        for (var i = 0, length = keys.length; i < length; i++) {
            var callback = this.strategies[keys[i]];
            var key = keys[i].replace('${lib}', this.regex.lib)
                .replace('${version}', this.regex.version)
                .replace('${name}', this.regex.name);
            var matches = url.match(key);
            if (matches) {
                var package = callback(matches, url);
                var newUrl = this.cdns.format(package);
                var result = new ResolveResult(package.name, url, newUrl);
                return result;
            }
        };
        return null;
    }
}