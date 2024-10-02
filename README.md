# gd3dts
获取 Arena 编辑器中的 类型声明（DTS）文件

## 安装并使用
1. 克隆本仓库到本地
2. 确保设备中已安装 [NodeJS](https://nodejs.org) 环境 并 已连接网络
3. 打开终端，切换到项目，运行 node main
4. 文件内容将会输出到 ClientAPI.d.ts 和 GameAPI.d.ts

## 提示
本项目为整活项目。

我们并不建议使用官方自带的 类型声明文件，因为他存在许多缺陷（如 服务端的 `entity.player.dialog` 以及 客户端的 `remoteChannel.onClientEvent` 等）

推荐使用 [神岛实验室的类型声明文件](https://gitee.com/box3lab/arena_dts/)，他们对官方的类型声明文件进行了一些整理。