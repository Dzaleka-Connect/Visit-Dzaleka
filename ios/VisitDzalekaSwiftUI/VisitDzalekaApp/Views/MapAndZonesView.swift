import SwiftUI

struct MapAndZonesView: View {
    @EnvironmentObject private var appModel: AppViewModel
    @State private var selectedCategory = "All"

    private var categories: [String] {
        let values = appModel.content.pointsOfInterest.compactMap(\.category)
        return ["All"] + Array(Set(values)).sorted()
    }

    private var filteredPoints: [PointOfInterest] {
        if selectedCategory == "All" {
            return appModel.content.pointsOfInterest
        }
        return appModel.content.pointsOfInterest.filter { $0.category == selectedCategory }
    }

    private var defaultMeetingPoint: MeetingPoint? {
        appModel.content.meetingPoints.first(where: { $0.isDefault == true }) ?? appModel.content.meetingPoints.first
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 18) {
                HeroPanel(
                    title: "Map and visitor stops",
                    subtitle: "Use this as guidance only. Routes are confirmed by guides and may change for safety, events, weather, or community permission.",
                    systemImage: "map",
                    imageURL: URL(string: "https://services.dzaleka.com/images/dzaleka-aerial.jpg")
                ) {
                    StatusPill(text: "\(appModel.content.pointsOfInterest.count) stops", systemImage: "mappin.and.ellipse", tint: .white)
                }
                .staggeredAppear(index: 0)

                meetingPointCard
                    .staggeredAppear(index: 1)

                if categories.count > 1 {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(categories, id: \.self) { category in
                                Button {
                                    VisitHaptic.selection()
                                    selectedCategory = category
                                } label: {
                                    Text(category.titleCasedStatus)
                                        .font(.caption.weight(.semibold))
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 8)
                                        .background(
                                            selectedCategory == category ? VisitTheme.primary : VisitTheme.card,
                                            in: Capsule()
                                        )
                                        .foregroundStyle(selectedCategory == category ? .white : VisitTheme.ink)
                                        .overlay(
                                            Capsule()
                                                .stroke(VisitTheme.border, lineWidth: 0.6)
                                        )
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                    .accessibilityLabel("Filter points of interest by category")
                }

                SectionTitle(
                    title: "Visitor stops and route areas",
                    subtitle: "Photo, access, and mobility guidance helps protect visitors and residents.",
                    systemImage: "mappin.circle"
                )

                if filteredPoints.isEmpty {
                    EmptyPanel(
                        title: "No locations found",
                        message: "There are no public points of interest available right now.",
                        systemImage: "mappin.slash"
                    )
                } else {
                    ForEach(filteredPoints) { point in
                        pointCard(point)
                    }
                }
            }
            .padding()
        }
        .visitScreenBackground()
        .navigationTitle("Map and Zones")
        .navigationBarTitleDisplayMode(.inline)
        .refreshable {
            await appModel.refresh()
        }
    }

    private var meetingPointCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            SectionTitle(
                title: defaultMeetingPoint?.name ?? "Meeting point",
                subtitle: defaultMeetingPoint?.address
            )
            if let instructions = defaultMeetingPoint?.meetingInstructions, !instructions.isEmpty {
                Label(instructions, systemImage: "person.text.rectangle")
                    .font(.subheadline)
            }
            if let guideNote = defaultMeetingPoint?.guideIdentificationNote, !guideNote.isEmpty {
                Label(guideNote, systemImage: "checkmark.seal")
                    .font(.subheadline)
            }
            if let buffer = defaultMeetingPoint?.arrivalBufferMinutes {
                Label("Arrive \(buffer) minutes early.", systemImage: "clock")
                    .font(.subheadline)
            }
            Label("Ask before photographing people, homes, or organization spaces.", systemImage: "camera.aperture")
                .font(.subheadline)

            if let url = defaultMeetingPoint?.googleMapsUrl, let destination = URL(string: url) {
                Link(destination: destination) {
                    Label("Open in Maps", systemImage: "map")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
            }
        }
        .visitCard()
    }

    private func pointCard(_ point: PointOfInterest) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(point.name)
                        .font(.headline)
                    Text(point.category ?? "Location")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(VisitTheme.primary)
                }
                Spacer()
                if point.requiresPermission == true {
                    StatusPill(text: "Permission", systemImage: "lock", tint: .orange)
                }
            }

            if let description = point.description, !description.isEmpty {
                Text(description)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }

            LazyVGrid(columns: VisitGrid.compactColumns, spacing: 8) {
                locationMeta("Duration", point.estimatedDurationMinutes.map { "\($0) min" } ?? "Varies", "clock")
                locationMeta("Photos", point.photoPolicy?.label ?? "Ask first", "camera")
                locationMeta("Mobility", point.mobilityLevel?.label ?? "Check route", "figure.walk")
                locationMeta("Access", point.requiresPermission == true ? "Ask staff" : "Public route", "checkmark.shield")
            }

            if let url = point.serviceDirectoryUrl, let destination = URL(string: url) {
                Link(destination: destination) {
                    Label("Open organization listing", systemImage: "building.2")
                        .font(.subheadline)
                }
            }
        }
        .visitCard()
    }

    private func locationMeta(_ title: String, _ value: String, _ systemImage: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: systemImage)
                .foregroundStyle(VisitTheme.primary)
                .frame(width: 22, height: 22)
            VStack(alignment: .leading, spacing: 1) {
                Text(value)
                    .font(.caption.weight(.semibold))
                    .lineLimit(1)
                    .minimumScaleFactor(0.85)
                Text(title)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            Spacer(minLength: 0)
        }
        .padding(10)
        .background(.secondary.opacity(0.08), in: RoundedRectangle(cornerRadius: 8))
    }
}
