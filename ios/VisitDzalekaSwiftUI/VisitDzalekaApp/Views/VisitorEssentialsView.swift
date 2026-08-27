import SwiftUI

struct VisitorEssentialsView: View {
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                HeroPanel(
                    title: "Visitor Essentials",
                    subtitle: "What to pack, currency, health, connectivity, and etiquette for your Dzaleka visit.",
                    systemImage: "checklist",
                    imageURL: nil
                ) {
                    StatusPill(text: "Updated Jan 2026", systemImage: "clock", tint: .white)
                }
                .padding(.horizontal)
                .staggeredAppear(index: 0)

                // What to bring
                essentialsSection(
                    title: "What to bring",
                    systemImage: "bag",
                    items: [
                        ("Comfortable walking shoes", "You'll be on unpaved paths — closed-toe shoes are essential.", "shoe"),
                        ("Sun protection", "Sunscreen, sunglasses, and a hat. Dzaleka can be very hot.", "sun.max"),
                        ("Water bottle", "Bring at least 1L. Bottled water is also available for purchase.", "waterbottle"),
                        ("Light rain jacket", "During rainy season (Dec–Apr), sudden showers are common.", "cloud.rain"),
                        ("Cash in MWK", "Small bills for market purchases. ATMs are only in Lilongwe/Dowa.", "banknote"),
                        ("Phone & charger", "For photos (with permission) and navigation. Power banks are useful.", "battery.100.bolt"),
                        ("Modest clothing", "Cover shoulders and knees, especially at schools and churches.", "tshirt")
                    ],
                    tint: VisitTheme.accent,
                    index: 1
                )

                // Currency & money
                essentialsSection(
                    title: "Currency & payments",
                    systemImage: "banknote",
                    items: [
                        ("Malawi Kwacha (MWK)", "The local currency. USD and EUR are accepted at some Lilongwe hotels but not at Dzaleka.", "dollarsign.circle"),
                        ("Mobile money", "Airtel Money and TNM Mpamba are widely used. Set up before arriving.", "iphone"),
                        ("Cash is king", "Most camp vendors only accept cash. Bring small bills (500, 1000, 2000 MWK).", "creditcard"),
                        ("Tour payment", "Tour fees can be paid via cash, mobile money, or card depending on your booking.", "checkmark.seal")
                    ],
                    tint: VisitTheme.green,
                    index: 2
                )

                // Health & safety
                essentialsSection(
                    title: "Health preparation",
                    systemImage: "cross.circle",
                    items: [
                        ("Malaria prevention", "Dzaleka is in a malaria zone. Use insect repellent and consider prophylaxis.", "ant"),
                        ("Drink bottled water", "Tap water is not safe to drink. Buy sealed bottled water.", "drop"),
                        ("First aid kit", "Bring basics: plasters, antiseptic, any personal medication.", "cross.case"),
                        ("Travel insurance", "Ensure you have coverage that includes Malawi. Nearest hospital is in Dowa.", "shield.checkered"),
                        ("COVID considerations", "Check current Malawi entry requirements. Masks may be requested in some spaces.", "facemask")
                    ],
                    tint: VisitTheme.rose,
                    index: 3
                )

                // Connectivity
                essentialsSection(
                    title: "Connectivity",
                    systemImage: "wifi",
                    items: [
                        ("Mobile data", "Airtel and TNM have coverage. Buy a SIM at Lilongwe airport or town.", "antenna.radiowaves.left.and.right"),
                        ("WiFi", "Limited WiFi at some camp organizations. Don't rely on internet access.", "wifi.slash"),
                        ("Offline maps", "Download Google Maps offline for the Dowa/Dzaleka area before you travel.", "map")
                    ],
                    tint: VisitTheme.blue,
                    index: 4
                )

                // Etiquette
                VStack(alignment: .leading, spacing: 14) {
                    SectionTitle(title: "Visitor etiquette", subtitle: "Show respect for the community.", systemImage: "heart.text.square")

                    VStack(spacing: 2) {
                        etiquetteRow("✓", "Always follow your guide's instructions", VisitTheme.green)
                        etiquetteRow("✓", "Ask before photographing anyone", VisitTheme.green)
                        etiquetteRow("✓", "Greet people warmly and respectfully", VisitTheme.green)
                        etiquetteRow("✓", "Buy from local vendors to support livelihoods", VisitTheme.green)
                        etiquetteRow("✗", "Don't photograph children without guardian consent", VisitTheme.rose)
                        etiquetteRow("✗", "Don't enter private areas without permission", VisitTheme.rose)
                        etiquetteRow("✗", "Don't share sensationalized content about residents", VisitTheme.rose)
                    }
                }
                .visitCard()
                .padding(.horizontal)
                .staggeredAppear(index: 5)
            }
            .padding(.bottom, 24)
        }
        .visitScreenBackground()
        .navigationTitle("Visitor Essentials")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func essentialsSection(title: String, systemImage: String, items: [(String, String, String)], tint: Color, index: Int) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionTitle(title: title, systemImage: systemImage)
            ForEach(items, id: \.0) { item in
                InfoRow(title: item.0, detail: item.1, systemImage: item.2, tint: tint)
            }
        }
        .visitCard()
        .padding(.horizontal)
        .staggeredAppear(index: index)
    }

    private func etiquetteRow(_ icon: String, _ text: String, _ tint: Color) -> some View {
        HStack(spacing: 10) {
            Text(icon)
                .font(.subheadline.weight(.bold))
                .foregroundStyle(tint)
                .frame(width: 24)
            Text(text)
                .font(.subheadline)
                .foregroundStyle(VisitTheme.ink)
            Spacer(minLength: 0)
        }
        .padding(.vertical, 6)
    }
}
