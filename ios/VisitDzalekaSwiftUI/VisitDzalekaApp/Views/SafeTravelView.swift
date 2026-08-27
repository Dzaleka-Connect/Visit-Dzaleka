import SwiftUI

struct SafeTravelView: View {
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                HeroPanel(
                    title: "Safe Travel",
                    subtitle: "Emergency contacts, health warnings, and medical facilities near Dzaleka.",
                    systemImage: "cross.circle",
                    imageURL: nil
                ) {
                    StatusPill(text: "Keep accessible offline", systemImage: "arrow.down.circle", tint: .white)
                }
                .padding(.horizontal)
                .staggeredAppear(index: 0)

                // Emergency contacts
                VStack(alignment: .leading, spacing: 14) {
                    SectionTitle(title: "Emergency contacts", subtitle: "Save these numbers before you travel.", systemImage: "phone.fill")

                    emergencyContact("Police", "Malawi Police Service", "997", .blue)
                    emergencyContact("Ambulance", "Medical Emergency", "998", VisitTheme.rose)
                    emergencyContact("Fire", "Fire Brigade", "999", .orange)
                    emergencyContact("UNHCR", "Dzaleka Camp Office", "+265 1 277 388", VisitTheme.blue)

                    Divider()

                    Text("In an emergency at the camp, contact your guide first. They can coordinate with local authorities faster than an outside call.")
                        .font(.caption)
                        .foregroundStyle(VisitTheme.secondaryText)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .visitFeaturedCard(tint: VisitTheme.rose)
                .padding(.horizontal)
                .staggeredAppear(index: 1)

                // Health warnings
                VStack(alignment: .leading, spacing: 14) {
                    SectionTitle(title: "Health warnings", systemImage: "exclamationmark.triangle")

                    healthWarning(
                        title: "Malaria",
                        detail: "Dzaleka is in a high-risk malaria zone. Use DEET-based repellent, sleep under treated nets, and consider antimalarial medication. Consult your doctor before travel.",
                        systemImage: "ant",
                        severity: .high
                    )
                    healthWarning(
                        title: "Waterborne disease",
                        detail: "Drink only bottled or boiled water. Avoid ice from unknown sources. Wash hands frequently.",
                        systemImage: "drop.triangle",
                        severity: .high
                    )
                    healthWarning(
                        title: "Sun exposure",
                        detail: "UV index is often extreme. Wear SPF 50+, a hat, and seek shade during midday hours.",
                        systemImage: "sun.max.trianglebadge.exclamationmark",
                        severity: .medium
                    )
                    healthWarning(
                        title: "Dust & respiratory",
                        detail: "Dry season can be dusty. If you have asthma, bring your inhaler.",
                        systemImage: "wind",
                        severity: .low
                    )
                }
                .visitCard()
                .padding(.horizontal)
                .staggeredAppear(index: 2)

                // Medical facilities
                VStack(alignment: .leading, spacing: 14) {
                    SectionTitle(title: "Medical facilities", subtitle: "Nearest healthcare options", systemImage: "stethoscope")

                    facilityCard(
                        name: "Dzaleka Health Centre",
                        detail: "On-site basic medical care. Open during business hours.",
                        distance: "Inside camp",
                        systemImage: "cross.circle",
                        tint: VisitTheme.green
                    )
                    facilityCard(
                        name: "Dowa District Hospital",
                        detail: "Full hospital services including emergency care.",
                        distance: "~20 min drive",
                        systemImage: "building.2",
                        tint: VisitTheme.blue
                    )
                    facilityCard(
                        name: "Kamuzu Central Hospital",
                        detail: "Major referral hospital in Lilongwe for serious medical needs.",
                        distance: "~1 hour drive",
                        systemImage: "cross.case",
                        tint: VisitTheme.primary
                    )
                    facilityCard(
                        name: "Private clinics (Lilongwe)",
                        detail: "ABC Health, Partners in Hope, and other private facilities for more comfortable care.",
                        distance: "~1 hour drive",
                        systemImage: "heart.text.square",
                        tint: VisitTheme.accent
                    )
                }
                .visitCard()
                .padding(.horizontal)
                .staggeredAppear(index: 3)

                // Travel safety
                VStack(alignment: .leading, spacing: 14) {
                    SectionTitle(title: "General safety", systemImage: "shield.checkered")

                    InfoRow(
                        title: "Stay with your guide",
                        detail: "Your guide knows the community. Don't wander alone, especially after dark.",
                        systemImage: "figure.walk",
                        tint: VisitTheme.primary
                    )
                    InfoRow(
                        title: "Secure your belongings",
                        detail: "Don't display expensive electronics or large amounts of cash.",
                        systemImage: "lock.shield",
                        tint: VisitTheme.accent
                    )
                    InfoRow(
                        title: "Road safety",
                        detail: "Roads near Dzaleka can be unpaved. Drive cautiously, especially in rainy season.",
                        systemImage: "car.side",
                        tint: VisitTheme.blue
                    )
                    InfoRow(
                        title: "Embassy registration",
                        detail: "Register with your country's embassy in Lilongwe before traveling to Dzaleka.",
                        systemImage: "flag",
                        tint: VisitTheme.violet
                    )
                }
                .visitCard()
                .padding(.horizontal)
                .staggeredAppear(index: 4)

                // Insurance
                VStack(alignment: .leading, spacing: 10) {
                    Label("Travel insurance is strongly recommended", systemImage: "shield.checkered.fill")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(VisitTheme.accent)
                    Text("Ensure your policy covers Malawi, medical evacuation, and trip cancellation. Some policies exclude refugee camp visits — check the fine print.")
                        .font(.caption)
                        .foregroundStyle(VisitTheme.secondaryText)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .visitCard()
                .padding(.horizontal)
                .staggeredAppear(index: 5)
            }
            .padding(.bottom, 24)
        }
        .visitScreenBackground()
        .navigationTitle("Safe Travel")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func emergencyContact(_ title: String, _ subtitle: String, _ number: String, _ tint: Color) -> some View {
        HStack(spacing: 12) {
            IconBadge(systemImage: "phone.fill", tint: tint)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.subheadline.weight(.semibold))
                Text(subtitle).font(.caption).foregroundStyle(VisitTheme.secondaryText)
            }
            Spacer()
            if let url = URL(string: "tel:\(number.replacingOccurrences(of: " ", with: ""))") {
                Link(destination: url) {
                    Text(number)
                        .font(.subheadline.weight(.bold).monospacedDigit())
                        .foregroundStyle(tint)
                }
            } else {
                Text(number)
                    .font(.subheadline.weight(.bold).monospacedDigit())
                    .foregroundStyle(tint)
            }
        }
        .visitInset()
    }

    private enum Severity { case high, medium, low }

    private func healthWarning(title: String, detail: String, systemImage: String, severity: Severity) -> some View {
        let tint: Color = {
            switch severity {
            case .high: return VisitTheme.rose
            case .medium: return .orange
            case .low: return VisitTheme.secondaryText
            }
        }()

        return HStack(alignment: .top, spacing: 12) {
            Image(systemName: systemImage)
                .font(.title3.weight(.semibold))
                .foregroundStyle(tint)
                .frame(width: 36, height: 36)
                .background(tint.opacity(0.10), in: RoundedRectangle(cornerRadius: 10))
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(title).font(.subheadline.weight(.bold))
                    Spacer()
                    if severity == .high {
                        StatusPill(text: "High risk", systemImage: "exclamationmark.triangle", tint: tint)
                    }
                }
                Text(detail)
                    .font(.caption)
                    .foregroundStyle(VisitTheme.secondaryText)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .visitInset()
    }

    private func facilityCard(name: String, detail: String, distance: String, systemImage: String, tint: Color) -> some View {
        HStack(alignment: .top, spacing: 12) {
            IconBadge(systemImage: systemImage, tint: tint)
            VStack(alignment: .leading, spacing: 3) {
                Text(name).font(.subheadline.weight(.semibold))
                Text(detail).font(.caption).foregroundStyle(VisitTheme.secondaryText).fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 0)
            StatusPill(text: distance, systemImage: "car", tint: tint)
        }
        .visitInset()
    }
}
