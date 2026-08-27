import SwiftUI

struct PlanYourTripView: View {
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                HeroPanel(
                    title: "Plan Your Trip",
                    subtitle: "Everything you need to know before visiting Dzaleka Refugee Camp.",
                    systemImage: "airplane",
                    imageURL: URL(string: "https://services.dzaleka.com/images/dzaleka-entrance.jpg")
                ) {
                    HStack(spacing: 10) {
                        StatusPill(text: "Central Malawi", systemImage: "mappin", tint: .white)
                        StatusPill(text: "~45 min from Lilongwe", systemImage: "car", tint: .white)
                    }
                }
                .padding(.horizontal)
                .staggeredAppear(index: 0)

                // Quick links
                VStack(alignment: .leading, spacing: 14) {
                    SectionTitle(title: "Trip resources", systemImage: "list.bullet.rectangle")

                    NavigationLink {
                        VisitorEssentialsView()
                    } label: {
                        InfoRow(
                            title: "Visitor Essentials",
                            detail: "Packing list, currency, connectivity, health, etiquette, and what to expect.",
                            systemImage: "checklist",
                            tint: VisitTheme.accent
                        )
                    }
                    .buttonStyle(.plain)

                    NavigationLink {
                        SafeTravelView()
                    } label: {
                        InfoRow(
                            title: "Safe Travel",
                            detail: "Emergency contacts, health warnings, embassy info, and medical facilities.",
                            systemImage: "cross.circle",
                            tint: VisitTheme.rose
                        )
                    }
                    .buttonStyle(.plain)

                    NavigationLink {
                        AboutDzalekaView()
                    } label: {
                        InfoRow(
                            title: "About Dzaleka",
                            detail: "History, demographics, community life, and why tourism matters.",
                            systemImage: "building.2",
                            tint: VisitTheme.blue
                        )
                    }
                    .buttonStyle(.plain)
                }
                .visitCard()
                .padding(.horizontal)
                .staggeredAppear(index: 1)

                // Weather
                VStack(alignment: .leading, spacing: 14) {
                    SectionTitle(title: "Best time to visit", subtitle: "Dzaleka has three main seasons.", systemImage: "cloud.sun")

                    seasonCard(
                        season: "Cool & Dry",
                        months: "May – August",
                        description: "Ideal for walking tours. Daytime around 24°C (75°F), chilly at night.",
                        systemImage: "thermometer.snowflake",
                        tint: VisitTheme.blue
                    )
                    seasonCard(
                        season: "Hot & Dry",
                        months: "September – November",
                        description: "Temperatures soar to 30°C+ (86°F+). Bring sunscreen and water.",
                        systemImage: "sun.max",
                        tint: VisitTheme.accent
                    )
                    seasonCard(
                        season: "Warm & Wet",
                        months: "December – April",
                        description: "Rainy season. Roads may be muddy. Wear waterproof shoes.",
                        systemImage: "cloud.rain",
                        tint: VisitTheme.green
                    )
                }
                .visitCard()
                .padding(.horizontal)
                .staggeredAppear(index: 2)

                // Getting there
                VStack(alignment: .leading, spacing: 14) {
                    SectionTitle(title: "Getting there", subtitle: "From Lilongwe to Dzaleka", systemImage: "car")

                    InfoRow(
                        title: "By car or taxi",
                        detail: "45 minutes from Lilongwe via the M1 highway toward Dowa. Taxis can be arranged from the city center.",
                        systemImage: "car",
                        tint: VisitTheme.primary
                    )
                    InfoRow(
                        title: "By minibus",
                        detail: "Minibuses run from Lilongwe Old Town Bus Depot toward Dowa. Ask to stop at Dzaleka.",
                        systemImage: "bus",
                        tint: VisitTheme.green
                    )
                    InfoRow(
                        title: "Meeting your guide",
                        detail: "Your guide will meet you at the confirmed meeting point. Staff will share arrival instructions.",
                        systemImage: "person.crop.circle.badge.checkmark",
                        tint: VisitTheme.accent
                    )
                }
                .visitCard()
                .padding(.horizontal)
                .staggeredAppear(index: 3)

                // Cultural tips
                VStack(alignment: .leading, spacing: 14) {
                    SectionTitle(title: "Cultural tips", subtitle: "Respectful visitor behavior", systemImage: "heart.text.square")

                    tipRow("Greet people warmly", "A handshake and smile go a long way. Learn a few words in Chichewa or French.", "hand.wave")
                    tipRow("Dress modestly", "Cover shoulders and knees — especially when visiting schools or churches.", "tshirt")
                    tipRow("Ask before taking photos", "Never photograph someone without permission. Some areas are photo-restricted.", "camera")
                    tipRow("Follow your guide", "Your guide knows community norms. Follow their lead on where to go and what to do.", "figure.walk")
                    tipRow("Support local businesses", "Buy from camp artisans and vendors. Your purchases make a direct impact.", "bag")
                }
                .visitCard()
                .padding(.horizontal)
                .staggeredAppear(index: 4)

                // Book CTA
                NavigationLink {
                    BookingRequestView()
                } label: {
                    HStack(spacing: 12) {
                        IconBadge(systemImage: "calendar.badge.plus", tint: .white)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Ready to book?")
                                .font(.headline)
                                .foregroundStyle(.white)
                            Text("Request a guided visit now")
                                .font(.caption)
                                .foregroundStyle(.white.opacity(0.8))
                        }
                        Spacer()
                        Image(systemName: "chevron.right")
                            .foregroundStyle(.white.opacity(0.6))
                    }
                    .padding(16)
                    .background(VisitTheme.heroGradient, in: RoundedRectangle(cornerRadius: VisitTheme.cardRadius, style: .continuous))
                    .shadow(color: VisitTheme.shadowDeep, radius: 10, x: 0, y: 5)
                }
                .buttonStyle(.plain)
                .padding(.horizontal)
                .staggeredAppear(index: 5)
            }
            .padding(.bottom, 24)
        }
        .visitScreenBackground()
        .navigationTitle("Plan Your Trip")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func seasonCard(season: String, months: String, description: String, systemImage: String, tint: Color) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: systemImage)
                .font(.title2)
                .foregroundStyle(tint)
                .frame(width: 40, height: 40)
                .background(tint.opacity(0.10), in: RoundedRectangle(cornerRadius: 10))
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 3) {
                HStack {
                    Text(season).font(.subheadline.weight(.bold))
                    Spacer()
                    Text(months).font(.caption.weight(.medium)).foregroundStyle(tint)
                }
                Text(description)
                    .font(.caption)
                    .foregroundStyle(VisitTheme.secondaryText)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 0)
        }
        .visitInset()
    }

    private func tipRow(_ title: String, _ detail: String, _ systemImage: String) -> some View {
        InfoRow(title: title, detail: detail, systemImage: systemImage, tint: VisitTheme.primary)
    }
}
