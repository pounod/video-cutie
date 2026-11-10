import Cocoa
import WebKit
import UniformTypeIdentifiers

/**
 * 视频剪辑姬（Video Cutie）v1.2.3 - macOS 原生客户端主入口
 * 架构: Universal Binary (Apple Silicon arm64 + Intel x86_64)
 * 特性:
 *  - 原生 Cocoa 窗口 + WebKit WKWebView 独立客户端界面 (无浏览器依赖、无多层嵌套)
 *  - 内置 FFmpeg 二进制 (Contents/MacOS/ffmpeg) 毫秒级原画音视频流无损裁剪
 *  - 原生菜单栏 (Cmd+Q 退出, Cmd+W 关闭, Cmd+C 复制, Cmd+V 粘贴)
 *  - 原生文件拖拽、原生文件打开对话框、原生保存目录选择与访达定位
 */

class MainWindow: NSWindow {
    weak var bridgeDelegate: AppDelegate?

    override init(contentRect: NSRect, styleMask style: NSWindow.StyleMask, backing backingStoreType: NSWindow.BackingStoreType, defer flag: Bool) {
        super.init(contentRect: contentRect, styleMask: style, backing: backingStoreType, defer: flag)
        registerForDraggedTypes([
            .fileURL,
            NSPasteboard.PasteboardType("NSFilenamesPboardType")
        ])
    }
}

class DragDroppableWebView: WKWebView {
    weak var bridgeDelegate: AppDelegate?

    override init(frame: NSRect, configuration: WKWebViewConfiguration) {
        super.init(frame: frame, configuration: configuration)
        registerForDraggedTypes([
            .fileURL,
            NSPasteboard.PasteboardType("NSFilenamesPboardType")
        ])
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        registerForDraggedTypes([
            .fileURL,
            NSPasteboard.PasteboardType("NSFilenamesPboardType")
        ])
    }

    override func draggingEntered(_ sender: NSDraggingInfo) -> NSDragOperation {
        return .copy
    }

    override func draggingUpdated(_ sender: NSDraggingInfo) -> NSDragOperation {
        return .copy
    }

    override func performDragOperation(_ sender: NSDraggingInfo) -> Bool {
        let pasteboard = sender.draggingPasteboard
        var droppedURL: URL? = nil

        if let urls = pasteboard.readObjects(forClasses: [NSURL.self], options: nil) as? [URL], let firstURL = urls.first {
            droppedURL = firstURL
        } else if let files = pasteboard.propertyList(forType: NSPasteboard.PasteboardType("NSFilenamesPboardType")) as? [String], let firstPath = files.first {
            droppedURL = URL(fileURLWithPath: firstPath)
        }

        if let url = droppedURL {
            bridgeDelegate?.handleFileDropped(url: url)
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

        // 支持加载本地被选中的视频流，消除跨源安全阻断并支持 HTTP 206 Range 毫秒级分片流式播放
        if url.host == "local-file" {
            let localFilePath = url.path.removingPercentEncoding ?? url.path
            let fileURL = URL(fileURLWithPath: localFilePath)
            if FileManager.default.fileExists(atPath: fileURL.path) {
                do {
                    let fileHandle = try FileHandle(forReadingFrom: fileURL)
                    defer { try? fileHandle.close() }

                    let attr = try FileManager.default.attributesOfItem(atPath: fileURL.path)
                    let fileSize = (attr[.size] as? NSNumber)?.int64Value ?? 0

                    let ext = fileURL.pathExtension.lowercased()
                    var mime = "video/mp4"
                    if ext == "mov" { mime = "video/quicktime" }
                    else if ext == "webm" { mime = "video/webm" }
                    else if ext == "mkv" { mime = "video/x-matroska" }
                    else if ext == "avi" { mime = "video/x-msvideo" }
                    else if ext == "m4v" { mime = "video/x-m4v" }
                    else if ext == "ts" { mime = "video/mp2t" }

                    let rangeHeader = urlSchemeTask.request.value(forHTTPHeaderField: "Range")
                    if let rangeHeader = rangeHeader, rangeHeader.hasPrefix("bytes=") {
                        let rangeSpec = String(rangeHeader.dropFirst(6))
                        let parts = rangeSpec.components(separatedBy: "-")
                        var start: Int64 = 0
                        var end: Int64 = fileSize - 1

                        if let s = Int64(parts[0]) {
                            start = s
                        }
                        if parts.count > 1, let e = Int64(parts[1]) {
                            end = e
                        }
                        if end >= fileSize {
                            end = max(0, fileSize - 1)
                        }

                        let length = max(0, end - start + 1)
                        try fileHandle.seek(toOffset: UInt64(start))
                        let chunkData = fileHandle.readData(ofLength: Int(min(length, 8 * 1024 * 1024)))

                        let headers: [String: String] = [
                            "Content-Type": mime,
                            "Content-Length": "\(chunkData.count)",
                            "Content-Range": "bytes \(start)-\(start + Int64(chunkData.count) - 1)/\(fileSize)",
                            "Accept-Ranges": "bytes",
                            "Access-Control-Allow-Origin": "*"
                        ]

                        let response = HTTPURLResponse(
                            url: url,
                            statusCode: 206,
                            httpVersion: "HTTP/1.1",
                            headerFields: headers
                        )!
                        urlSchemeTask.didReceive(response)
                        urlSchemeTask.didReceive(chunkData)
                        urlSchemeTask.didFinish()
                        return
                    } else {
                        // 首次请求，返回可接收范围头部及首块数据
                        let readLen = Int(min(fileSize, 4 * 1024 * 1024))
                        let chunkData = fileHandle.readData(ofLength: readLen)
                        let headers: [String: String] = [
                            "Content-Type": mime,
                            "Content-Length": "\(fileSize)",
                            "Accept-Ranges": "bytes",
                            "Access-Control-Allow-Origin": "*"
                        ]
                        let response = HTTPURLResponse(
                            url: url,
                            statusCode: 200,
                            httpVersion: "HTTP/1.1",
                            headerFields: headers
                        )!
                        urlSchemeTask.didReceive(response)
                        urlSchemeTask.didReceive(chunkData)
                        urlSchemeTask.didFinish()
                        return
                    }
                } catch {
                    urlSchemeTask.didFailWithError(error)
                    return
                }
            }
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

        let customWebView = DragDroppableWebView(frame: window.contentView!.bounds, configuration: config)
        customWebView.bridgeDelegate = self
        customWebView.autoresizingMask = [.width, .height]
        webView = customWebView
        window.contentView?.addSubview(webView)

        // 监听系统深色模式/浅色模式切换
        DistributedNotificationCenter.default().addObserver(
            self,
            selector: #selector(handleThemeChanged),
            name: NSNotification.Name("AppleInterfaceThemeChangedNotification"),
            object: nil
        )

        // 6. 加载客户端界面
        if resourceURL != nil {
            if let appURL = URL(string: "app://localhost/index.html") {
                webView.load(URLRequest(url: appURL))
            }
        } else {
            webView.loadHTMLString("<html><body style='font-family:-apple-system;padding:40px;text-align:center;'><h2>视频剪辑姬 (Video Cutie)</h2><p>未找到前端界面资源文件，请确保应用安装完整。</p></body></html>", baseURL: nil)
        }

        // 7. 显示并聚焦原生客户端窗口
        window.backgroundColor = NSColor.windowBackgroundColor
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
        let validExts = ["mp4", "mov", "mkv", "webm", "avi", "m4v", "flv", "ts", "wmv", "3gp", "mpeg", "mpg", "m2ts", "vob", "ogv"]
        if validExts.contains(ext) || ext.isEmpty {
            let payload: [String: Any] = ["path": path, "name": name]
            if let jsonData = try? JSONSerialization.data(withJSONObject: payload),
               let jsonString = String(data: jsonData, encoding: .utf8) {
                DispatchQueue.main.async {
                    let js = """
                    (function() {
                        var data = \(jsonString);
                        if (window.onNativeVideoFileDropped) {
                            window.onNativeVideoFileDropped(data.path, data.name);
                        } else if (window.onNativeVideoFileSelected) {
                            window.onNativeVideoFileSelected(data.path, data.name);
                        }
                    })();
                    """
                    self.webView.evaluateJavaScript(js, completionHandler: { (_, err) in
                        if let err = err {
                            print("JS Video Drop Evaluation Error: \(err)")
                        }
                    })
                }
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
                panel.allowsOtherFileTypes = true
                panel.title = "选择需要裁剪的视频文件"
                panel.prompt = "打开视频"
                if #available(macOS 11.0, *) {
                    panel.allowedContentTypes = [
                        UTType.movie, 
                        UTType.video, 
                        UTType.quickTimeMovie, 
                        UTType.mpeg4Movie, 
                        UTType.audiovisualContent
                    ]
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
                panel.title = "选择保存路径并申请 macOS 系统文件夹访问权限"
                panel.prompt = "授权并设定保存路径"
                panel.message = "请选择用于保存裁剪视频的目标文件夹，并确认授予「视频剪辑姬」对此文件夹的写入权限。"
                if panel.runModal() == .OK, let url = panel.url {
                    let path = url.path
                    let escapedPath = path.replacingOccurrences(of: "\\", with: "\\\\").replacingOccurrences(of: "\"", with: "\\\"")
                    self.webView.evaluateJavaScript("window.onSaveDirectorySelected && window.onSaveDirectorySelected(\"\(escapedPath)\");", completionHandler: nil)
                    self.webView.evaluateJavaScript("window.onFolderPermissionGranted && window.onFolderPermissionGranted(\"\(escapedPath)\", true);", completionHandler: nil)
                }
            }

        case "requestFolderPermission":
            let targetPath = body["path"] as? String ?? ""
            let expandedPath = (targetPath as NSString).expandingTildeInPath
            DispatchQueue.main.async {
                let panel = NSOpenPanel()
                panel.canChooseFiles = false
                panel.canChooseDirectories = true
                panel.canCreateDirectories = true
                panel.allowsMultipleSelection = false
                panel.title = "申请 macOS 文件夹读写访问权限"
                panel.prompt = "授权写入权限"
                panel.message = "请确认授予「视频剪辑姬」对此文件夹的写入访问权限，以确保剪辑后视频正常保存。"
                if !expandedPath.isEmpty && FileManager.default.fileExists(atPath: expandedPath) {
                    panel.directoryURL = URL(fileURLWithPath: expandedPath)
                }
                if panel.runModal() == .OK, let url = panel.url {
                    let path = url.path
                    let escapedPath = path.replacingOccurrences(of: "\\", with: "\\\\").replacingOccurrences(of: "\"", with: "\\\"")
                    self.webView.evaluateJavaScript("window.onFolderPermissionGranted && window.onFolderPermissionGranted(\"\(escapedPath)\", true);", completionHandler: nil)
                    self.webView.evaluateJavaScript("window.onSaveDirectorySelected && window.onSaveDirectorySelected(\"\(escapedPath)\");", completionHandler: nil)
                }
            }

        case "checkFolderPermission":
            let targetPath = body["path"] as? String ?? ""
            let expandedPath = (targetPath as NSString).expandingTildeInPath
            var isWritable = false
            if FileManager.default.fileExists(atPath: expandedPath) {
                isWritable = FileManager.default.isWritableFile(atPath: expandedPath)
            } else {
                let parent = URL(fileURLWithPath: expandedPath).deletingLastPathComponent().path
                isWritable = FileManager.default.isWritableFile(atPath: parent)
            }
            let escapedPath = targetPath.replacingOccurrences(of: "\\", with: "\\\\").replacingOccurrences(of: "\"", with: "\\\"")
            DispatchQueue.main.async {
                self.webView.evaluateJavaScript("window.onFolderPermissionChecked && window.onFolderPermissionChecked(\"\(escapedPath)\", \(isWritable));", completionHandler: nil)
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

        case "getSystemTheme":
            let isDark = NSApp.effectiveAppearance.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua
            DispatchQueue.main.async {
                self.webView.evaluateJavaScript("window.onSystemThemeChanged && window.onSystemThemeChanged(\(isDark));", completionHandler: nil)
            }

        case "revealInFinder":
            let filePath = body["path"] as? String ?? ""
            if !filePath.isEmpty {
                let expanded = (filePath as NSString).expandingTildeInPath
                let url = URL(fileURLWithPath: expanded)
                NSWorkspace.shared.activateFileViewerSelecting([url])
            }

        default:
            break
        }
    }

    @objc func handleThemeChanged() {
        let isDark = NSApp.effectiveAppearance.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua
        DispatchQueue.main.async {
            self.webView.evaluateJavaScript("window.onSystemThemeChanged && window.onSystemThemeChanged(\(isDark));", completionHandler: nil)
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

        // 收集所有潜在的 FFmpeg 可执行候选路径
        var candidatePaths: [String] = []
        let bundledPath = Bundle.main.bundleURL.appendingPathComponent("Contents/MacOS/ffmpeg").path
        if FileManager.default.isExecutableFile(atPath: bundledPath) {
            candidatePaths.append(bundledPath)
        }

        let systemPaths = [
            "/opt/homebrew/bin/ffmpeg",
            "/usr/local/bin/ffmpeg",
            "/usr/bin/ffmpeg"
        ]
        for sp in systemPaths {
            if !candidatePaths.contains(sp) && FileManager.default.isExecutableFile(atPath: sp) {
                candidatePaths.append(sp)
            }
        }

        // 尝试解析 PATH 环境变量中的 ffmpeg
        let whichProcess = Process()
        whichProcess.executableURL = URL(fileURLWithPath: "/usr/bin/which")
        whichProcess.arguments = ["ffmpeg"]
        let whichPipe = Pipe()
        whichProcess.standardOutput = whichPipe
        if (try? whichProcess.run()) != nil {
            whichProcess.waitUntilExit()
            let whichData = whichPipe.fileHandleForReading.readDataToEndOfFile()
            if let whichResult = String(data: whichData, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines),
               !whichResult.isEmpty && !candidatePaths.contains(whichResult) && FileManager.default.isExecutableFile(atPath: whichResult) {
                candidatePaths.append(whichResult)
            }
        }

        if candidatePaths.isEmpty {
            let msg = "未检测到可用的内置或系统 FFmpeg 引擎。请检查客户端完整性。"
            DispatchQueue.main.async {
                self.notifyTrimError(msg)
            }
            return
        }

        var arguments = ["-i", input]
        if !start.isEmpty && start != "00:00:00" {
            arguments.append(contentsOf: ["-ss", start])
        }
        if !end.isEmpty {
            arguments.append(contentsOf: ["-to", end])
        }
        arguments.append(contentsOf: [
            "-c:v", "copy",
            "-c:a", "copy",
            "-avoid_negative_ts", "make_zero",
            "-y",
            finalOutput
        ])

        // 针对不同 CPU 架构环境 (Apple Silicon / Intel) 进行多级候选探测与自动容错
        var activeTask: Process? = nil
        var errorPipe: Pipe? = nil
        var lastError: Error? = nil

        for binPath in candidatePaths {
            let task = Process()
            task.executableURL = URL(fileURLWithPath: binPath)
            task.currentDirectoryURL = URL(fileURLWithPath: NSTemporaryDirectory())
            task.arguments = arguments

            let ep = Pipe()
            task.standardError = ep
            task.standardOutput = Pipe()

            do {
                try task.run()
                activeTask = task
                errorPipe = ep
                break // 成功启动，跳出候选探测
            } catch {
                lastError = error
                // 遇到 CPU 架构不匹配 (Bad CPU type / EBADARCH) 或权限异常时，平滑回退至下一候选
                continue
            }
        }

        guard let task = activeTask, let pipe = errorPipe else {
            let detail = lastError?.localizedDescription ?? "可执行文件中的CPU类型不正确或缺少执行权限"
            let msg = "FFmpeg 启动失败: \(detail)。已尝试探测候选: \(candidatePaths.joined(separator: ", "))"
            DispatchQueue.main.async {
                self.notifyTrimError(msg)
            }
            return
        }

        task.waitUntilExit()
        let exitCode = task.terminationStatus
        let errorData = pipe.fileHandleForReading.readDataToEndOfFile()
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
