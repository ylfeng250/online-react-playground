体验一下
背景
在我们工作或学习中经常遇到要尝试使用一个新的组件库或工具库，例如需要上手学习一下react的状态管理库Valtio，或者我想上手体验一下antd5.0的组件库，尝试用图表组件库写个demo，都需要我们在本地用脚手架创建一个项目，安装依赖包，启动命令运行，再写代码尝试。
大家应该都看过react官网 ，它的教程中有个实时代码编辑功能，左边编写代码右边可以实时预览效果，可以帮助我们学习react并动手练习。

react官方文档用的是codesandbox提供的组件，不能添加文件，多个组件就只能都写在App.js中，css也只能写行内样式，不能添加css文件，也不能添加第三方库。
虽然codesandbox和stackblitz 这种网站可以创建react项目，但是毕竟是国外的站点，网络不太行，打开启动慢，最重要的是不能本地部署，也不能使用公司内部的包。

这里吐槽一下react官方居然没有推出playground！！！，隔壁vue早就出了个很好用的 Vue SFC Playground，使用vue的同学应该都用过，效果非常棒。可以自定义vue文件，插入第三方依赖包，一键分享代码等。对于vue的学习非常方便。react用户表示超级想要！！！


去github上搜了一圈也没发现有合适的，基本都不支持新增文件、引入第三方依赖包和分享，而且我对codesandbox和 Vue SFC Playground的功能实现原理很感兴趣，所以我就参考 Vue SFC Playground 的功能和界面实现了一个React Playground。截图如下

ahooks示例
ant-design-charts示例
antd示例
下面介绍一下原理以及如何实现的。
核心功能
编辑器
目前开源市场上面使用最多的代码编辑器主要是： Monaco Editor、Ace 和 Code Mirror，这里不做比较，感兴趣的同学可以去网上查看相关对比的文章。
Monaco Editor 生态丰富，功能强大，还是VSCode 同款编辑器，所以选择了 Monaco Editor。为了使用方便，还找了个封装后的包 @monaco-editor/react 。
编辑器对于我们的核心功能来说不是重点，仅仅是提供输入代码的高级文本框，编辑器的重点主要是交互和编码体验，这部分都放到了下一段「其他功能」里，这里就不做叙述。
代码实时运行
在当前项目中我们有很多全局样式全局变量，会影响到编辑的实时代码的运行效果，所以我们需要一个干净的环境去运行代码，这跟微前端的实现原理差不多，我们这里选择iframe，没有复杂的通信、状态管理和路由管理，iframe显然是最合适的。我们只需要把代码通过postMessage发送到iframe里并执行即可。
// Preview.tsx
useEffect(() => {
    // 把编译后的代码发送给iframe
    if (code) iframeRef.current?.contentWindow?.postMessage(code)
  }, [code])
  
 <iframe
    ref={iframeRef}
    src={iframeUrl}
    sandbox='allow-popups-to-escape-sandbox allow-scripts allow-popups allow-forms allow-pointer-lock allow-top-navigation allow-modals allow-same-origin'
  />
让浏览器运行jsx代码
浏览器中并不支持jsx，要运行jsx代码肯定需要编译，浏览器中又没有node环境，但babel提供了一个js版的解析器 @babel/standalone ，可以使用@babel/standalone来编译jsx代码。（后续会替换成esbuild-wasm）
import { transform } from '@babel/standalone'

const babelTransform = (code: string) => {
  return transform(code, {
    presets: ['react'],
  }).code
}

const compliedCode = babelTransform(jsxCode)
我们如果把代码编译的任务交给主线程去运行 ,那么它有可能会导致页面的阻塞，编辑时会感觉到卡顿，所以我们引入web worker 新开个线程来帮助我们处理「编译代码」这个计算量最大的任务。
伪代码流程如下：
// compiler.worker.ts
self.addEventListener('message', async ({ data }) => {
   // 2. 接收到源代码后编译
   const compiledCode = babelTransform(jsxCode)
   //3. 编译完成后，发送数据给index.tsx
  self.postMessage(compiledCode)
})

// index.tsx
useEffect(()=>{
  // 1. 源代码变更后，发送给worker去编译
  compilerRef.current?.postMessage(jsxCode)
},[jsxCode])

compilerRef.current = new CompilerWorker()
compilerRef.current.addEventListener('message', ({ data }) => {
  // 4. 接收到web worker编译后的代码，发送到iframe中
  iframeRef.current?.contentWindow?.postMessage(data)
})

// iframe.html
window.addEventListener('message', ({data}) => {
  // 6. 接收到编译后的代码执行
  // 代码插入script标签中或者转为临时文件地址赋值给script标签
})
支持本地模块引入
浏览器中是没有文件系统的，也就是说浏览器无法解析'../folderA/A'去找到A模块，有小伙伴会问：HTML代码中不是有<script src='../../A'></script>，这怎么可以执行的？是有，但是这种其实是浏览器会去发http请求去服务器上请求'http://xxx/A'对应的文件，然后执行。
而我们本地编辑的代码中的 import a from './A' 在浏览器中是运行不了，我们平时开发项目的时候虽然一直在用这种模块引入语法，可能从未注意过这种代码编译成了啥？为何在浏览器中可以执行？异步模块，按需加载是如何实现的？
在本地项目中 import a from './A' 和 const a = require('./A') 分别是ESM模块和commonjs规范下引入模块的语法。
在本地项目中，Node.js 提供了一个文件系统模块，它允许你在服务器端环境中访问和操作本地文件系统。因此，当你使用 import a from './A' 或者 const a = require('./A') 这样的语句时， Webpack 或 Vite 可以通过文件系统模块来解析相对路径，并找到对应的模块文件。打包到一个文件中或独立文件中。
但浏览器是一个执行 JavaScript 代码的环境，并不会自动解析和加载'./A' 对应的文件模块。所以在浏览器中我们就需要自己解析import a from './A'对应模块。
浏览器(绝大部分)原生支持esm模块，支持的是URL文件，所以我们可以把'./A' 替换成url地址，浏览器就可以使用了。
import a from './A'
// -->
import a from 'http://xxx/A'
但是我们没有服务端，没办法依赖服务端提供文件服务，如何在浏览器中完成？
答案是通过URL.createObjectURL生成临时URL文件，浏览器去请求临时文件地址。
// 把代码编译后转换成url文件
const A = URL.createObjectURL(
  new Blob([babelTransform('compiledCode')], {
    type: 'application/javascript'
  })
)
// 转换后的地址
// blob:https://localhost:3000/e4ef352f-1c5f-414e-8009-33514b300842

// 替换 './A'
import a from 'blob:https://localhost:3000/e4ef352f-1c5f-414e-8009-33514b300842'
babel提供了插件的功能，我们可以通过实现一个babel插件来完成找到对应模块代码并在编译代码时替换本地模块名
插件代码不贴了，感兴趣可以去github上查看，这样就可以在浏览器中运行了。
由于我们没有设计文件夹，所以不涉及到多文件路径解析，只有一层简单很多。也可以扩展文件夹功能实现近乎完整的本地项目开发体验。
支持第三方模块包引入
跟本地模块引入类似，因为浏览器原生支持ESM，所以我们选择使用ESM格式的第三方依赖包，在jsdelivr 或者 esm.sh 等网站中可以找到各个包的esm格式文件地址，例如：esm.sh/react
// react的esm格式文件
https://cdn.jsdelivr.net/npm/react@18.2.0/+esm
https://esm.sh/react@18.2.0
然后通过importmap映射模块地址，我们实时编写的代码中就可以使用import React from 'react';
<script type="importmap">
{
  "imports": {
    "react": "https://esm.sh/react@18.2.0",
    "react-dom/client": "https://esm.sh/react-dom@18.2.0"
  }
}
</script>
<script type="module">
import React from 'react';
// ...
</script>
我们只需要把用户配置的importmap发送到iframe中插入即可实现用户自定义引入第三方模块。
注意：有些第三方模块提供了子包，可按需引入，官方文档一般都有写，例如ant-design-charts提供了
统计图表：@ant-design/plots
地图：@ant-design/maps
流程图：@ant-design/flowchart
关系图：@ant-design/graphs
可按需引入 esm.sh/@ant-design…
importmap更新
这里还有一个问题，importmap是无法动态更新的。
例如：用js动态新增了一条lodash的映射，浏览器是不会重新解析的，只在初始化加载的时候执行一次
<script type="importmap">
{
  "imports": {
    "react": "https://esm.sh/react@18.2.0",
    "react-dom/client": "https://esm.sh/react-dom@18.2.0",
+   "lodash": "https://esm.sh/lodash@4.17.21"
  }
}
</script>
这个时候我们编写的代码中使用到lodash是无法获取这个包的。如何解决？
既然是只能在加载页面初始化的时候执行一次，那每次变更importmap都重载页面（重新生成iframe页）就行了，由于我们的iframe页面是本地生成URL文件所以加载几乎无感。最后还需要添加一步消息通知，当重载完页面通知主线程重新发送编译后的代码过来加载执行。
支持自定义样式文件
对于代码中的import './style.css' 如何处理，参考webpack和vite都是把css转成javascript模块，插入到head标签中。
const css = '#root{color:red}'
const js = `
  (() => {
    let stylesheet = document.getElementById('style');
    if (!stylesheet) {
      stylesheet = document.createElement('style')
      stylesheet.setAttribute('id', 'style')
      document.head.appendChild(stylesheet)
    }
    const styles = document.createTextNode(`${css}`)
    stylesheet.innerHTML = ''
    stylesheet.appendChild(styles)
  })()
  `
这其中还有个小问题，每次执行js代码插入，越插越多，页面可能会变卡，所以第一时间想到的解决办法是插入前先移除。
但是又出现了一个新问题，样式移除的时候页面会闪烁一下。例如页面是黑色背景，在把css移除的那一瞬间会出现页面原本的白色，然后插入新css，就会闪烁一下。
所以改成先插入后移除，等新css转换后的js模块加载并执行完成后，再移除旧css，结果样式变更就很丝滑不会闪烁了。
到这里我们就完成了react playground的核心功能，但离良好的使用体验还差一些，接下来就来优化使用体验。
其他功能
JSX代码高亮
对于代码编辑器来说，语法高亮是必不可缺的，monaco本身就支持大量语言的语法高亮，但monaco编辑器不支持jsx语法高亮，是的，不支持！！！

这是掘金的码上掘金，可以看到jsx代码没有高亮，看着难受！也不太方便，F12查看monaco生成的html代码确实没识别jsx语法。

这么难受的问题肯定有大佬解决，在网上一顿搜索之后，最终我找到一个库monaco-jsx-syntax-highlight，是其中使用较为简单的一种方式。
原理就是新开一个worker去解析jsx代码语法，给monaco生成的html标签加上类名标记，然后自定义样式去改标签颜色来实现jsx语法高亮。

可以看到解决之后编辑器渲染的html标签中对jsx的标签、属性和括号添加了类名。
代码提示
这部分是monaco官方api提供的功能，需要在初始化编辑器的时候手动加载ts类型定义文件，利用vite的api读取文件
// 加载react类型定义文件
const initExtraLibs = (monaco) => {
const types = import.meta.glob(
  [
    '/node_modules/{react,react-dom}/**/*.{d.ts,json}',
    '/node_modules/@types/{react,react-dom}/**/*.{d.ts,json}'
  ],
  { eager: true, as: 'raw' }
)

Object.keys(types).forEach(path => {
  monaco.languages.typescript.typescriptDefaults.addExtraLib(types[path], `file://${path}`)
  monaco.languages.typescript.javascriptDefaults.addExtraLib(types[path], `file://${path}`)
})
}
目前已经实现了自动加载第三方依赖库的ts类型提示，可以自动从CDN www.jsdelivr.com/ 拉取ts类型文件注入到编辑器中，拥有较好的编码提示体验
代码跳转
monaco官方api 提供了doOpenEditor来获取点击信息，但我们自己实现了多标签和Model，所以需要自己实现跳转文件和光标聚焦代码行数
// 覆盖原点击变量跳转方法
editor._codeEditorService.doOpenEditor = function (editor, input) {
  const path = input.resource.path
  setSelectedFileName(path)
  customDoOpenEditor(editor, input)
}

const customDoOpenEditor = (editor, input) => {
    const selection = input.options ? input.options.selection : null
    if (selection) {
      if (typeof selection.endLineNumber === 'number' && typeof selection.endColumn === 'number') {
        editor.setSelection(selection)
        editor.revealRangeInCenter(selection, 1 /* Immediate */)
      } else {
        const pos = {
          lineNumber: selection.startLineNumber,
          column: selection.startColumn
        }
        editor.setPosition(pos)
        editor.revealPositionInCenter(pos, 1 /* Immediate */)
      }
    }
  }
代码分享
因为我们没有服务端存储，所以我们分享代码时只能把数据放到url上，大家可能都知道url有最大长度的限制（不同浏览器限制不同几千几万都有），所以一般不会把大量数据存储到url上。但是其中hash部分的长度却基本没有限制（hash数据不会发送到服务端），所以把代码放到url中的hash上正好合适。
为了减少代码长度选择使用fflate压缩库把代码文本压缩。压缩后如下：
eNqNUktu2zAQvQrBjSTUEeOuCsM22qYF2kVaIFlWXbAUbTOlSIEfI4WgA/QEPUMvkdsEuUZmKFtRggQIoMXovRnyvTfsaMOVKa/8NV101PBG0sUDNKOam23kW0Sv+J574VQbAN9zHRFUTWtdIBeSi0A2zjYkc1hnlZlSn76fT9mT2jZMaCUNNo6tH9r20FUyqFFCoo9HlAKmg7ywNuS1FbGB+XIrw2ctsfz452udZw7YrChKJ00tXV4ZQpbpgPIyOCXCua3lGlHA8UKWfpbsmZ6iMrSf0YOUSUBH5NX5dCR6eRlAPOmfxFSZTTQiKGvQf16QDvUIa3wgP4SNJsyIl+EMq59kNR6Un4I8bHUyRGdIcgpGDt6g2s3XX6TWltze/Lv7+3/JABjJWu2J0Nz7b2BplQnu6mxkgf8VQwBJ1pxpJX6vOhC2Wo9C8iQMkaF4Q+ZFvx5q5UmXqn7JhlMebmVw7TH8IXgw0aMPeZ2CquWGR52ewhD+EOBJwzFxayZLeMo8XsaAHNeQMq0OI76iiyFlxNIeEKnoLoTWLxiTvin9jiXm/fxd+bY8rejs0cDkBb88i03jPI6DU/ho398DUY4npg==
// 分享出去的携带代码的地址
https://localhost:3000#eNqNVd9v2zYQ/lcIBYVtzPphN04zLQnadQPWh25A+7CHaQ80SUlMKFIgKc...
在应用初始化的时候会从url的hash中解码得到代码信息，并加载到编辑器中，同时编译并渲染到iframe中。实现分享URL即分享代码，无需依赖服务端存储
代码下载
在线编辑器中看到的只是应用组件文件像App.jsx，实际上入口文件一般是main.js，这个文件没暴露出来给用户编辑，并不太需要，但给用户下载的时候给一个完整的项目会比较好。
我们用vite生成的react项目模版，预设到项目中，然后把用户编辑的App.jsx等文件写入，打包成zip文件提供给用户下载。下载下来就是一个完整的项目（PS：第三方依赖还需要手动添加一下到package.json中，vue sfc playground也未实现），命令安装依赖启动即可运行。
打包zip并下载这个功能依赖于 file-saver 这个包实现。
独立使用
期望可以嵌入项目中作为组件使用，像react官方文档中的那样。
这部分功能就是给项目添加多个可配置属性，来自定义playground的样式，例如去除头部，改变布局等，打包发布到npm上，具体api参考文档。
export const Demo1 = () => {
  // 自定义代码
  const files = {}
  // 自定义esm映射
  const importMap = {}
  
  return (
    <Playground
      files={files}
      importMap={importMap}
      showHeader={false}
      showCompileOutput={false}
      fileSelectorReadOnly
      width={600}
      height={400}
    />
  )
}
