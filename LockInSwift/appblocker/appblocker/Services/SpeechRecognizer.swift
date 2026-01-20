import Foundation
import Speech
import AVFoundation
import Observation

/// Speech recognition service using Apple's Speech framework
@Observable
final class SpeechRecognizer {
    // MARK: - Properties

    var transcript = ""
    var isRecording = false
    var errorMessage: String?
    var authorizationStatus: SFSpeechRecognizerAuthorizationStatus = .notDetermined

    private var audioEngine = AVAudioEngine()
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private let speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))

    // MARK: - Authorization

    /// Request authorization for speech recognition
    func requestAuthorization() async -> Bool {
        await withCheckedContinuation { continuation in
            SFSpeechRecognizer.requestAuthorization { status in
                DispatchQueue.main.async {
                    self.authorizationStatus = status
                    continuation.resume(returning: status == .authorized)
                }
            }
        }
    }

    /// Check if speech recognition is available
    var isAvailable: Bool {
        return speechRecognizer?.isAvailable ?? false
    }

    // MARK: - Recording

    /// Start recording and transcribing speech
    func startRecording() throws {
        // Reset any existing task
        recognitionTask?.cancel()
        recognitionTask = nil
        transcript = ""
        errorMessage = nil

        // Configure audio session
        let audioSession = AVAudioSession.sharedInstance()
        try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
        try audioSession.setActive(true, options: .notifyOthersOnDeactivation)

        // Create recognition request
        recognitionRequest = SFSpeechAudioBufferRecognitionRequest()

        let inputNode = audioEngine.inputNode
        guard let recognitionRequest = recognitionRequest else {
            throw SpeechRecognizerError.requestCreationFailed
        }

        recognitionRequest.shouldReportPartialResults = true

        // Add time limit for recognition (prevents indefinite recording)
        recognitionRequest.requiresOnDeviceRecognition = false

        // Start recognition task
        recognitionTask = speechRecognizer?.recognitionTask(with: recognitionRequest) { [weak self] result, error in
            guard let self = self else { return }

            var isFinal = false

            if let result = result {
                // Update transcript on main thread
                DispatchQueue.main.async {
                    self.transcript = result.bestTranscription.formattedString
                }
                isFinal = result.isFinal
            }

            if error != nil || isFinal {
                DispatchQueue.main.async {
                    self.stopRecording()
                }
            }
        }

        // Configure audio input
        let recordingFormat = inputNode.outputFormat(forBus: 0)
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { buffer, _ in
            recognitionRequest.append(buffer)
        }

        // Start audio engine
        audioEngine.prepare()
        try audioEngine.start()

        DispatchQueue.main.async {
            self.isRecording = true
        }
    }

    /// Stop recording and finalize transcription
    func stopRecording() {
        // Stop audio engine
        if audioEngine.isRunning {
            audioEngine.stop()
            audioEngine.inputNode.removeTap(onBus: 0)
        }

        // End audio and cancel task
        recognitionRequest?.endAudio()
        recognitionTask?.cancel()

        // Reset state
        recognitionRequest = nil
        recognitionTask = nil

        DispatchQueue.main.async {
            self.isRecording = false
        }

        // Deactivate audio session
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }

    /// Toggle recording state
    func toggleRecording() {
        if isRecording {
            stopRecording()
        } else {
            do {
                try startRecording()
            } catch {
                errorMessage = "Could not start recording: \(error.localizedDescription)"
            }
        }
    }
}

// MARK: - Errors

enum SpeechRecognizerError: LocalizedError {
    case requestCreationFailed
    case notAuthorized
    case recognizerNotAvailable

    var errorDescription: String? {
        switch self {
        case .requestCreationFailed:
            return "Could not create speech recognition request"
        case .notAuthorized:
            return "Speech recognition is not authorized"
        case .recognizerNotAvailable:
            return "Speech recognizer is not available"
        }
    }
}
