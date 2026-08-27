import SwiftUI
import UIKit

// MARK: - Color Palette

enum VisitTheme {
    // Primary brand (Indigo/Blue to match web app OKLCH 220)
    static let primary = Color(red: 0.10, green: 0.45, blue: 0.85)
    static let primaryDeep = Color(red: 0.05, green: 0.25, blue: 0.55)
    static let primaryLight = Color(red: 0.10, green: 0.45, blue: 0.85).opacity(0.08)
    static let primaryGradientEnd = Color(red: 0.35, green: 0.25, blue: 0.85) // Deep purple

    // Accent & warm tones
    static let accent = Color(red: 0.86, green: 0.48, blue: 0.10)
    static let accentLight = Color(red: 0.86, green: 0.48, blue: 0.10).opacity(0.10)
    static let clay = Color(red: 0.68, green: 0.26, blue: 0.18)
    static let warmSand = Color(red: 0.96, green: 0.93, blue: 0.87)

    // Functional
    static let green = Color(red: 0.08, green: 0.45, blue: 0.27)
    static let blue = Color(red: 0.10, green: 0.45, blue: 0.85)
    static let rose = Color(red: 0.76, green: 0.22, blue: 0.34)
    static let violet = Color(red: 0.42, green: 0.28, blue: 0.62)

    // Semantic text
    static let ink = Color(.label)
    static let secondaryText = Color(.secondaryLabel)
    static let tertiaryText = Color(.tertiaryLabel)

    // Surfaces
    static let background = Color(.systemGroupedBackground)
    static let card = Color(.secondarySystemGroupedBackground)
    static let inset = Color(.tertiarySystemGroupedBackground)
    static let border = Color(.separator).opacity(0.22)
    static let shadow = Color.black.opacity(0.08)
    static let shadowDeep = Color.black.opacity(0.14)

    // Radii
    static let cardRadius: CGFloat = 16
    static let controlRadius: CGFloat = 10
    static let heroRadius: CGFloat = 22
    static let pillRadius: CGFloat = 100

    // Animation
    static let springResponse: Double = 0.45
    static let springDamping: Double = 0.78
    static let staggerDelay: Double = 0.06

    static var defaultSpring: Animation {
        .spring(response: springResponse, dampingFraction: springDamping)
    }

    // Gradients
    static var heroGradient: LinearGradient {
        LinearGradient(
            colors: [
                primary,
                primaryGradientEnd
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    static var warmGradient: LinearGradient {
        LinearGradient(
            colors: [
                Color(red: 0.96, green: 0.88, blue: 0.76),
                Color(red: 0.94, green: 0.82, blue: 0.68)
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    static var subtleGradient: LinearGradient {
        LinearGradient(
            colors: [
                primary.opacity(0.06),
                primary.opacity(0.02)
            ],
            startPoint: .top,
            endPoint: .bottom
        )
    }

    static var discoverGradient: LinearGradient {
        LinearGradient(
            colors: [
                Color(red: 0.14, green: 0.22, blue: 0.38),
                Color(red: 0.08, green: 0.16, blue: 0.30)
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }
}

enum VisitGrid {
    static let cardColumns = [GridItem(.adaptive(minimum: 148), spacing: 10)]
    static let compactColumns = [GridItem(.adaptive(minimum: 132), spacing: 10)]
    static let actionColumns = [GridItem(.adaptive(minimum: 150), spacing: 10)]
}

// MARK: - Card Modifiers

extension View {
    /// Standard elevated card with subtle border and shadow.
    func visitCard(padding: CGFloat = 16) -> some View {
        self
            .padding(padding)
            .background(VisitTheme.card)
            .clipShape(RoundedRectangle(cornerRadius: VisitTheme.cardRadius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: VisitTheme.cardRadius, style: .continuous)
                    .stroke(VisitTheme.border, lineWidth: 0.6)
            )
            .shadow(color: VisitTheme.shadow, radius: 10, x: 0, y: 5)
    }

    /// Featured card with stronger shadow and optional tinted border for hero content.
    func visitFeaturedCard(tint: Color = VisitTheme.primary, padding: CGFloat = 20) -> some View {
        self
            .padding(padding)
            .background(VisitTheme.card)
            .clipShape(RoundedRectangle(cornerRadius: VisitTheme.heroRadius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: VisitTheme.heroRadius, style: .continuous)
                    .stroke(tint.opacity(0.18), lineWidth: 1)
            )
            .shadow(color: VisitTheme.shadowDeep, radius: 16, x: 0, y: 8)
    }

    /// Compact card for grid items and small tiles.
    func visitCompactCard(padding: CGFloat = 12) -> some View {
        self
            .padding(padding)
            .background(VisitTheme.card)
            .clipShape(RoundedRectangle(cornerRadius: VisitTheme.controlRadius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: VisitTheme.controlRadius, style: .continuous)
                    .stroke(VisitTheme.border, lineWidth: 0.5)
            )
            .shadow(color: VisitTheme.shadow.opacity(0.5), radius: 4, x: 0, y: 2)
    }

    /// Inset panel for nested content within cards.
    func visitInset(padding: CGFloat = 12) -> some View {
        self
            .padding(padding)
            .background(VisitTheme.inset)
            .clipShape(RoundedRectangle(cornerRadius: VisitTheme.controlRadius, style: .continuous))
    }

    /// Edge-to-edge section with no card treatment — for breathing room.
    func visitSection() -> some View {
        self
            .padding(.horizontal, 4)
            .padding(.vertical, 8)
    }

    func visitScreenBackground() -> some View {
        self.background(VisitTheme.background.ignoresSafeArea())
    }
}

// MARK: - Typography Presets

extension View {
    func visitLargeTitle() -> some View {
        self
            .font(.system(size: 32, weight: .heavy, design: .default))
    }

    func visitTitle() -> some View {
        self
            .font(.system(size: 24, weight: .bold, design: .default))
    }

    func visitHeadline() -> some View {
        self
            .font(.system(size: 18, weight: .semibold, design: .default))
    }

    func visitBody() -> some View {
        self
            .font(.system(size: 15, weight: .regular, design: .default))
    }

    func visitCaption() -> some View {
        self
            .font(.system(size: 12, weight: .medium, design: .default))
    }
}

// MARK: - Staggered Entry Animation

struct StaggeredAppear: ViewModifier {
    let index: Int
    @State private var isVisible = false

    func body(content: Content) -> some View {
        content
            .opacity(isVisible ? 1 : 0)
            .offset(y: isVisible ? 0 : 14)
            .animation(
                shouldAnimate
                    ? VisitTheme.defaultSpring.delay(Double(index) * VisitTheme.staggerDelay)
                    : .none,
                value: isVisible
            )
            .onAppear { isVisible = true }
    }

    private var shouldAnimate: Bool {
        !UIAccessibility.isReduceMotionEnabled
    }
}

extension View {
    func staggeredAppear(index: Int) -> some View {
        modifier(StaggeredAppear(index: index))
    }
}

// MARK: - Haptic Feedback

enum VisitHaptic {
    static func success() {
        UINotificationFeedbackGenerator().notificationOccurred(.success)
    }

    static func impact(_ style: UIImpactFeedbackGenerator.FeedbackStyle = .medium) {
        UIImpactFeedbackGenerator(style: style).impactOccurred()
    }

    static func selection() {
        UISelectionFeedbackGenerator().selectionChanged()
    }

    static func warning() {
        UINotificationFeedbackGenerator().notificationOccurred(.warning)
    }
}

// MARK: - Date & String Formatting (unchanged)

extension Date {
    var visitShortDate: String {
        formatted(.dateTime.month(.abbreviated).day().year())
    }

    var visitTime: String {
        formatted(.dateTime.hour().minute())
    }
}

extension String {
    var visitAPIDate: String {
        let inputFormatters = [Self.apiDateFormatter, Self.isoDateFormatter]
        for formatter in inputFormatters {
            if let date = formatter.date(from: self) {
                return date.formatted(.dateTime.month(.abbreviated).day().year())
            }
        }
        return self
    }

    var visitAPITime: String {
        if let date = Self.apiTimeFormatter.date(from: self) {
            return date.formatted(.dateTime.hour().minute())
        }
        return self
    }

    var titleCasedStatus: String {
        replacingOccurrences(of: "_", with: " ").capitalized
    }

    var trimmed: String {
        trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private static let apiDateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()

    private static let isoDateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSXXXXX"
        return formatter
    }()

    private static let apiTimeFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "HH:mm:ss"
        return formatter
    }()
}
