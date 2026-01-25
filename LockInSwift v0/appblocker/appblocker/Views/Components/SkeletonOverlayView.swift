import SwiftUI

/// Draws the detected body skeleton over the camera preview (matches RN app styling)
struct SkeletonOverlayView: View {
    let joints: [String: DetectedJoint]
    let isValid: Bool  // Green if valid position, orange if not

    // Colors matching RN app
    private let lineColor = Color(red: 0.063, green: 0.725, blue: 0.506) // #10b981
    private let invalidLineColor = Color.orange

    var body: some View {
        GeometryReader { geometry in
            let size = geometry.size

            Canvas { context, _ in
                // Draw connections first (lines between joints)
                for connection in ExerciseDetectionService.bodyConnections {
                    if let from = joints[connection.0],
                       let to = joints[connection.1],
                       from.confidence > 0.5,
                       to.confidence > 0.5 {

                        var path = Path()
                        path.move(to: CGPoint(
                            x: from.position.x * size.width,
                            y: from.position.y * size.height
                        ))
                        path.addLine(to: CGPoint(
                            x: to.position.x * size.width,
                            y: to.position.y * size.height
                        ))

                        context.stroke(
                            path,
                            with: .color(isValid ? lineColor : invalidLineColor),
                            style: StrokeStyle(lineWidth: 3, lineCap: .round)
                        )
                    }
                }

                // Draw joints (circles at each point)
                for (name, joint) in joints where joint.confidence > 0.5 {
                    // Skip face landmarks
                    if name == "nose" || name == "neck" { continue }

                    let point = CGPoint(
                        x: joint.position.x * size.width,
                        y: joint.position.y * size.height
                    )

                    let color = jointColor(for: name)
                    let circle = Path(ellipseIn: CGRect(
                        x: point.x - 6,
                        y: point.y - 6,
                        width: 12,
                        height: 12
                    ))

                    context.fill(circle, with: .color(color))
                }
            }
        }
    }

    private func jointColor(for name: String) -> Color {
        // Colors matching RN app by body part
        switch name {
        // Arms/shoulders - orange
        case "rightShoulder", "leftShoulder", "rightElbow", "leftElbow", "rightWrist", "leftWrist":
            return Color(red: 0.961, green: 0.620, blue: 0.043) // #f59e0b
        // Hips - pink
        case "rightHip", "leftHip":
            return Color(red: 0.925, green: 0.282, blue: 0.6) // #ec4899
        // Legs - purple
        case "rightKnee", "leftKnee", "rightAnkle", "leftAnkle":
            return Color(red: 0.545, green: 0.361, blue: 0.965) // #8b5cf6
        default:
            return lineColor
        }
    }
}

#Preview {
    ZStack {
        Color.black

        SkeletonOverlayView(
            joints: [
                "rightShoulder": DetectedJoint(position: CGPoint(x: 0.4, y: 0.3), confidence: 0.9),
                "leftShoulder": DetectedJoint(position: CGPoint(x: 0.6, y: 0.3), confidence: 0.9),
                "rightElbow": DetectedJoint(position: CGPoint(x: 0.35, y: 0.45), confidence: 0.9),
                "leftElbow": DetectedJoint(position: CGPoint(x: 0.65, y: 0.45), confidence: 0.9),
                "rightWrist": DetectedJoint(position: CGPoint(x: 0.3, y: 0.6), confidence: 0.9),
                "leftWrist": DetectedJoint(position: CGPoint(x: 0.7, y: 0.6), confidence: 0.9),
                "rightHip": DetectedJoint(position: CGPoint(x: 0.45, y: 0.55), confidence: 0.9),
                "leftHip": DetectedJoint(position: CGPoint(x: 0.55, y: 0.55), confidence: 0.9),
                "rightKnee": DetectedJoint(position: CGPoint(x: 0.43, y: 0.75), confidence: 0.9),
                "leftKnee": DetectedJoint(position: CGPoint(x: 0.57, y: 0.75), confidence: 0.9),
                "rightAnkle": DetectedJoint(position: CGPoint(x: 0.42, y: 0.95), confidence: 0.9),
                "leftAnkle": DetectedJoint(position: CGPoint(x: 0.58, y: 0.95), confidence: 0.9),
            ],
            isValid: true
        )
    }
}
