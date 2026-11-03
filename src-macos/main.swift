import Cocoa
import WebKit
import UniformTypeIdentifiers

/**
 * 视频剪辑姬（Video Cutie）v1.2.0 - macOS 原生客户端主入口
 * 使用 Apple 原生 Cocoa + WebKit (WKWebView) 渲染桌面客户端界面
 * 拥有完整的 macOS 原生窗口、交通灯信号、Dock 图标及本地离线资源支持
 * 内置 FFmpeg 二进制支持 (Contents/MacOS/ffmpeg)，免任何外部终端命令
 * 全面强化：原生文件/目录选择器、原生拖拽识别、安全进程防护杜绝崩溃
 */

class MainWindow: NSWindow {
    weak var bridgeDelegate: AppDelegate?

    override init(contentRect: NSRect, styleMask style: NSWindow.StyleMask, backing backingStoreType: NSWindow.BackingStoreType, defer flag: Bool) {
        super.init(contentRect: contentRect, styleMask: style, backing: backingStoreType, defer: flag)
        registerForDraggedTypes([.fileURL])
    }

    override func draggingEntered(_ sender: NSDraggingInfo) -> NSDragOperation {
        if let types = sender.draggingPasteboard.types, types.contains(.fileURL) {
            return .copy
        }
        return []
    }

    override func performDragOperation(_ sender: NSDraggingInfo) -> Bool {
        let pasteboard = sender.draggingPasteboard
        if let urls = pasteboard.readObjects(forClasses: [NSURL.self], options: nil) as? [URL], let firstURL = urls.first {
            bridgeDelegate?.handleFileDropped(url: firstURL)
            return true
        }
        return false
    }
}

class AppDelegate: NSObject, NSApplicationDelegate, NSWindowDelegate, WKScriptMessageHandler {
    var window: MainWindow!
    var webView: WKWebView!

    func applicationDidFinishLaunching(_ notification: Notification) {
        let app = NSApplication.shared
        app.setActivationPolicy(.regular)

        // 1. 计算居中窗口尺寸
        let screenRect = NSScreen.main?.visibleFrame ?? NSRect(x: 0, y: 0, width: 1200, height: 800)
        let windowWidth: CGFloat = 1140
        let windowHeight: CGFloat = 780
        let windowX = (screenRect.width - windowWidth) / 2 + screenRect.origin.x
        let windowY = (screenRect.height - windowHeight) / 2 + screenRect.origin.y

        let windowRect = NSRect(x: windowX, y: windowY, width: windowWidth, height: windowHeight)
        
        // 2. 创建现代 macOS 窗口 (支持圆角与原生全尺寸视图)
        window = MainWindow(
            contentRect: windowRect,
            styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView],
            backing: .buffered,
            defer: false
        )
        window.bridgeDelegate = self

        window.title = "视频剪辑姬 (Video Cutie)"
        window.titlebarAppearsTransparent = true
        window.titleVisibility = .hidden
        window.minSize = NSSize(width: 880, height: 600)
        window.isReleasedWhenClosed = false
        window.delegate = self

        // 3. 配置 WebKit 离线资源加载与本地文件权限
        let userContentController = WKUserContentController()
        userContentController.add(self, name: "nativeBridge")

        let config = WKWebViewConfiguration()
        config.userContentController = userContentController
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
                        <h2>🌸 视频剪辑姬 (Video Cutie) v1.2.0</h2>
                        <p style="color:#aaa;">客户端资源加载中...</p>
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

    // 原生处理拖入视频文件
    func handleFileDropped(url: URL) {
        let path = url.path
        let name = url.lastPathComponent
        let ext = url.pathExtension.lowercased()
        let validExts = ["mp4", "mov", "mkv", "webm", "avi", "m4v", "flv", "ts"]
        if validExts.contains(ext) {
            let escapedPath = path.replacingOccurrences(of: "\\", with: "\\\\").replacingOccurrences(of: "\"", with: "\\\"")
            let escapedName = name.replacingOccurrences(of: "\\", with: "\\\\").replacingOccurrences(of: "\"", with: "\\\"")
            DispatchQueue.main.async {
                self.webView.evaluateJavaScript("window.onNativeVideoFileDropped && window.onNativeVideoFileDropped(\"\(escapedPath)\", \"\(escapedName)\");", completionHandler: nil)
            }
        }
    }

    // 处理来自 WebKit 前端的原生桥接消息
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        if message.name == "nativeBridge", let body = message.body as? [String: Any] {
            let action = body["action"] as? String ?? ""
            
            // 1. 原生执行无损剪辑
            if action == "executeTrim" {
                let inputPath = body["input"] as? String ?? ""
                let outputPath = body["output"] as? String ?? ""
                let start = body["start"] as? String ?? "00:00:00"
                let end = body["end"] as? String ?? ""
                
                DispatchQueue.global(qos: .userInitiated).async {
                    self.runBundledFFmpeg(input: inputPath, output: outputPath, start: start, end: end)
                }
            }
            
            // 2. 原生选择视频文件弹窗
            else if action == "selectVideoFile" {
                DispatchQueue.main.async {
                    let panel = NSOpenPanel()
                    panel.canChooseFiles = true
                    panel.canChooseDirectories = false
                    panel.allowsMultipleSelection = false
                    panel.title = "选择需要裁剪的视频文件"
                    panel.prompt = "打开视频"
                    if #available(macOS 11.0, *) {
                        panel.allowedContentTypes = [
                            UTType.movie, UTType.video, UTType.quickTimeMovie, UTType.mpeg4Movie
                        ]
                    }
                    if panel.runModal() == .OK, let url = panel.url {
                        self.handleFileDropped(url: url)
                    }
                }
            }
            
            // 3. 原生选择剪辑保存目录弹窗
            else if action == "selectSaveDirectory" {
                DispatchQueue.main.async {
                    let panel = NSOpenPanel()
                    panel.canChooseFiles = false
                    panel.canChooseDirectories = true
                    panel.canCreateDirectories = true
                    panel.allowsMultipleSelection = false
                    panel.title = "选择视频剪辑保存路径"
                    panel.prompt = "选择目录"
                    if panel.runModal() == .OK, let url = panel.url {
                        let path = url.path
                        let escapedPath = path.replacingOccurrences(of: "\\", with: "\\\\").replacingOccurrences(of: "\"", with: "\\\"")
                        self.webView.evaluateJavaScript("window.onSaveDirectorySelected && window.onSaveDirectorySelected(\"\(escapedPath)\");", completionHandler: nil)
                    }
                }
            }
            
            // 4. 获取默认系统保存路径 (Movies / Downloads / Desktop)
            else if action == "getDefaultPaths" {
                let userHome = FileManager.default.homeDirectoryForCurrentUser.path
                let moviesDir = (userHome as NSString).appendingPathComponent("Movies")
                let downloadsDir = (userHome as NSString).appendingPathComponent("Downloads")
                let desktopDir = (userHome as NSString).appendingPathComponent("Desktop")
                
                let json = "{\"movies\":\"\(moviesDir)\", \"downloads\":\"\(downloadsDir)\", \"desktop\":\"\(desktopDir)\"}"
                DispatchQueue.main.async {
                    self.webView.evaluateJavaScript("window.onDefaultPathsReceived && window.onDefaultPathsReceived(\(json));", completionHandler: nil)
                }
            }
            
            // 5. 在访达中定位已导出的视频文件
            else if action == "revealInFinder" {
                let filePath = body["path"] as? String ?? ""
                if !filePath.isEmpty {
                    let url = URL(fileURLWithPath: filePath)
                    NSWorkspace.shared.activateFileViewerSelecting([url])
                }
            }
        }
    }

    private func notifyTrimError(_ message: String) {
        let escaped = message.replacingOccurrences(of: "\\", with: "\\\\")
                             .replacingOccurrences(of: "\"", with: "\\\"")
                             .replacingOccurrences(of: "\n", with: " ")
        self.webView.evaluateJavaScript("window.onNativeTrimComplete && window.onNativeTrimComplete(false, \"\", \"\(escaped)\");", completionHandler: nil)
    }

    // 运行客户端内置的 FFmpeg 引擎并进行严格的异常与路径防护，杜绝崩溃
    private func runBundledFFmpeg(input: String, output: String, start: String, end: String) {
        // 1. 规范化并检查输出路径，防止相对路径写入 root 导致的系统权限拒绝
        var finalOutput = output
        let userHome = FileManager.default.homeDirectoryForCurrentUser.path
        let defaultSaveDir = (userHome as NSString).appendingPathComponent("Movies")
        
        if finalOutput.isEmpty {
            finalOutput = (defaultSaveDir as NSString).appendingPathComponent("video_trimmed.mp4")
        } else if !finalOutput.hasPrefix("/") {
            finalOutput = (defaultSaveDir as NSString).appendingPathComponent(finalOutput)
        }

        // 2. 严格检查源视频文件是否存在
        if !FileManager.default.fileExists(atPath: input) {
            let msg = "未找到视频源文件: \(input)。请检查源文件是否存在或重新选择。"
            DispatchQueue.main.async {
                self.notifyTrimError(msg)
            }
            return
        }

        // 3. 确保输出目录存在，若不存在则递归创建
        let outputDir = URL(fileURLWithPath: finalOutput).deletingLastPathComponent().path
        if !FileManager.default.fileExists(atPath: outputDir) {
            do {
                try FileManager.default.createDirectory(atPath: outputDir, withIntermediateDirectories: true, attributes: nil)
            } catch {
                let msg = "无法创建保存目录: \(outputDir)，错误: \(error.localizedDescription)"
                DispatchQueue.main.async {
                    self.notifyTrimError(msg)
                }
                return
            }
        }

        // 4. 定位 App Bundle 内置或系统的 FFmpeg
        var ffmpegPath: String? = nil
        let candidatePaths = [
            Bundle.main.bundleURL.appendingPathComponent("Contents/MacOS/ffmpeg").path,
            "/opt/homebrew/bin/ffmpeg",
            "/usr/local/bin/ffmpeg",
            "/usr/bin/ffmpeg"
        ]
        for p in candidatePaths {
            if FileManager.default.isExecutableFile(atPath: p) {
                ffmpegPath = p
                break
            }
        }

        guard let binPath = ffmpegPath else {
            let msg = "未检测到可用的内置 FFmpeg 引擎。请检查客户端完整性。"
            DispatchQueue.main.async {
                self.notifyTrimError(msg)
            }
            return
        }

        // 5. 构建 Process 进程
        let task = Process()
        task.executableURL = URL(fileURLWithPath: binPath)
        task.currentDirectoryURL = URL(fileURLWithPath: NSTemporaryDirectory())

        var arguments = ["-ss", start]
        if !end.isEmpty {
            arguments.append(contentsOf: ["-to", end])
        }
        arguments.append(contentsOf: [
            "-i", input,
            "-c:v", "copy",
            "-c:a", "copy",
            "-avoid_negative_ts", "make_zero",
            "-y",
            finalOutput
        ])
        task.arguments = arguments

        let errorPipe = Pipe()
        task.standardError = errorPipe
        task.standardOutput = Pipe()

        var didLaunch = false
        do {
            try task.run()
            didLaunch = true
        } catch {
            let msg = "FFmpeg 启动失败: \(error.localizedDescription)"
            DispatchQueue.main.async {
                self.notifyTrimError(msg)
            }
            return
        }

        if didLaunch {
            task.waitUntilExit()
            let exitCode = task.terminationStatus
            let errorData = errorPipe.fileHandleForReading.readDataToEndOfFile()
            let errorOutput = String(data: errorData, encoding: .utf8) ?? ""
            
            DispatchQueue.main.async {
                if exitCode == 0 {
                    let escapedOut = finalOutput.replacingOccurrences(of: "\\", with: "\\\\").replacingOccurrences(of: "\"", with: "\\\"")
                    self.webView.evaluateJavaScript("window.onNativeTrimComplete && window.onNativeTrimComplete(true, \"\(escapedOut)\", \"\");", completionHandler: nil)
                } else {
                    let summary = errorOutput.trimmingCharacters(in: .whitespacesAndNewlines)
                    let errorMsg = summary.isEmpty ? "FFmpeg 剪辑异常 (退出码 \(exitCode))" : summary
                    self.notifyTrimError(errorMsg)
                }
            }
        }
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }
}

let delegate = AppDelegate()
NSApplication.shared.delegate = delegate
NSApplication.shared.run()
