import Cocoa
import WebKit

/**
 * 视频剪辑姬（Video Cutie）v1.1.1 - macOS 原生客户端主入口
 * 使用 Apple 原生 Cocoa + WebKit (WKWebView) 渲染桌面客户端界面
 * 拥有完整的 macOS 原生窗口、交通灯信号、Dock 图标及本地离线资源支持
 */

class AppDelegate: NSObject, NSApplicationDelegate, NSWindowDelegate {
    var window: NSWindow!
    var webView: WKWebView!

    func applicationDidFinishLaunching(_ notification: Notification) {
        let app = NSApplication.shared
        app.setActivationPolicy(.regular)

        // 1. 计算居中窗口尺寸
        let screenRect = NSScreen.main?.visibleFrame ?? NSRect(x: 0, y: 0, width: 1200, height: 800)
        let windowWidth: CGFloat = 1180
        let windowHeight: CGFloat = 780
        let windowX = (screenRect.width - windowWidth) / 2 + screenRect.origin.x
        let windowY = (screenRect.height - windowHeight) / 2 + screenRect.origin.y

        let windowRect = NSRect(x: windowX, y: windowY, width: windowWidth, height: windowHeight)
        
        // 2. 创建现代 macOS 窗口 (支持圆角与原生全尺寸视图)
        window = NSWindow(
            contentRect: windowRect,
            styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView],
            backing: .buffered,
            defer: false
        )

        window.title = "视频剪辑姬 (Video Cutie)"
        window.titlebarAppearsTransparent = true
        window.titleVisibility = .hidden
        window.minSize = NSSize(width: 920, height: 620)
        window.isReleasedWhenClosed = false
        window.delegate = self

        // 3. 配置 WebKit 离线资源加载与本地文件权限
        let config = WKWebViewConfiguration()
        config.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        config.setValue(true, forKey: "allowUniversalAccessFromFileURLs")

        webView = WKWebView(frame: window.contentView!.bounds, configuration: config)
        webView.autoresizingMask = [.width, .height]
        window.contentView?.addSubview(webView)

        // 4. 定位并加载本地 Contents/Resources/index.html 客户端界面
        var loaded = false
        if let resourcePath = Bundle.main.resourcePath {
            let indexURL = URL(fileURLWithPath: resourcePath).appendingPathComponent("index.html")
            if FileManager.default.fileExists(atPath: indexURL.path) {
                let accessURL = URL(fileURLWithPath: resourcePath)
                webView.loadFileURL(indexURL, allowingReadAccessTo: accessURL)
                loaded = true
            }
        }

        // 兜底回退：若未找到打包资源，则尝试加载同级或本地静态服务
        if !loaded {
            let localURL = URL(fileURLWithPath: "./index.html")
            if FileManager.default.fileExists(atPath: localURL.path) {
                webView.loadFileURL(localURL, allowingReadAccessTo: URL(fileURLWithPath: "."))
            } else {
                let html = """
                <html>
                <body style="background:#171717;color:#fff;font-family:-apple-system;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
                    <div style="text-align:center;">
                        <h2>🌸 视频剪辑姬 (Video Cutie) v1.1.1</h2>
                        <p style="color:#aaa;">资源正在加载中，请稍候...</p>
                    </div>
                </body>
                </html>
                """
                webView.loadHTMLString(html, baseURL: nil)
            }
        }

        // 5. 显示并聚焦窗口
        window.makeKeyAndOrderFront(nil)
        app.activate(ignoringOtherApps: true)
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }
}

let delegate = AppDelegate()
NSApplication.shared.delegate = delegate
NSApplication.shared.run()
