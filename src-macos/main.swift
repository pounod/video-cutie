import Cocoa
import WebKit
import UniformTypeIdentifiers

/**
 * 视频剪辑姬（Video Cutie）v1.2.0 - macOS 原生客户端主入口
 * 架构: Universal Binary (Apple Silicon arm64 + Intel x86_64)
 * 特性:
 *  - 原生 Cocoa 窗口 + WebKit WKWebView 独立客户端界面 (无浏览器依赖、无多层嵌套)
 *  - 内置 FFmpeg 二进制 (Contents/MacOS/ffmpeg) 毫秒级原画音视频流无损裁剪
 *  - 原生菜单栏 (Cmd+Q 退出, Cmd+W 关闭, Cmd+C 复制, Cmd+V 粘贴)
 *  - 原生文件拖拽、原生文件打开对话框、原生保存目录选择与访达定位
 */

class MainWindow: NSWindow, NSDraggingDestination {
    weak var bridgeDelegate: AppDelegate?

    override init(contentRect: NSRect, styleMask style: NSWindow.StyleMask, backing backingStoreType: NSWindow.BackingStoreType, defer flag: Bool) {
        super.init(contentRect: contentRect, styleMask: style, backing: backingStoreType, defer: flag)
        registerForDraggedTypes([.fileURL])
    }

    func draggingEntered(_ sender: NSDraggingInfo) -> NSDragOperation {
        if let types = sender.draggingPasteboard.types, types.contains(.fileURL) {
            return .copy
        }
        return []
    }

    func performDragOperation(_ sender: NSDraggingInfo) -> Bool {
        let pasteboard = sender.draggingPasteboard
        if let urls = pasteboard.readObjects(forClasses: [NSURL.self], options: nil) as? [URL], let firstURL = urls.first {
            bridgeDelegate?.handleFileDropped(url: firstURL)
            return true
        }
        return false
    }
}

// 自定义安全 Scheme 处理器，彻底解决 WebKit 在 file:// 协议下阻断 Vite ES Module (type="module") 导致的空白窗口
class LocalBundleSchemeHandler: NSObject, WKURLSchemeHandler {
    let baseDirectory: URL

    init(baseDirectory: URL) {
        self.baseDirectory = baseDirectory
        super.init()
    }

    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        guard let url = urlSchemeTask.request.url else {
            urlSchemeTask.didFailWithError(NSError(domain: "LocalBundleSchemeHandler", code: 400, userInfo: nil))
            return
        }

        var path = url.path
        if path.isEmpty || path == "/" {
            path = "/index.html"
        }
        let relativePath = path.hasPrefix("/") ? String(path.dropFirst()) : path
        let fileURL = baseDirectory.appendingPathComponent(relativePath)

        var isDir: ObjCBool = false
        if FileManager.default.fileExists(atPath: fileURL.path, isDirectory: &isDir), !isDir.boolValue {
            do {
                let data = try Data(contentsOf: fileURL)
                let ext = fileURL.pathExtension.lowercased()
                var mime = "application/octet-stream"
                if #available(macOS 11.0, *), let ut = UTType(filenameExtension: ext), let m = ut.preferredMIMEType {
                    mime = m
                } else {
                    switch ext {
                    case "html", "htm": mime = "text/html"
                    case "js", "mjs": mime = "text/javascript"
                    case "css": mime = "text/css"
                    case "json": mime = "application/json"
                    case "png": mime = "image/png"
                    case "jpg", "jpeg": mime = "image/jpeg"
                    case "svg": mime = "image/svg+xml"
                    default: mime = "application/octet-stream"
                    }
                }

                if (ext == "js" || ext == "mjs") && !mime.contains("charset") {
                    mime = "text/javascript; charset=utf-8"
                } else if (ext == "html" || ext == "htm") && !mime.contains("charset") {
                    mime = "text/html; charset=utf-8"
                } else if ext == "css" && !mime.contains("charset") {
                    mime = "text/css; charset=utf-8"
                }

                let response = HTTPURLResponse(
                    url: url,
                    statusCode: 200,
                    httpVersion: "HTTP/1.1",
                    headerFields: [
                        "Content-Type": mime,
                        "Content-Length": "\(data.count)",
                        "Access-Control-Allow-Origin": "*"
                    ]
                )!

                urlSchemeTask.didReceive(response)
                urlSchemeTask.didReceive(data)
                urlSchemeTask.didFinish()
            } catch {
                urlSchemeTask.didFailWithError(error)
            }
        } else {
            let error = NSError(domain: NSURLErrorDomain, code: NSURLErrorFileDoesNotExist, userInfo: nil)
            urlSchemeTask.didFailWithError(error)
        }
    }

    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {}
}

class AppDelegate: NSObject, NSApplicationDelegate, NSWindowDelegate, WKScriptMessageHandler {
    var window: MainWindow!
    var webView: WKWebView!
    private var schemeHandler: LocalBundleSchemeHandler?

    func applicationDidFinishLaunching(_ notification: Notification) {
        // 1. 设置标准应用菜单栏 (确保 Cmd+Q 退出、Cmd+W 关闭、Cmd+C/V 剪切板正常工作)
        setupMainMenu()

        // 2. 计算居中窗口尺寸 (1160x780)
        let screenRect = NSScreen.main?.visibleFrame ?? NSRect(x: 0, y: 0, width: 1200, height: 800)
        let windowWidth: CGFloat = 1160
        let windowHeight: CGFloat = 780
        let windowX = max(0, (screenRect.width - windowWidth) / 2 + screenRect.origin.x)
        let windowY = max(0, (screenRect.height - windowHeight) / 2 + screenRect.origin.y)

        let windowRect = NSRect(x: windowX, y: windowY, width: windowWidth, height: windowHeight)

        // 3. 创建现代 macOS 原生窗口
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
        window.minSize = NSSize(width: 860, height: 580)
        window.isReleasedWhenClosed = false
        window.delegate = self

        // 4. 定位 App Bundle 内的 Resources 目录或本地 dist 目录
        var resourceURL: URL? = nil
        if let resourcePath = Bundle.main.resourcePath {
            let indexURL = URL(fileURLWithPath: resourcePath).appendingPathComponent("index.html")
            if FileManager.default.fileExists(atPath: indexURL.path) {
                resourceURL = URL(fileURLWithPath: resourcePath)
            }
        }
        if resourceURL == nil {
            let localURL = URL(fileURLWithPath: FileManager.default.currentDirectoryPath).appendingPathComponent("dist")
            if FileManager.default.fileExists(atPath: localURL.appendingPathComponent("index.html").path) {
                resourceURL = localURL
            }
        }

        // 5. 配置 WebKit 离线资源加载与本地通信桥
        let userContentController = WKUserContentController()
        userContentController.add(self, name: "nativeBridge")

        let config = WKWebViewConfiguration()
        config.userContentController = userContentController
        let webpagePreferences = WKWebpagePreferences()
        webpagePreferences.allowsContentJavaScript = true
        config.defaultWebpagePreferences = webpagePreferences

        // 核心加固：注册 app:// 自定义安全 Scheme 彻底杜绝 file:// 协议对 ES Module 的 CORS 拦截与白屏
        if let resDir = resourceURL {
            let handler = LocalBundleSchemeHandler(baseDirectory: resDir)
            self.schemeHandler = handler
            config.setURLSchemeHandler(handler, forURLScheme: "app")
        }

        webView = WKWebView(frame: window.contentView!.bounds, configuration: config)
        webView.autoresizingMask = [.width, .height]
        window.contentView?.addSubview(webView)

        // 6. 加载客户端界面
        if resourceURL != nil {
            if let appURL = URL(string: "app://localhost/index.html") {
                webView.load(URLRequest(url: appURL))
            }
        } else {
            webView.loadHTMLString("<html><body style='font-family:-apple-system;padding:40px;text-align:center;'><h2>视频剪辑姬 (Video Cutie)</h2><p>未找到前端界面资源文件，请确保应用安装完整。</p></body></html>", baseURL: nil)
        }

        // 7. 显示并聚焦原生客户端窗口
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }

    // 快捷菜单栏
    private func setupMainMenu() {
        let mainMenu = NSMenu()

        // App Menu
        let appMenuItem = NSMenuItem()
        let appMenu = NSMenu(title: "视频剪辑姬")
        appMenu.addItem(withTitle: "关于 视频剪辑姬", action: #selector(showAbout), keyEquivalent: "")
        appMenu.addItem(NSMenuItem.separator())
        appMenu.addItem(withTitle: "隐藏 视频剪辑姬", action: #selector(NSApplication.hide(_:)), keyEquivalent: "h")
        let hideOthers = NSMenuItem(title: "隐藏其他", action: #selector(NSApplication.hideOtherApplications(_:)), keyEquivalent: "h")
        hideOthers.keyEquivalentModifierMask = [.command, .option]
        appMenu.addItem(hideOthers)
        appMenu.addItem(withTitle: "显示全部", action: #selector(NSApplication.unhideAllApplications(_:)), keyEquivalent: "")
        appMenu.addItem(NSMenuItem.separator())
        appMenu.addItem(withTitle: "退出 视频剪辑姬", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        appMenuItem.submenu = appMenu
        mainMenu.addItem(appMenuItem)

        // Edit Menu (用于输入框复制、剪切、粘贴、撤销、全选)
        let editMenuItem = NSMenuItem()
        let editMenu = NSMenu(title: "编辑")
        editMenu.addItem(withTitle: "撤销", action: Selector(("undo:")), keyEquivalent: "z")
        let redoItem = NSMenuItem(title: "重做", action: Selector(("redo:")), keyEquivalent: "Z")
        editMenu.addItem(redoItem)
        editMenu.addItem(NSMenuItem.separator())
        editMenu.addItem(withTitle: "剪切", action: #selector(NSText.cut(_:)), keyEquivalent: "x")
        editMenu.addItem(withTitle: "复制", action: #selector(NSText.copy(_:)), keyEquivalent: "c")
        editMenu.addItem(withTitle: "粘贴", action: #selector(NSText.paste(_:)), keyEquivalent: "v")
        editMenu.addItem(withTitle: "全选", action: #selector(NSText.selectAll(_:)), keyEquivalent: "a")
        editMenuItem.submenu = editMenu
        mainMenu.addItem(editMenuItem)

        // Window Menu
        let windowMenuItem = NSMenuItem()
        let windowMenu = NSMenu(title: "窗口")
        windowMenu.addItem(withTitle: "最小化", action: #selector(NSWindow.miniaturize(_:)), keyEquivalent: "m")
        windowMenu.addItem(withTitle: "缩放", action: #selector(NSWindow.zoom(_:)), keyEquivalent: "")
        windowMenu.addItem(NSMenuItem.separator())
        windowMenu.addItem(withTitle: "关闭窗口", action: #selector(NSWindow.performClose(_:)), keyEquivalent: "w")
        windowMenuItem.submenu = windowMenu
        mainMenu.addItem(windowMenuItem)

        NSApp.mainMenu = mainMenu
    }

    @objc func showAbout() {
        DispatchQueue.main.async {
            self.webView.evaluateJavaScript("window.onOpenAboutModal && window.onOpenAboutModal();", completionHandler: nil)
        }
    }

    // 处理拖拽或打开的视频文件
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

    // 接收前端桥接消息
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "nativeBridge", let body = message.body as? [String: Any] else { return }
        let action = body["action"] as? String ?? ""

        switch action {
        case "executeTrim":
            let inputPath = body["input"] as? String ?? ""
            let outputPath = body["output"] as? String ?? ""
            let start = body["start"] as? String ?? "00:00:00"
            let end = body["end"] as? String ?? ""

            DispatchQueue.global(qos: .userInitiated).async {
                self.runBundledFFmpeg(input: inputPath, output: outputPath, start: start, end: end)
            }

        case "selectVideoFile":
            DispatchQueue.main.async {
                let panel = NSOpenPanel()
                panel.canChooseFiles = true
                panel.canChooseDirectories = false
                panel.allowsMultipleSelection = false
                panel.title = "选择需要裁剪的视频文件"
                panel.prompt = "打开视频"
                if #available(macOS 11.0, *) {
                    panel.allowedContentTypes = [UTType.movie, UTType.video, UTType.quickTimeMovie, UTType.mpeg4Movie]
                }
                if panel.runModal() == .OK, let url = panel.url {
                    self.handleFileDropped(url: url)
                }
            }

        case "selectSaveDirectory":
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

        case "getDefaultPaths":
            let userHome = FileManager.default.homeDirectoryForCurrentUser.path
            let moviesDir = (userHome as NSString).appendingPathComponent("Movies")
            let downloadsDir = (userHome as NSString).appendingPathComponent("Downloads")
            let desktopDir = (userHome as NSString).appendingPathComponent("Desktop")

            let json = "{\"movies\":\"\(moviesDir)\", \"downloads\":\"\(downloadsDir)\", \"desktop\":\"\(desktopDir)\"}"
            DispatchQueue.main.async {
                self.webView.evaluateJavaScript("window.onDefaultPathsReceived && window.onDefaultPathsReceived(\(json));", completionHandler: nil)
            }

        case "revealInFinder":
            let filePath = body["path"] as? String ?? ""
            if !filePath.isEmpty {
                let url = URL(fileURLWithPath: filePath)
                NSWorkspace.shared.activateFileViewerSelecting([url])
            }

        default:
            break
        }
    }

    private func notifyTrimError(_ message: String) {
        let escaped = message.replacingOccurrences(of: "\\", with: "\\\\")
                             .replacingOccurrences(of: "\"", with: "\\\"")
                             .replacingOccurrences(of: "\n", with: " ")
        self.webView.evaluateJavaScript("window.onNativeTrimComplete && window.onNativeTrimComplete(false, \"\", \"\(escaped)\");", completionHandler: nil)
    }

    // 运行客户端内置 FFmpeg 引擎并进行严格路径与安全防护，杜绝崩溃
    private func runBundledFFmpeg(input: String, output: String, start: String, end: String) {
        let userHome = FileManager.default.homeDirectoryForCurrentUser.path
        let defaultSaveDir = (userHome as NSString).appendingPathComponent("Movies")

        // 彻底展开 ~ 波浪号并标准化路径，防止路径错位或生成嵌套无效路径
        var finalOutput = (output as NSString).expandingTildeInPath.trimmingCharacters(in: .whitespacesAndNewlines)
        if finalOutput.isEmpty {
            finalOutput = (defaultSaveDir as NSString).appendingPathComponent("video_trimmed.mp4")
        } else if !finalOutput.hasPrefix("/") {
            finalOutput = (defaultSaveDir as NSString).appendingPathComponent(finalOutput)
        }
        finalOutput = (finalOutput as NSString).standardizingPath

        // 如果用户指定的路径是一个已有目录，自动在目录后追加剪辑文件名
        var isDir: ObjCBool = false
        if FileManager.default.fileExists(atPath: finalOutput, isDirectory: &isDir), isDir.boolValue {
            let inputFileName = URL(fileURLWithPath: input).deletingPathExtension().lastPathComponent
            let inputExt = URL(fileURLWithPath: input).pathExtension
            let cleanExt = inputExt.isEmpty ? "mp4" : inputExt
            let startTag = start.replacingOccurrences(of: ":", with: "")
            let endTag = end.replacingOccurrences(of: ":", with: "")
            let generatedName = "\(inputFileName)_cut_\(startTag)_\(endTag).\(cleanExt)"
            finalOutput = (finalOutput as NSString).appendingPathComponent(generatedName)
        }

        // 严格检查源视频文件是否存在
        if !FileManager.default.fileExists(atPath: input) {
            let msg = "未找到视频源文件: \(input)。请检查源文件是否存在或重新选择。"
            DispatchQueue.main.async {
                self.notifyTrimError(msg)
            }
            return
        }

        // 递归创建输出目录
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

        // 定位 App Bundle 内置或系统的 FFmpeg
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
                if exitCode == 0 && FileManager.default.fileExists(atPath: finalOutput) {
                    let escapedOut = finalOutput.replacingOccurrences(of: "\\", with: "\\\\").replacingOccurrences(of: "\"", with: "\\\"")
                    self.webView.evaluateJavaScript("window.onNativeTrimComplete && window.onNativeTrimComplete(true, \"\(escapedOut)\", \"\");", completionHandler: nil)
                } else {
                    let summary = errorOutput.trimmingCharacters(in: .whitespacesAndNewlines)
                    let errorMsg = summary.isEmpty ? "未能将剪辑文件保存至指定路径: \(finalOutput)" : summary
                    self.notifyTrimError(errorMsg)
                }
            }
        }
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }

    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool {
        if !flag {
            window?.makeKeyAndOrderFront(nil)
        }
        return true
    }
}

// 启动 Cocoa 原生主运行循环
let app = NSApplication.shared
app.setActivationPolicy(.regular)
let strongDelegate = AppDelegate()
app.delegate = strongDelegate
withExtendedLifetime(strongDelegate) {
    app.run()
}
