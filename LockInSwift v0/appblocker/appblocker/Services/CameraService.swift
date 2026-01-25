import Foundation
import AVFoundation
import UIKit
import Observation

protocol CameraFrameDelegate: AnyObject {
    func cameraService(_ service: CameraService, didOutput sampleBuffer: CMSampleBuffer)
}

@Observable
final class CameraService: NSObject {
    // MARK: - Properties

    private(set) var session = AVCaptureSession()
    private var videoOutput = AVCaptureVideoDataOutput()
    private var photoOutput = AVCapturePhotoOutput()
    private let sessionQueue = DispatchQueue(label: "com.hrynchuk.appblocker.camera")

    var isRunning = false
    var cameraPosition: AVCaptureDevice.Position = .front
    var hasPermission = false

    /// Set camera position before starting
    func setPosition(_ position: AVCaptureDevice.Position) {
        guard position != cameraPosition else { return }
        cameraPosition = position
        if hasPermission {
            setupSession()
        }
    }
    var error: String?

    weak var frameDelegate: CameraFrameDelegate?

    // For photo capture continuation
    private var photoContinuation: CheckedContinuation<UIImage?, Never>?

    // MARK: - Initialization

    override init() {
        super.init()
        checkPermission()
    }

    // MARK: - Permission

    func checkPermission() {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            DispatchQueue.main.async {
                self.hasPermission = true
                self.error = nil
            }
            setupSession()
        case .notDetermined:
            requestPermission()
        case .denied, .restricted:
            DispatchQueue.main.async {
                self.hasPermission = false
                self.error = "Camera access denied"
            }
        @unknown default:
            DispatchQueue.main.async {
                self.hasPermission = false
            }
        }
    }

    func requestPermission() {
        AVCaptureDevice.requestAccess(for: .video) { [weak self] granted in
            DispatchQueue.main.async {
                self?.hasPermission = granted
                if granted {
                    self?.error = nil
                    self?.setupSession()
                    // Auto-start after permission granted
                    self?.start()
                } else {
                    self?.error = "Camera access denied"
                }
            }
        }
    }

    /// Ensure camera permission is requested (call this before showing camera UI)
    func ensurePermission() {
        if AVCaptureDevice.authorizationStatus(for: .video) == .notDetermined {
            requestPermission()
        } else {
            checkPermission()
        }
    }

    // MARK: - Session Setup

    private func setupSession() {
        sessionQueue.async { [weak self] in
            guard let self = self else { return }

            self.session.beginConfiguration()
            self.session.sessionPreset = .high

            // Remove existing inputs
            for input in self.session.inputs {
                self.session.removeInput(input)
            }

            // Add camera input - prefer ultra-wide for wider field of view
            guard let camera = self.getCamera(for: self.cameraPosition),
                  let input = try? AVCaptureDeviceInput(device: camera) else {
                DispatchQueue.main.async {
                    self.error = "Failed to access camera"
                }
                return
            }

            if self.session.canAddInput(input) {
                self.session.addInput(input)
            }

            // Set minimum zoom for widest field of view
            do {
                try camera.lockForConfiguration()
                camera.videoZoomFactor = camera.minAvailableVideoZoomFactor
                camera.unlockForConfiguration()
            } catch {
                print("Could not set zoom: \(error)")
            }

            // Add video output for frame processing
            self.videoOutput.setSampleBufferDelegate(self, queue: DispatchQueue(label: "com.hrynchuk.appblocker.videoOutput"))
            self.videoOutput.alwaysDiscardsLateVideoFrames = true
            self.videoOutput.videoSettings = [
                kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA
            ]

            if self.session.canAddOutput(self.videoOutput) {
                self.session.addOutput(self.videoOutput)
            }

            // Add photo output
            if self.session.canAddOutput(self.photoOutput) {
                self.session.addOutput(self.photoOutput)
            }

            // Set video orientation
            if let connection = self.videoOutput.connection(with: .video) {
                if connection.isVideoRotationAngleSupported(90) {
                    connection.videoRotationAngle = 90
                }
                if connection.isVideoMirroringSupported && self.cameraPosition == .front {
                    connection.isVideoMirrored = true
                }
            }

            self.session.commitConfiguration()
        }
    }

    private func getCamera(for position: AVCaptureDevice.Position) -> AVCaptureDevice? {
        // Try ultra-wide first for wider field of view during exercises
        let ultraWideSession = AVCaptureDevice.DiscoverySession(
            deviceTypes: [.builtInUltraWideCamera],
            mediaType: .video,
            position: position
        )
        if let ultraWide = ultraWideSession.devices.first {
            return ultraWide
        }

        // Fall back to wide angle
        let wideAngleSession = AVCaptureDevice.DiscoverySession(
            deviceTypes: [.builtInWideAngleCamera],
            mediaType: .video,
            position: position
        )
        return wideAngleSession.devices.first
    }

    // MARK: - Control

    func start() {
        guard hasPermission else {
            checkPermission()
            return
        }

        sessionQueue.async { [weak self] in
            guard let self = self, !self.session.isRunning else { return }
            self.session.startRunning()
            DispatchQueue.main.async {
                self.isRunning = true
            }
        }
    }

    func stop() {
        sessionQueue.async { [weak self] in
            guard let self = self, self.session.isRunning else { return }
            self.session.stopRunning()
            DispatchQueue.main.async {
                self.isRunning = false
            }
        }
    }

    func switchCamera() {
        cameraPosition = cameraPosition == .front ? .back : .front
        setupSession()
    }

    // MARK: - Photo Capture

    func capturePhoto() async -> UIImage? {
        guard hasPermission, session.isRunning else { return nil }

        return await withCheckedContinuation { continuation in
            self.photoContinuation = continuation

            let settings = AVCapturePhotoSettings()
            settings.flashMode = .off

            self.photoOutput.capturePhoto(with: settings, delegate: self)
        }
    }
}

// MARK: - AVCaptureVideoDataOutputSampleBufferDelegate

extension CameraService: AVCaptureVideoDataOutputSampleBufferDelegate {
    func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
        frameDelegate?.cameraService(self, didOutput: sampleBuffer)
    }
}

// MARK: - AVCapturePhotoCaptureDelegate

extension CameraService: AVCapturePhotoCaptureDelegate {
    func photoOutput(_ output: AVCapturePhotoOutput, didFinishProcessingPhoto photo: AVCapturePhoto, error: Error?) {
        guard let imageData = photo.fileDataRepresentation(),
              let image = UIImage(data: imageData) else {
            photoContinuation?.resume(returning: nil)
            photoContinuation = nil
            return
        }

        // Mirror the image if front camera
        let finalImage: UIImage
        if cameraPosition == .front, let cgImage = image.cgImage {
            finalImage = UIImage(cgImage: cgImage, scale: image.scale, orientation: .leftMirrored)
        } else {
            finalImage = image
        }

        photoContinuation?.resume(returning: finalImage)
        photoContinuation = nil
    }
}
