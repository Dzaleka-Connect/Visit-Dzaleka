import SwiftUI

struct DiscoverView: View {
    @EnvironmentObject private var appModel: AppViewModel
    @State private var selectedCategory = "All"

    private let categories: [(String, String, Color)] = [
        ("All", "sparkles", VisitTheme.primary),
        ("Arts", "paintpalette", VisitTheme.accent),
        ("Food", "basket", VisitTheme.green),
        ("Community", "person.3", VisitTheme.blue),
        ("Sports", "sportscourt", VisitTheme.violet),
        ("Nature", "leaf", VisitTheme.green),
        ("Shopping", "bag", VisitTheme.clay)
    ]

    private let experiences: [(title: String, subtitle: String, category: String, systemImage: String, tint: Color)] = [
        ("Traditional Music & Dance", "Experience live performances from the vibrant Congolese, Burundian, and Rwandan music traditions.", "Arts", "music.note.list", VisitTheme.accent),
        ("Local Art Galleries", "Visit studios where refugee artists create paintings, sculptures, and mixed media works.", "Arts", "paintpalette.fill", VisitTheme.accent),
        ("Dzaleka Market Tour", "Walk through the bustling market selling fresh produce, clothing, and handmade goods.", "Food", "basket.fill", VisitTheme.green),
        ("Community Kitchen Experience", "Taste authentic refugee cuisine — Congolese, Burundian, Ethiopian, and more.", "Food", "fork.knife", VisitTheme.green),
        ("Youth Football Matches", "Watch or join community football matches organized by local youth groups.", "Sports", "sportscourt.fill", VisitTheme.violet),
        ("Community Organizations", "Learn about grassroots NGOs, schools, and social enterprises run by refugees.", "Community", "building.2.fill", VisitTheme.blue),
        ("Community Conversations", "Meet local hosts and learn about daily life, resilience, and community initiatives.", "Community", "text.bubble.fill", VisitTheme.blue),
        ("Nature Walk", "Explore the natural surroundings of the camp and nearby landscape.", "Nature", "leaf.fill", VisitTheme.green),
        ("Craft Shopping", "Purchase handmade jewelry, bags, and crafts directly from artisans.", "Shopping", "bag.fill", VisitTheme.clay),
        ("Tailoring Workshops", "Visit tailors who create custom clothing from vibrant African fabrics.", "Shopping", "scissors", VisitTheme.clay)
    ]

    private var filteredExperiences: [(title: String, subtitle: String, category: String, systemImage: String, tint: Color)] {
        if selectedCategory == "All" { return experiences }
        return experiences.filter { $0.category == selectedCategory }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                PhotoHero(
                    title: "Things to Do",
                    subtitle: "Experiences, culture, and community",
                    imageURL: URL(string: "https://services.dzaleka.com/images/dzaleka-culture.jpg"),
                    height: 200
                )
                .padding(.horizontal)
                .staggeredAppear(index: 0)

                // Category filter
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(categories, id: \.0) { category in
                            Button {
                                VisitHaptic.selection()
                                selectedCategory = category.0
                            } label: {
                                CategoryChip(
                                    label: category.0,
                                    systemImage: category.1,
                                    tint: category.2,
                                    isSelected: selectedCategory == category.0
                                )
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal)
                }
                .staggeredAppear(index: 1)

                // Experience cards
                LazyVStack(spacing: 16) {
                    ForEach(Array(filteredExperiences.enumerated()), id: \.element.title) { index, experience in
                        experienceCard(experience)
                            .staggeredAppear(index: index + 2)
                    }
                }
                .padding(.horizontal)

                // Plan your visit CTA
                VStack(alignment: .leading, spacing: 14) {
                    SectionTitle(
                        title: "Ready to visit?",
                        subtitle: "Book a guided walking tour with a local guide.",
                        systemImage: "calendar.badge.plus"
                    )
                    NavigationLink {
                        BookingRequestView()
                    } label: {
                        Label("Request a visit", systemImage: "paperplane.fill")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                }
                .visitFeaturedCard(tint: VisitTheme.primary)
                .padding(.horizontal)
                .staggeredAppear(index: filteredExperiences.count + 2)
            }
            .padding(.bottom, 24)
        }
        .visitScreenBackground()
        .navigationTitle("Discover")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func experienceCard(_ experience: (title: String, subtitle: String, category: String, systemImage: String, tint: Color)) -> some View {
        HStack(alignment: .top, spacing: 14) {
            Image(systemName: experience.systemImage)
                .font(.title2.weight(.semibold))
                .foregroundStyle(experience.tint)
                .frame(width: 48, height: 48)
                .background(experience.tint.opacity(0.10), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: 6) {
                Text(experience.title)
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(VisitTheme.ink)

                Text(experience.subtitle)
                    .font(.caption)
                    .foregroundStyle(VisitTheme.secondaryText)
                    .fixedSize(horizontal: false, vertical: true)

                StatusPill(text: experience.category, systemImage: "tag", tint: experience.tint)
            }

            Spacer(minLength: 0)
        }
        .visitCard()
    }
}
