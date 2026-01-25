import SwiftUI

struct ConflictResolutionView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(ThemeService.self) private var themeService

    let conflictDetails: String
    let suggestedResolutions: [String]
    let onResolutionSelected: (String) -> Void

    @State private var selectedResolution: String?
    @State private var customResolution: String = ""
    @State private var showingCustomInput = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Conflict Icon & Message
                    conflictHeader

                    // Resolution Options
                    resolutionOptions

                    // Custom Resolution
                    customResolutionSection

                    // Apply Button
                    applyButton
                }
                .padding()
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Schedule Conflict")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }

    // MARK: - Conflict Header

    private var conflictHeader: some View {
        VStack(spacing: 16) {
            ZStack {
                Circle()
                    .fill(Color.orange.opacity(0.15))
                    .frame(width: 80, height: 80)

                Image(systemName: "exclamationmark.triangle.fill")
                    .font(.system(size: 36))
                    .foregroundStyle(.orange)
            }

            Text("Schedule Conflict Detected")
                .font(.title3)
                .fontWeight(.bold)

            Text(conflictDetails)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
        }
        .padding(.top)
    }

    // MARK: - Resolution Options

    private var resolutionOptions: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Choose how to resolve")
                .font(.headline)
                .padding(.horizontal, 4)

            ForEach(suggestedResolutions, id: \.self) { resolution in
                ResolutionOptionRow(
                    resolution: resolution,
                    isSelected: selectedResolution == resolution,
                    accentColor: themeService.accentColor
                ) {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        selectedResolution = resolution
                        showingCustomInput = false
                    }
                }
            }
        }
    }

    // MARK: - Custom Resolution Section

    private var customResolutionSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Button {
                withAnimation(.easeInOut(duration: 0.2)) {
                    showingCustomInput.toggle()
                    if showingCustomInput {
                        selectedResolution = nil
                    }
                }
            } label: {
                HStack {
                    Image(systemName: showingCustomInput ? "checkmark.circle.fill" : "circle")
                        .foregroundStyle(showingCustomInput ? themeService.accentColor : .secondary)
                    Text("Enter a different solution")
                        .foregroundStyle(.primary)
                    Spacer()
                    Image(systemName: "chevron.down")
                        .rotationEffect(.degrees(showingCustomInput ? 180 : 0))
                        .foregroundStyle(.secondary)
                }
                .padding()
                .background(Color(.secondarySystemGroupedBackground))
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .buttonStyle(.plain)

            if showingCustomInput {
                TextField("Describe how to resolve...", text: $customResolution, axis: .vertical)
                    .textFieldStyle(.plain)
                    .padding()
                    .background(Color(.secondarySystemGroupedBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .lineLimit(3...6)
            }
        }
    }

    // MARK: - Apply Button

    private var applyButton: some View {
        Button {
            let resolution = showingCustomInput ? customResolution : (selectedResolution ?? "")
            if !resolution.isEmpty {
                onResolutionSelected(resolution)
                dismiss()
            }
        } label: {
            HStack {
                Image(systemName: "checkmark")
                Text("Apply Resolution")
            }
            .font(.headline)
            .frame(maxWidth: .infinity)
            .padding()
            .background(isApplyEnabled ? themeService.accentColor : Color.gray.opacity(0.3))
            .foregroundStyle(isApplyEnabled ? .white : .secondary)
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
        .disabled(!isApplyEnabled)
        .padding(.top, 8)
    }

    private var isApplyEnabled: Bool {
        if showingCustomInput {
            return !customResolution.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        }
        return selectedResolution != nil
    }
}

// MARK: - Resolution Option Row

struct ResolutionOptionRow: View {
    let resolution: String
    let isSelected: Bool
    let accentColor: Color
    let onSelect: () -> Void

    var body: some View {
        Button(action: onSelect) {
            HStack(spacing: 12) {
                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .font(.title3)
                    .foregroundStyle(isSelected ? accentColor : .secondary)

                Text(resolution)
                    .font(.body)
                    .foregroundStyle(.primary)
                    .multilineTextAlignment(.leading)

                Spacer()
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color(.secondarySystemGroupedBackground))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(isSelected ? accentColor : Color.clear, lineWidth: 2)
                    )
            )
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Conflict Alert Modifier

extension View {
    func conflictResolutionSheet(
        isPresented: Binding<Bool>,
        conflictDetails: String,
        suggestedResolutions: [String],
        onResolutionSelected: @escaping (String) -> Void
    ) -> some View {
        self.sheet(isPresented: isPresented) {
            ConflictResolutionView(
                conflictDetails: conflictDetails,
                suggestedResolutions: suggestedResolutions,
                onResolutionSelected: onResolutionSelected
            )
            .presentationDetents([.medium, .large])
        }
    }
}

#Preview {
    ConflictResolutionView(
        conflictDetails: "Your new task 'Gym workout' at 3:00 PM conflicts with 'Team Meeting' scheduled from 3:00 PM to 4:00 PM.",
        suggestedResolutions: [
            "Move gym workout to 4:30 PM after the meeting",
            "Move gym workout to 2:00 PM before the meeting",
            "Replace the meeting with gym workout",
            "Skip gym for today"
        ],
        onResolutionSelected: { resolution in
            print("Selected: \(resolution)")
        }
    )
    .environment(ThemeService())
}
