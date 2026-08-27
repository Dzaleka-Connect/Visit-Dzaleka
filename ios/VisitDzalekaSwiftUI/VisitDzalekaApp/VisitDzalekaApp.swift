import SwiftUI

@main
struct VisitDzalekaApp: App {
    @StateObject private var appModel = AppViewModel(api: URLSessionVisitDzalekaAPI())

    var body: some Scene {
        WindowGroup {
            RootTabView()
                .environmentObject(appModel)
                .tint(VisitTheme.primary)
        }
    }
}
