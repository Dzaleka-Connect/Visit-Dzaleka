import SwiftUI

struct RootTabView: View {
    @EnvironmentObject private var appModel: AppViewModel

    var body: some View {
        TabView {
            NavigationStack {
                HomeView()
            }
            .tabItem {
                Label("Explore", systemImage: "map")
            }

            NavigationStack {
                DiscoverView()
            }
            .tabItem {
                Label("Discover", systemImage: "sparkles")
            }

            NavigationStack {
                BookingRequestView()
            }
            .tabItem {
                Label("Book", systemImage: "calendar.badge.plus")
            }

            NavigationStack {
                MyTripsView()
            }
            .tabItem {
                Label("Trips", systemImage: "ticket")
            }

            if appModel.content.currentUser?.role == .admin || appModel.content.currentUser?.role == .coordinator {
                NavigationStack {
                    AdminDashboardView()
                }
                .tabItem {
                    Label("Admin", systemImage: "shield.lefthalf.filled")
                }
            } else if appModel.content.currentUser?.role?.canUseGuideWorkflow == true {
                NavigationStack {
                    GuideDashboardView()
                }
                .tabItem {
                    Label("Guide", systemImage: "person.crop.circle.badge.checkmark")
                }
            }
        }
        .overlay(alignment: .top) {
            if let message = appModel.bannerMessage {
                BannerMessage(message: message)
                    .padding()
                    .transition(.move(edge: .top).combined(with: .opacity))
                    .onTapGesture {
                        appModel.bannerMessage = nil
                    }
            }
        }
    }
}
