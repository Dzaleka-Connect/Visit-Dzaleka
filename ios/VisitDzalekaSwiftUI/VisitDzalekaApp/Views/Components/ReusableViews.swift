import SwiftUI

// MARK: - Section Title

struct SectionTitle: View {
    var title: String
    var subtitle: String?
    var systemImage: String?

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            if let systemImage {
                Image(systemName: systemImage)
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(VisitTheme.primary)
                    .frame(width: 28, height: 28)
                    .background(VisitTheme.primary.opacity(0.10), in: RoundedRectangle(cornerRadius: 8))
                    .accessibilityHidden(true)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(VisitTheme.ink)
                    .textCase(nil)
                if let subtitle {
                    Text(subtitle)
                        .font(.subheadline)
                        .foregroundStyle(VisitTheme.secondaryText)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

// MARK: - Status Pill

struct StatusPill: View {
    var text: String
    var systemImage: String
    var tint: Color

    var body: some View {
        Label(text, systemImage: systemImage)
            .font(.caption.weight(.semibold))
            .foregroundStyle(tint)
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(tint.opacity(0.12), in: Capsule())
            .lineLimit(1)
            .minimumScaleFactor(0.82)
    }
}

// MARK: - Stat Card

struct StatCard: View {
    var title: String
    var value: String
    var systemImage: String
    var tint: Color

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: systemImage)
                .font(.title3)
                .foregroundStyle(tint)
                .frame(width: 36, height: 36)
                .background(tint.opacity(0.12), in: RoundedRectangle(cornerRadius: VisitTheme.controlRadius))
            VStack(alignment: .leading, spacing: 2) {
                Text(value)
                    .font(.headline)
                    .monospacedDigit()
                    .lineLimit(1)
                    .minimumScaleFactor(0.75)
                Text(title)
                    .font(.caption)
                    .foregroundStyle(VisitTheme.secondaryText)
            }
            Spacer(minLength: 0)
        }
        .visitCard()
    }
}

// MARK: - Banner Message

struct BannerMessage: View {
    var message: String

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: "info.circle.fill")
                .foregroundStyle(VisitTheme.accent)
            Text(message)
                .font(.subheadline)
                .frame(maxWidth: .infinity, alignment: .leading)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding()
        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: VisitTheme.cardRadius))
        .overlay(
            RoundedRectangle(cornerRadius: VisitTheme.cardRadius)
                .stroke(VisitTheme.border, lineWidth: 0.6)
        )
    }
}

// MARK: - Empty Panel

struct EmptyPanel: View {
    var title: String
    var message: String
    var systemImage: String

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: systemImage)
                .font(.largeTitle)
                .foregroundStyle(VisitTheme.primary)
            Text(title)
                .font(.headline)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(VisitTheme.secondaryText)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(VisitTheme.card, in: RoundedRectangle(cornerRadius: VisitTheme.cardRadius))
        .overlay(
            RoundedRectangle(cornerRadius: VisitTheme.cardRadius)
                .stroke(VisitTheme.border, lineWidth: 0.6)
        )
    }
}

// MARK: - Hero Panel (Redesigned — supports image backgrounds)

struct HeroPanel<Content: View>: View {
    var title: String
    var subtitle: String
    var systemImage: String
    var imageURL: URL?
    @ViewBuilder var content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Image(systemName: systemImage)
                .font(.title2.weight(.bold))
                .foregroundStyle(.white)
                .frame(width: 46, height: 46)
                .background(.white.opacity(0.18), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: 7) {
                Text(title)
                    .font(.system(size: 28, weight: .heavy, design: .default))
                    .foregroundStyle(.white)
                    .fixedSize(horizontal: false, vertical: true)
                Text(subtitle)
                    .font(.subheadline)
                    .foregroundStyle(.white.opacity(0.84))
                    .fixedSize(horizontal: false, vertical: true)
            }

            content
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(20)
        .background {
            if let imageURL {
                AsyncImage(url: imageURL) { phase in
                    switch phase {
                    case .success(let image):
                        image
                            .resizable()
                            .scaledToFill()
                            .overlay(
                                LinearGradient(
                                    colors: [
                                        VisitTheme.primaryDeep.opacity(0.85),
                                        VisitTheme.primaryDeep.opacity(0.6),
                                        VisitTheme.primary.opacity(0.5)
                                    ],
                                    startPoint: .bottomLeading,
                                    endPoint: .topTrailing
                                )
                            )
                    default:
                        VisitTheme.heroGradient
                    }
                }
            } else {
                VisitTheme.heroGradient
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: VisitTheme.heroRadius, style: .continuous))
        .overlay(alignment: .bottomTrailing) {
            Image(systemName: "leaf.fill")
                .font(.system(size: 84))
                .foregroundStyle(.white.opacity(0.06))
                .padding(18)
                .accessibilityHidden(true)
        }
        .shadow(color: VisitTheme.shadowDeep, radius: 16, x: 0, y: 8)
    }
}

// MARK: - Photo Hero (full-bleed image hero for discovery content)

struct PhotoHero: View {
    var title: String
    var subtitle: String?
    var imageURL: URL?
    var height: CGFloat = 220

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            if let imageURL {
                AsyncImage(url: imageURL) { phase in
                    switch phase {
                    case .success(let image):
                        image
                            .resizable()
                            .scaledToFill()
                    default:
                        ShimmerView()
                    }
                }
            } else {
                VisitTheme.heroGradient
            }

            LinearGradient(
                colors: [.clear, Color.black.opacity(0.7)],
                startPoint: .center,
                endPoint: .bottom
            )

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.system(size: 24, weight: .heavy))
                    .foregroundStyle(.white)
                if let subtitle {
                    Text(subtitle)
                        .font(.subheadline)
                        .foregroundStyle(.white.opacity(0.85))
                }
            }
            .padding(20)
        }
        .frame(height: height)
        .frame(maxWidth: .infinity)
        .clipShape(RoundedRectangle(cornerRadius: VisitTheme.heroRadius, style: .continuous))
        .shadow(color: VisitTheme.shadowDeep, radius: 12, x: 0, y: 6)
    }
}

// MARK: - Image Card (for discovery tiles)

struct ImageCard: View {
    var title: String
    var subtitle: String?
    var systemImage: String
    var imageURL: URL?
    var tint: Color = VisitTheme.primary

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ZStack(alignment: .bottomLeading) {
                if let imageURL {
                    AsyncImage(url: imageURL) { phase in
                        switch phase {
                        case .success(let image):
                            image
                                .resizable()
                                .scaledToFill()
                        default:
                            ShimmerView()
                        }
                    }
                } else {
                    tint.opacity(0.12)
                        .overlay(
                            Image(systemName: systemImage)
                                .font(.system(size: 36, weight: .light))
                                .foregroundStyle(tint.opacity(0.3))
                        )
                }
            }
            .frame(height: 120)
            .frame(maxWidth: .infinity)
            .clipped()

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(VisitTheme.ink)
                    .lineLimit(2)
                if let subtitle {
                    Text(subtitle)
                        .font(.caption)
                        .foregroundStyle(VisitTheme.secondaryText)
                        .lineLimit(2)
                }
            }
            .padding(12)
        }
        .background(VisitTheme.card)
        .clipShape(RoundedRectangle(cornerRadius: VisitTheme.cardRadius, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: VisitTheme.cardRadius, style: .continuous)
                .stroke(VisitTheme.border, lineWidth: 0.5)
        )
        .shadow(color: VisitTheme.shadow, radius: 6, x: 0, y: 3)
    }
}

// MARK: - Shimmer View

struct ShimmerView: View {
    @State private var phase: CGFloat = -1.0

    var body: some View {
        GeometryReader { geometry in
            VisitTheme.inset
                .overlay(
                    LinearGradient(
                        colors: [
                            .clear,
                            Color.white.opacity(0.25),
                            .clear
                        ],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                    .frame(width: geometry.size.width * 0.6)
                    .offset(x: phase * geometry.size.width)
                )
                .clipped()
        }
        .onAppear {
            guard !UIAccessibility.isReduceMotionEnabled else { return }
            withAnimation(
                .linear(duration: 1.4)
                .repeatForever(autoreverses: false)
            ) {
                phase = 1.5
            }
        }
    }
}

// MARK: - Shimmer Card (skeleton loading replacement)

struct ShimmerCard: View {
    var lines: Int = 3
    var showImage: Bool = false

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            if showImage {
                ShimmerView()
                    .frame(height: 120)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
            }
            ForEach(0..<lines, id: \.self) { index in
                ShimmerView()
                    .frame(height: 14)
                    .frame(maxWidth: index == lines - 1 ? 120 : .infinity, alignment: .leading)
                    .clipShape(Capsule())
            }
        }
        .visitCard()
    }
}

// MARK: - Icon Badge

struct IconBadge: View {
    var systemImage: String
    var tint: Color

    var body: some View {
        Image(systemName: systemImage)
            .font(.subheadline.weight(.bold))
            .foregroundStyle(tint)
            .frame(width: 34, height: 34)
            .background(tint.opacity(0.12), in: RoundedRectangle(cornerRadius: 9, style: .continuous))
            .accessibilityHidden(true)
    }
}

// MARK: - Info Row

struct InfoRow: View {
    var title: String
    var detail: String
    var systemImage: String
    var tint: Color = VisitTheme.primary

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            IconBadge(systemImage: systemImage, tint: tint)
            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(VisitTheme.ink)
                Text(detail)
                    .font(.caption)
                    .foregroundStyle(VisitTheme.secondaryText)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 0)
        }
    }
}

// MARK: - Action Tile

struct ActionTile: View {
    var title: String
    var detail: String
    var systemImage: String
    var tint: Color = VisitTheme.primary
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(alignment: .top, spacing: 12) {
                IconBadge(systemImage: systemImage, tint: tint)
                VStack(alignment: .leading, spacing: 3) {
                    Text(title)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(VisitTheme.ink)
                    Text(detail)
                        .font(.caption)
                        .foregroundStyle(VisitTheme.secondaryText)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Spacer(minLength: 0)
                Image(systemName: "chevron.right")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(.tertiary)
                    .padding(.top, 6)
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .visitInset()
    }
}

// MARK: - Category Chip

struct CategoryChip: View {
    var label: String
    var systemImage: String
    var tint: Color
    var isSelected: Bool = false

    var body: some View {
        Label(label, systemImage: systemImage)
            .font(.caption.weight(.semibold))
            .padding(.horizontal, 14)
            .padding(.vertical, 9)
            .background(
                isSelected ? tint : VisitTheme.card,
                in: Capsule()
            )
            .foregroundStyle(isSelected ? .white : VisitTheme.ink)
            .overlay(
                Capsule().stroke(isSelected ? tint.opacity(0.3) : VisitTheme.border, lineWidth: 0.6)
            )
            .shadow(color: isSelected ? tint.opacity(0.2) : .clear, radius: 4, x: 0, y: 2)
    }
}

// MARK: - Quick Link Row (horizontal scroll of icon+label tiles)

struct QuickLinkTile: View {
    var title: String
    var systemImage: String
    var tint: Color

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: systemImage)
                .font(.title2.weight(.semibold))
                .foregroundStyle(tint)
                .frame(width: 52, height: 52)
                .background(tint.opacity(0.10), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
            Text(title)
                .font(.caption2.weight(.medium))
                .foregroundStyle(VisitTheme.ink)
                .lineLimit(2)
                .multilineTextAlignment(.center)
        }
        .frame(width: 76)
    }
}

// MARK: - Primary Action Label

struct PrimaryActionLabel: View {
    var isLoading: Bool
    var loadingText: String
    var text: String
    var systemImage: String

    var body: some View {
        HStack(spacing: 8) {
            if isLoading {
                ProgressView()
                    .controlSize(.small)
                    .tint(.white)
            }
            Label(isLoading ? loadingText : text, systemImage: systemImage)
                .font(.subheadline.weight(.semibold))
                .lineLimit(1)
                .minimumScaleFactor(0.82)
        }
        .frame(maxWidth: .infinity)
        .frame(minHeight: 34)
        .padding(.vertical, 6)
    }
}

// MARK: - Divider with Label

struct LabeledDivider: View {
    var label: String

    var body: some View {
        HStack(spacing: 12) {
            Rectangle()
                .fill(VisitTheme.border)
                .frame(height: 1)
            Text(label)
                .font(.caption2.weight(.medium))
                .foregroundStyle(VisitTheme.tertiaryText)
                .textCase(.uppercase)
            Rectangle()
                .fill(VisitTheme.border)
                .frame(height: 1)
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Sign In Panel

struct SignInPanel: View {
    @EnvironmentObject private var appModel: AppViewModel
    var title: String
    var message: String
    @State private var mode: AuthMode = .login

    private enum AuthMode: String, CaseIterable, Identifiable {
        case login = "Sign in"
        case register = "Create account"
        case help = "Account help"

        var id: String { rawValue }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Label(title, systemImage: "person.crop.circle.badge.exclamationmark")
                .font(.headline)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(.secondary)

            Picker("Authentication mode", selection: $mode) {
                ForEach(AuthMode.allCases) { mode in
                    Text(mode.rawValue).tag(mode)
                }
            }
            .pickerStyle(.segmented)

            switch mode {
            case .login:
                loginFields
            case .register:
                registerFields
            case .help:
                accountHelpFields
            }
        }
        .visitCard()
    }

    private var loginFields: some View {
        Group {
            TextField("Email", text: $appModel.loginDraft.email)
                .textContentType(.emailAddress)
                .keyboardType(.emailAddress)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .textFieldStyle(.roundedBorder)

            SecureField("Password", text: $appModel.loginDraft.password)
                .textContentType(.password)
                .textFieldStyle(.roundedBorder)

            Button {
                Task { await appModel.login() }
            } label: {
                loadingLabel(
                    isLoading: appModel.isAuthenticating,
                    loadingText: "Signing in",
                    text: "Sign in",
                    systemImage: "arrow.right.circle.fill"
                )
            }
            .buttonStyle(.borderedProminent)
            .disabled(appModel.isAuthenticating || !appModel.loginDraft.canSubmit)
        }
    }

    private var registerFields: some View {
        Group {
            TextField("First name", text: $appModel.registerDraft.firstName)
                .textContentType(.givenName)
                .textInputAutocapitalization(.words)
                .textFieldStyle(.roundedBorder)

            TextField("Last name", text: $appModel.registerDraft.lastName)
                .textContentType(.familyName)
                .textInputAutocapitalization(.words)
                .textFieldStyle(.roundedBorder)

            TextField("Email", text: $appModel.registerDraft.email)
                .textContentType(.emailAddress)
                .keyboardType(.emailAddress)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .textFieldStyle(.roundedBorder)

            SecureField("Password", text: $appModel.registerDraft.password)
                .textContentType(.newPassword)
                .textFieldStyle(.roundedBorder)

            Button {
                Task { await appModel.register() }
            } label: {
                loadingLabel(
                    isLoading: appModel.isAuthenticating,
                    loadingText: "Creating account",
                    text: "Create account",
                    systemImage: "person.badge.plus"
                )
            }
            .buttonStyle(.borderedProminent)
            .disabled(appModel.isAuthenticating || !appModel.registerDraft.canSubmit)
        }
    }

    private var accountHelpFields: some View {
        Group {
            TextField("Account email", text: $appModel.passwordHelpDraft.email)
                .textContentType(.emailAddress)
                .keyboardType(.emailAddress)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .textFieldStyle(.roundedBorder)

            Button {
                Task { await appModel.requestPasswordReset() }
            } label: {
                loadingLabel(
                    isLoading: appModel.isAuthenticating,
                    loadingText: "Sending reset email",
                    text: "Send password reset email",
                    systemImage: "envelope"
                )
            }
            .buttonStyle(.bordered)
            .disabled(appModel.isAuthenticating || !appModel.passwordHelpDraft.canRequestReset)

            DisclosureGroup("I have a reset or verification token") {
                VStack(alignment: .leading, spacing: 10) {
                    TextField("Reset token", text: $appModel.passwordHelpDraft.resetToken)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .textFieldStyle(.roundedBorder)
                    SecureField("New password", text: $appModel.passwordHelpDraft.newPassword)
                        .textContentType(.newPassword)
                        .textFieldStyle(.roundedBorder)
                    Button("Reset password") {
                        Task { await appModel.resetPassword() }
                    }
                    .buttonStyle(.bordered)
                    .disabled(appModel.isAuthenticating || !appModel.passwordHelpDraft.canResetPassword)

                    Divider()

                    TextField("Email verification token", text: $appModel.passwordHelpDraft.verificationToken)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .textFieldStyle(.roundedBorder)
                    Button("Verify email") {
                        Task { await appModel.verifyEmail() }
                    }
                    .buttonStyle(.bordered)
                    .disabled(appModel.isAuthenticating || !appModel.passwordHelpDraft.canVerifyEmail)
                }
                .padding(.top, 8)
            }
            .font(.subheadline)
        }
    }

    private func loadingLabel(isLoading: Bool, loadingText: String, text: String, systemImage: String) -> some View {
        HStack {
            if isLoading {
                ProgressView()
                    .controlSize(.small)
            }
            Label(isLoading ? loadingText : text, systemImage: systemImage)
        }
        .frame(maxWidth: .infinity)
    }
}
