function runCodeInSandBox(code, whiteList) {
    whiteList = whiteList || {};

    const testCode = typeof code === "function" ? ("(" + code.toString() + ")()") : code;
    const runtimeCode = `with(__runtime__){return (${testCode})}`
    const global = new Proxy(whiteList, {
        has: () => true,
        get: (target, key) => key === Symbol.unscopables ? undefined : target[key],
    });

    const runtimeFunction = new Function("__runtime__", runtimeCode).bind(Object.create(null));
    return runtimeFunction(global);
};

async function main() {
    // 请求地图
    const mapHtmlSource = await fetch("https://view.dao3.fun/e/4259be98d16125235360")
        .then(v => v.text());

    // 抓取 webpack 模块加载器 js地址
    const webpackLoaderSourcePath = /<script src="(\/_next\/static\/chunks\/webpack-[^"]+\.js)" defer=""><\/script>/.exec(mapHtmlSource);
    if (!webpackLoaderSourcePath) throw Error("获取失败");

    // 获取加载器内容
    const webpackLoaderSourceURL = `https://view.dao3.fun` + webpackLoaderSourcePath[1];
    const webpackLoaderSource = await fetch(webpackLoaderSourceURL)
        .then(v => v.text());

    // 抓取js模块地址读取器
    const jsModulesPathGetter = /=(function\([^,]+\)\{return[^function]+static\/chunks\/.+\+"\.js"\})/.exec(webpackLoaderSource)
    if (!webpackLoaderSourcePath) throw Error("获取失败");

    const jsModulesPathGetterFunction = jsModulesPathGetter[1];

    // 获取所有模块的id
    const modulesID = jsModulesPathGetterFunction.match(/(?<!["\d])\b\d+\b(?!["\d])/g)
    const modulesIDFilter = modulesID.filter((v, i, a) => a.indexOf(v) == i);

    // 获取路径
    const modulesPaths = modulesIDFilter.map(id => {
        return runCodeInSandBox(`(${jsModulesPathGetterFunction})(_id)`, {
            _id: Number(id)
        })
    })

    // 全部加载一遍
    const modulesSource = [];
    for (let path of modulesPaths) {
        const result = await fetch(`https://view.dao3.fun/_next/` + path).then(v => v.text())
        modulesSource.push(result)
    }

    // 查找匹配的内容
    const matchReg = /this\.monacoController\.setLibs\(\[\{content:(.+?),filePath:"api\.d\.ts"\}\]\)/g
    const matchSource = modulesSource.find(v => matchReg.test(v));
    if (!matchSource) throw Error("获取失败");

    const matchContent = matchSource.match(matchReg).map(v => {
        const result = new RegExp(matchReg).exec(v);
        if (result) return result[1]
        else return "";
    });

    // 整理数据
    const result = [];
    for (let content of matchContent) {
        if (content.includes("serverDeclarations")) {
            // 获取serverdts
            const serverDeclarationsHash = /fetchDeclarations=function\(\)\{[^}]*this\._content\.retrieve\("(.+?)"\)[^}]*e\.serverDeclarations=[^}]*\}/.exec(matchSource);
            if (!serverDeclarationsHash) throw Error("获取失败");

            const serverDeclaration = await fetch("https://static.dao3.fun/block/" + serverDeclarationsHash[1]).then(v => v.text());

            result.push(serverDeclaration)
        } else {
            result.push(JSON.parse(content));
        }
    }

    return result;
}

main().then((result) => {
    const fs = require('node:fs');
    const path = require('node:path');

    const client = result.find(v => v.includes("ClientRemoteChannel"))
    const server = result.find(v => v.includes("ServerRemoteChannel"))

    const rootDir = __dirname || process.cwd();

    fs.writeFileSync(path.join(rootDir, 'ClientAPI.d.ts'), client);
    fs.writeFileSync(path.join(rootDir, 'GameAPI.d.ts'), server);
}, console.error)