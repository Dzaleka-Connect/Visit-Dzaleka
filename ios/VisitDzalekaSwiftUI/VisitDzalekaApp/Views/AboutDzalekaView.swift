import SwiftUI

struct AboutDzalekaView: View {
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                PhotoHero(
                    title: "About Dzaleka",
                    subtitle: "Malawi's largest refugee camp and a thriving community",
                    imageURL: URL(string: "https://services.dzaleka.com/images/dzaleka-community.jpg"),
                    height: 240
                )
                .padding(.horizontal)
                .staggeredAppear(index: 0)

                // Overview
                VStack(alignment: .leading, spacing: 14) {
                    SectionTitle(title: "Overview", systemImage: "info.circle")

                    Text("Dzaleka Refugee Camp was established in 1994 in the Dowa district of central Malawi, approximately 45 km from the capital Lilongwe. Originally built for 10,000–12,000 people, it now hosts over 56,000 refugees and asylum seekers from the Democratic Republic of Congo, Burundi, Rwanda, Ethiopia, Somalia, and other countries.")
                        .font(.subheadline)
                        .foregroundStyle(VisitTheme.secondaryText)
                        .fixedSize(horizontal: false, vertical: true)

                    LazyVGrid(columns: VisitGrid.compactColumns, spacing: 10) {
                        statTile("Population", "56,000+", "person.3.fill", VisitTheme.primary)
                        statTile("Nationalities", "10+", "globe", VisitTheme.blue)
                        statTile("Established", "1994", "calendar", VisitTheme.accent)
                        statTile("Location", "Dowa, Malawi", "mappin", VisitTheme.green)
                    }
                }
                .visitCard()
                .padding(.horizontal)
                .staggeredAppear(index: 1)

                // Why visit
                VStack(alignment: .leading, spacing: 14) {
                    SectionTitle(title: "Why tourism matters", subtitle: "Changing narratives through direct connection", systemImage: "heart.text.square")

                    Text("Dzaleka is not just a refugee camp — it's a community of entrepreneurs, artists, educators, and innovators. Tourism challenges the narrative of refugees as passive recipients of aid, revealing them as active, capable hosts.")
                        .font(.subheadline)
                        .foregroundStyle(VisitTheme.secondaryText)
                        .fixedSize(horizontal: false, vertical: true)

                    impactRow(
                        title: "Economic empowerment",
                        detail: "Tour fees go directly to refugee guides, creating sustainable income without dependence on aid.",
                        systemImage: "banknote",
                        tint: VisitTheme.green
                    )
                    impactRow(
                        title: "Cultural exchange",
                        detail: "Visitors gain authentic understanding while residents share their skills, perspectives, and work on their own terms.",
                        systemImage: "person.2",
                        tint: VisitTheme.blue
                    )
                    impactRow(
                        title: "Dignity and agency",
                        detail: "Hosting visitors empowers refugees as guides, artists, and entrepreneurs — not subjects of pity.",
                        systemImage: "star",
                        tint: VisitTheme.accent
                    )
                    impactRow(
                        title: "Awareness",
                        detail: "Visitors become ambassadors who share accurate, respectful context about Dzaleka with their networks.",
                        systemImage: "megaphone",
                        tint: VisitTheme.violet
                    )
                }
                .visitCard()
                .padding(.horizontal)
                .staggeredAppear(index: 2)

                // Community life
                VStack(alignment: .leading, spacing: 14) {
                    SectionTitle(title: "Community life", subtitle: "What makes Dzaleka unique", systemImage: "building.2")

                    communityItem("Education", "Multiple schools operate inside the camp, including a secondary school. Several organizations provide adult education and vocational training.", "graduationcap")
                    communityItem("Business", "A vibrant market economy thrives with restaurants, tailors, phone repair shops, barbershops, and artisan workshops.", "storefront")
                    communityItem("Arts & Culture", "Musicians, painters, dancers, and writers produce world-class work. Annual festivals celebrate the multicultural community.", "paintpalette")
                    communityItem("Faith", "Churches, mosques, and community gathering spaces serve as social anchors and support networks.", "building.columns")
                    communityItem("Innovation", "Tech hubs, coding schools, and social enterprises demonstrate the entrepreneurial spirit of residents.", "lightbulb")
                }
                .visitCard()
                .padding(.horizontal)
                .staggeredAppear(index: 3)

                // Languages
                VStack(alignment: .leading, spacing: 12) {
                    SectionTitle(title: "Languages spoken", systemImage: "textformat")
                    
                    let languages = ["French", "Swahili", "Kirundi", "Kinyarwanda", "Chichewa", "English", "Lingala", "Amharic", "Somali"]
                    
                    FlowLayout(spacing: 8) {
                        ForEach(languages, id: \.self) { language in
                            Text(language)
                                .font(.caption.weight(.medium))
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(VisitTheme.primary.opacity(0.08), in: Capsule())
                                .foregroundStyle(VisitTheme.primary)
                        }
                    }
                }
                .visitCard()
                .padding(.horizontal)
                .staggeredAppear(index: 4)

                // About Visit Dzaleka
                VStack(alignment: .leading, spacing: 14) {
                    SectionTitle(title: "About Visit Dzaleka", subtitle: "A refugee-led tourism initiative", systemImage: "heart")

                    Text("Visit Dzaleka is the first refugee-led tourism initiative in Malawi. We connect visitors with Dzaleka Refugee Camp through guided walking tours led by trained refugee guides.")
                        .font(.subheadline)
                        .foregroundStyle(VisitTheme.secondaryText)
                        .fixedSize(horizontal: false, vertical: true)

                    LazyVGrid(columns: VisitGrid.compactColumns, spacing: 10) {
                        statTile("Rating", "4.9★", "star.fill", .orange)
                        statTile("Platform", "2024–Present", "app.badge", VisitTheme.primary)
                    }

                    Link(destination: URL(string: "https://visit.dzaleka.com")!) {
                        InfoRow(
                            title: "Visit our website",
                            detail: "visit.dzaleka.com",
                            systemImage: "safari",
                            tint: VisitTheme.primary
                        )
                    }
                    .buttonStyle(.plain)
                }
                .visitCard()
                .padding(.horizontal)
                .staggeredAppear(index: 5)
            }
            .padding(.bottom, 24)
        }
        .visitScreenBackground()
        .navigationTitle("About Dzaleka")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func statTile(_ title: String, _ value: String, _ systemImage: String, _ tint: Color) -> some View {
        HStack(spacing: 8) {
            Image(systemName: systemImage)
                .foregroundStyle(tint)
                .frame(width: 22)
            VStack(alignment: .leading, spacing: 1) {
                Text(value)
                    .font(.caption.weight(.bold))
                    .monospacedDigit()
                Text(title)
                    .font(.caption2)
                    .foregroundStyle(VisitTheme.secondaryText)
            }
            Spacer(minLength: 0)
        }
        .visitInset(padding: 10)
    }

    private func impactRow(title: String, detail: String, systemImage: String, tint: Color) -> some View {
        InfoRow(title: title, detail: detail, systemImage: systemImage, tint: tint)
    }

    private func communityItem(_ title: String, _ detail: String, _ systemImage: String) -> some View {
        InfoRow(title: title, detail: detail, systemImage: systemImage, tint: VisitTheme.primary)
    }
}

// MARK: - Flow Layout (for language tags)

struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = arrange(proposal: proposal, subviews: subviews)
        return result.size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = arrange(proposal: ProposedViewSize(width: bounds.width, height: bounds.height), subviews: subviews)
        for (index, position) in result.positions.enumerated() {
            subviews[index].place(at: CGPoint(x: bounds.minX + position.x, y: bounds.minY + position.y), proposal: .unspecified)
        }
    }

    private func arrange(proposal: ProposedViewSize, subviews: Subviews) -> (size: CGSize, positions: [CGPoint]) {
        let maxWidth = proposal.width ?? .infinity
        var positions: [CGPoint] = []
        var x: CGFloat = 0
        var y: CGFloat = 0
        var rowHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > maxWidth, x > 0 {
                x = 0
                y += rowHeight + spacing
                rowHeight = 0
            }
            positions.append(CGPoint(x: x, y: y))
            rowHeight = max(rowHeight, size.height)
            x += size.width + spacing
        }

        return (CGSize(width: maxWidth, height: y + rowHeight), positions)
    }
}
