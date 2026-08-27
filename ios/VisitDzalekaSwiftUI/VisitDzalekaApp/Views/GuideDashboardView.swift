import SwiftUI
import AVFoundation

struct GuideDashboardView: View {
    @EnvironmentObject private var appModel: AppViewModel
    @State private var availabilityExpanded = false
    @State private var trainingExpanded = false
    @State private var lookupReference = ""
    @State private var showingScanner = false

    var body: some View {
        ScrollView {
            VStack(spacing: 18) {
                if appModel.content.currentUser == nil {
                    SignInPanel(
                        title: "Guide sign in",
                        message: "Sign in with your Visit Dzaleka guide account to see assigned tours."
                    )
                } else if appModel.content.currentUser?.role != .guide {
                    EmptyPanel(
                        title: "Guide account required",
                        message: "This workflow is available to signed-in guide accounts.",
                        systemImage: "person.crop.circle.badge.exclamationmark"
                    )
                } else {
                    HeroPanel(
                        title: "Guide workflow",
                        subtitle: "See the next assignment, scan visitor QR codes, update availability, and keep training current.",
                        systemImage: "person.crop.circle.badge.checkmark",
                        imageURL: nil
                    ) {
                        if let nextAssignment {
                            StatusPill(text: nextAssignment.visitDate.visitAPIDate, systemImage: "calendar", tint: .white)
                        } else {
                            StatusPill(text: "No upcoming assignment", systemImage: "calendar.badge.clock", tint: .white)
                        }
                    }

                    if let guide = appModel.content.guideProfile {
                        guideHeader(guide)
                        readinessPanel(guide)
                    }

                    guideWorkflowPanel
                    availabilityPanel
                    trainingPanel

                    SectionTitle(
                        title: "Guide workflow",
                        subtitle: "Assigned tours, check-in, no-show, training, and payout status."
                    )

                    if appModel.content.guideTours.isEmpty {
                        EmptyPanel(
                            title: "No guide assignments",
                            message: "Confirmed bookings will appear here when staff assign them to you.",
                            systemImage: "calendar.badge.clock"
                        )
                    } else {
                        ForEach(appModel.content.guideTours) { booking in
                            assignmentCard(booking)
                        }
                    }
                }
            }
            .padding()
        }
        .visitScreenBackground()
        .navigationTitle("Guide")
        .navigationBarTitleDisplayMode(.inline)
        .refreshable {
            await appModel.refresh()
        }
    }

    private func guideHeader(_ guide: Guide) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(alignment: .top, spacing: 14) {
                Image(systemName: "person.crop.circle.fill.badge.checkmark")
                    .font(.system(size: 44))
                    .foregroundStyle(VisitTheme.primary)
                    .accessibilityHidden(true)

                VStack(alignment: .leading, spacing: 5) {
                    Text(guide.fullName)
                        .font(.title2.bold())
                    Text((guide.languages ?? []).joined(separator: ", "))
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    if let rating = guide.rating, rating > 0 {
                        Label(String(format: "%.1f guide rating", rating), systemImage: "star.fill")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(.orange)
                    }
                }
                Spacer(minLength: 0)
            }

            LazyVGrid(columns: VisitGrid.compactColumns, spacing: 10) {
                guideMetricTile(
                    title: "Total tours",
                    value: "\(guide.totalTours ?? appModel.content.guideTours.count)",
                    systemImage: "figure.walk",
                    tint: VisitTheme.primary
                )
                guideMetricTile(
                    title: "Earnings",
                    value: (appModel.content.guideEarnings?.totalEarnings ?? guide.totalEarnings ?? 0).formatted(.currency(code: "MWK")),
                    systemImage: "banknote",
                    tint: VisitTheme.green
                )
            }
        }
        .visitCard()
    }

    private func readinessPanel(_ guide: Guide) -> some View {
        let training = appModel.content.trainingStats
        let percent = Double(training?.percentage ?? 0) / 100
        let payoutStatus = appModel.content.guideEarnings?.payoutSummary?.status?.titleCasedStatus ?? "No payout record"

        return VStack(alignment: .leading, spacing: 14) {
            SectionTitle(title: "Today readiness", systemImage: "checklist.checked")
            ProgressView(value: percent) {
                Text("Training completion")
            }
            .tint(VisitTheme.green)

            readinessRow(
                title: "Training modules",
                detail: training.map { "\($0.completed) of \($0.total) complete" } ?? "Training data unavailable",
                systemImage: "graduationcap",
                tint: percent >= 1 ? VisitTheme.green : .orange
            )
            readinessRow(
                title: "Payout status",
                detail: payoutStatus,
                systemImage: "banknote",
                tint: VisitTheme.primary
            )
            readinessRow(
                title: "Availability",
                detail: guide.isActive == false ? "Your guide profile is inactive." : "Your guide profile is active.",
                systemImage: "calendar",
                tint: guide.isActive == false ? .orange : VisitTheme.green
            )
        }
        .visitCard()
    }

    private var guideWorkflowPanel: some View {
        let next = nextAssignment

        return VStack(alignment: .leading, spacing: 14) {
            SectionTitle(
                title: "Next assignment",
                subtitle: "Use QR scan when the visitor arrives; use manual reference as fallback.",
                systemImage: "qrcode.viewfinder"
            )

            if let next {
                InfoRow(
                    title: next.visitorName,
                    detail: "\(next.visitDate.visitAPIDate) at \(next.visitTime.visitAPITime) · Ref: \(next.referenceText)",
                    systemImage: "calendar.badge.clock",
                    tint: VisitTheme.green
                )
                .visitInset()
            } else {
                EmptyPanel(
                    title: "No upcoming assignment",
                    message: "Confirmed bookings will appear here when staff assign them to you.",
                    systemImage: "calendar.badge.clock"
                )
            }

            TextField("Scan or enter booking reference", text: $lookupReference)
                .textInputAutocapitalization(.characters)
                .autocorrectionDisabled()
                .textFieldStyle(.roundedBorder)

            LazyVGrid(columns: VisitGrid.actionColumns, spacing: 10) {
                Button {
                    showingScanner = true
                } label: {
                    Label("Scan QR", systemImage: "camera.viewfinder")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)

                Button {
                    checkInByReference()
                } label: {
                    Label("Check in", systemImage: "checkmark.circle")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
                .disabled(appModel.isRunningGuideAction || lookupReference.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)

                Button {
                    availabilityExpanded = true
                } label: {
                    Label("Availability", systemImage: "calendar")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
            }
        }
        .sheet(isPresented: $showingScanner) {
            QRCodeScannerSheet { scannedValue in
                showingScanner = false
                checkInByReference(scannedValue)
            }
        }
        .visitCard()
    }

    private var availabilityPanel: some View {
        DisclosureGroup(isExpanded: $availabilityExpanded) {
            VStack(alignment: .leading, spacing: 12) {
                ForEach(weekdayKeys, id: \.self) { day in
                    Toggle(day.titleCasedStatus, isOn: Binding(
                        get: { appModel.availabilityDraft[day] ?? false },
                        set: { appModel.availabilityDraft[day] = $0 }
                    ))
                }

                Button {
                    Task { await appModel.saveGuideAvailability() }
                } label: {
                    HStack {
                        if appModel.isSavingAvailability {
                            ProgressView()
                                .controlSize(.small)
                        }
                        Label(appModel.isSavingAvailability ? "Saving availability" : "Save availability", systemImage: "checkmark.circle")
                    }
                    .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .disabled(appModel.isSavingAvailability)
            }
            .padding(.top, 12)
        } label: {
            InfoRow(
                title: "Availability",
                detail: "Update the days staff can consider you for tours.",
                systemImage: "calendar.badge.clock",
                tint: VisitTheme.primary
            )
        }
        .visitCard()
    }

    private var trainingPanel: some View {
        DisclosureGroup(isExpanded: $trainingExpanded) {
            VStack(alignment: .leading, spacing: 12) {
                if appModel.content.trainingModules.isEmpty {
                    Text("No training modules are currently visible to your guide account.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                } else {
                    ForEach(sortedTrainingModules) { module in
                        let isComplete = progressForModule(module)?.status == "completed"
                        HStack(alignment: .top, spacing: 10) {
                            Image(systemName: isComplete ? "checkmark.seal.fill" : "circle")
                                .foregroundStyle(isComplete ? VisitTheme.green : .secondary)
                                .frame(width: 24, height: 24)
                            VStack(alignment: .leading, spacing: 4) {
                                Text(module.title)
                                    .font(.subheadline.weight(.semibold))
                                if let description = module.description, !description.isEmpty {
                                    Text(description)
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                        .lineLimit(3)
                                }
                                if module.isRequired == true {
                                    StatusPill(text: "Required", systemImage: "exclamationmark.circle", tint: .orange)
                                }
                            }
                            Spacer(minLength: 0)
                            if !isComplete {
                                Button("Complete") {
                                    Task { await appModel.markTrainingModuleComplete(module) }
                                }
                                .buttonStyle(.bordered)
                                .disabled(appModel.isRunningGuideAction)
                            }
                        }
                        .padding(10)
                        .background(.secondary.opacity(0.08), in: RoundedRectangle(cornerRadius: 8))
                    }
                }
            }
            .padding(.top, 12)
        } label: {
            InfoRow(
                title: "Training modules",
                detail: "Review and mark required training as complete.",
                systemImage: "graduationcap",
                tint: VisitTheme.green
            )
        }
        .visitCard()
    }

    private func readinessRow(title: String, detail: String, systemImage: String, tint: Color) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: systemImage)
                .foregroundStyle(tint)
                .frame(width: 28, height: 28)
            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.subheadline.weight(.semibold))
                Text(detail)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer(minLength: 0)
        }
    }

    private func assignmentCard(_ booking: Booking) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Assigned tour")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(VisitTheme.primary)
                    Text(booking.visitorName)
                        .font(.headline)
                    Text(booking.referenceText)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                StatusPill(
                    text: booking.status?.label ?? "Status pending",
                    systemImage: booking.status == .completed ? "checkmark.circle.fill" : "clock",
                    tint: booking.status == .completed ? VisitTheme.green : VisitTheme.primary
                )
            }

            VStack(alignment: .leading, spacing: 8) {
                InfoRow(
                    title: "\(booking.visitDate.visitAPIDate) at \(booking.visitTime.visitAPITime)",
                    detail: "\(booking.visitorCount) visitor\(booking.visitorCount == 1 ? "" : "s")",
                    systemImage: "calendar",
                    tint: VisitTheme.primary
                )
                if let requests = booking.specialRequests, !requests.isEmpty {
                    InfoRow(title: "Visitor notes", detail: requests, systemImage: "text.bubble", tint: VisitTheme.blue)
                }
            }
            .font(.subheadline)

            LazyVGrid(columns: VisitGrid.actionColumns, spacing: 10) {
                Button {
                    VisitHaptic.impact(.medium)
                    Task { await appModel.guideCheckIn(bookingId: booking.id) }
                } label: {
                    Label("Check-in", systemImage: "qrcode.viewfinder")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .disabled(appModel.isRunningGuideAction)

                Menu {
                    Button("Complete tour") {
                        Task { await appModel.guideCheckOut(bookingId: booking.id) }
                    }
                    Button("Report no-show", role: .destructive) {
                        Task { await appModel.guideNoShow(bookingId: booking.id) }
                    }
                } label: {
                    Label("Actions", systemImage: "ellipsis.circle")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
                .disabled(appModel.isRunningGuideAction)
            }
        }
        .visitCard()
    }

    private func guideMetricTile(title: String, value: String, systemImage: String, tint: Color) -> some View {
        HStack(spacing: 10) {
            IconBadge(systemImage: systemImage, tint: tint)
            VStack(alignment: .leading, spacing: 2) {
                Text(value)
                    .font(.headline)
                    .monospacedDigit()
                    .lineLimit(1)
                    .minimumScaleFactor(0.72)
                Text(title)
                    .font(.caption)
                    .foregroundStyle(VisitTheme.secondaryText)
            }
            Spacer(minLength: 0)
        }
        .visitInset()
    }

    private var nextAssignment: Booking? {
        appModel.content.guideTours
            .filter { booking in
                booking.status != .completed && booking.status != .cancelled && booking.status != .noShow
            }
            .sorted { lhs, rhs in
                "\(lhs.visitDate) \(lhs.visitTime)" < "\(rhs.visitDate) \(rhs.visitTime)"
            }
            .first
    }

    private var weekdayKeys: [String] {
        ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    }

    private var sortedTrainingModules: [TrainingModule] {
        appModel.content.trainingModules.sorted {
            ($0.orderIndex ?? 0, $0.title) < ($1.orderIndex ?? 0, $1.title)
        }
    }

    private func progressForModule(_ module: TrainingModule) -> TrainingProgress? {
        appModel.content.trainingProgress.first { $0.moduleId == module.id }
    }

    private func checkInByReference() {
        checkInByReference(lookupReference)
    }

    private func checkInByReference(_ reference: String) {
        let normalized = reference.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        guard let booking = appModel.content.guideTours.first(where: { $0.referenceText.uppercased() == normalized }) else {
            appModel.bannerMessage = "No assigned tour matches that reference."
            return
        }

        Task {
            await appModel.guideCheckIn(bookingId: booking.id)
            lookupReference = ""
        }
    }
}

private struct QRCodeScannerSheet: View {
    var onScan: (String) -> Void
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            QRScannerView(onScan: onScan)
                .overlay(alignment: .bottom) {
                    Text("Point the camera at the visitor booking QR code.")
                        .font(.subheadline)
                        .padding()
                        .frame(maxWidth: .infinity)
                        .background(.ultraThinMaterial)
                }
                .navigationTitle("Scan QR")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Cancel") {
                            dismiss()
                        }
                    }
                }
        }
    }
}

private struct QRScannerView: UIViewControllerRepresentable {
    var onScan: (String) -> Void

    func makeUIViewController(context: Context) -> QRScannerViewController {
        let controller = QRScannerViewController()
        controller.onScan = onScan
        return controller
    }

    func updateUIViewController(_ uiViewController: QRScannerViewController, context: Context) {}
}

private final class QRScannerViewController: UIViewController, AVCaptureMetadataOutputObjectsDelegate {
    var onScan: ((String) -> Void)?
    private let captureSession = AVCaptureSession()
    private var previewLayer: AVCaptureVideoPreviewLayer?
    private var didScan = false

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black
        configureCameraAccess()
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        previewLayer?.frame = view.layer.bounds
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        if captureSession.isRunning {
            captureSession.stopRunning()
        }
    }

    private func configureCameraAccess() {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            configureSession()
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { [weak self] granted in
                DispatchQueue.main.async {
                    granted ? self?.configureSession() : self?.showCameraMessage("Camera access is needed to scan booking QR codes.")
                }
            }
        default:
            showCameraMessage("Camera access is disabled. Enable it in Settings or enter the booking reference manually.")
        }
    }

    private func configureSession() {
        guard let videoDevice = AVCaptureDevice.default(for: .video) else {
            showCameraMessage("No camera is available on this device.")
            return
        }

        do {
            let input = try AVCaptureDeviceInput(device: videoDevice)
            if captureSession.canAddInput(input) {
                captureSession.addInput(input)
            }

            let metadataOutput = AVCaptureMetadataOutput()
            if captureSession.canAddOutput(metadataOutput) {
                captureSession.addOutput(metadataOutput)
                metadataOutput.setMetadataObjectsDelegate(self, queue: DispatchQueue.main)
                metadataOutput.metadataObjectTypes = [.qr]
            }

            let layer = AVCaptureVideoPreviewLayer(session: captureSession)
            layer.videoGravity = .resizeAspectFill
            layer.frame = view.layer.bounds
            view.layer.insertSublayer(layer, at: 0)
            previewLayer = layer

            DispatchQueue.global(qos: .userInitiated).async { [captureSession] in
                captureSession.startRunning()
            }
        } catch {
            showCameraMessage("Unable to start the camera scanner.")
        }
    }

    func metadataOutput(
        _ output: AVCaptureMetadataOutput,
        didOutput metadataObjects: [AVMetadataObject],
        from connection: AVCaptureConnection
    ) {
        guard !didScan,
              let object = metadataObjects.first as? AVMetadataMachineReadableCodeObject,
              let value = object.stringValue else { return }

        didScan = true
        captureSession.stopRunning()
        onScan?(value)
    }

    private func showCameraMessage(_ message: String) {
        let label = UILabel()
        label.text = message
        label.textColor = .white
        label.textAlignment = .center
        label.numberOfLines = 0
        label.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(label)

        NSLayoutConstraint.activate([
            label.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 24),
            label.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -24),
            label.centerYAnchor.constraint(equalTo: view.centerYAnchor)
        ])
    }
}
