import Foundation
import Observation
import AuthenticationServices
import Security

@Observable
final class AuthService {
    private let keychainService = "com.hrynchuk.appblocker"
    private let tokenKey = "authToken"
    private let userKey = "currentUser"

    var currentUser: User?
    var isLoading = false
    var error: String?

    var isLoggedIn: Bool {
        currentUser != nil && getToken() != nil
    }

    init() {
        loadUser()
    }

    // MARK: - Apple Sign In

    @MainActor
    func signInWithApple(authorization: ASAuthorization) async -> Bool {
        guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential else {
            error = "Invalid Apple credential"
            return false
        }

        isLoading = true
        defer { isLoading = false }

        let userId = credential.user
        let email = credential.email ?? "\(userId)@privaterelay.appleid.com"
        let fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
            .compactMap { $0 }
            .joined(separator: " ")

        // Create user
        let user = User(
            id: userId,
            email: email,
            displayName: fullName.isEmpty ? nil : fullName,
            isPro: false
        )

        // Save token (use user ID as token for now, in production use identityToken)
        if let tokenData = credential.identityToken,
           let token = String(data: tokenData, encoding: .utf8) {
            saveToken(token)
        } else {
            saveToken(userId)
        }

        currentUser = user
        saveUser(user)

        return true
    }

    // MARK: - Google Sign In (placeholder)

    @MainActor
    func signInWithGoogle() async -> Bool {
        // TODO: Implement Google Sign In
        error = "Google Sign In not yet implemented"
        return false
    }

    // MARK: - Email Auth (placeholder)

    @MainActor
    func signIn(email: String, password: String) async -> Bool {
        isLoading = true
        defer { isLoading = false }

        // TODO: Implement API call
        // For now, create a mock user
        let user = User(
            id: UUID().uuidString,
            email: email,
            displayName: email.components(separatedBy: "@").first,
            isPro: false
        )

        saveToken("mock_token_\(user.id)")
        currentUser = user
        saveUser(user)

        return true
    }

    @MainActor
    func signUp(email: String, password: String) async -> Bool {
        // Same as sign in for now
        return await signIn(email: email, password: password)
    }

    // MARK: - Sign Out

    func signOut() {
        deleteToken()
        currentUser = nil
        UserDefaults.standard.removeObject(forKey: userKey)
    }

    // MARK: - Token Management

    private func saveToken(_ token: String) {
        let data = token.data(using: .utf8)!
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: tokenKey,
            kSecValueData as String: data
        ]

        SecItemDelete(query as CFDictionary)
        SecItemAdd(query as CFDictionary, nil)
    }

    func getToken() -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: tokenKey,
            kSecReturnData as String: true
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess, let data = result as? Data else {
            return nil
        }

        return String(data: data, encoding: .utf8)
    }

    private func deleteToken() {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: tokenKey
        ]
        SecItemDelete(query as CFDictionary)
    }

    // MARK: - User Persistence

    private func saveUser(_ user: User) {
        if let data = try? JSONEncoder().encode(user) {
            UserDefaults.standard.set(data, forKey: userKey)
        }
    }

    private func loadUser() {
        guard let data = UserDefaults.standard.data(forKey: userKey),
              let user = try? JSONDecoder().decode(User.self, from: data),
              getToken() != nil else {
            return
        }
        currentUser = user
    }

    // MARK: - Update User

    func updateDisplayName(_ name: String) {
        currentUser?.displayName = name
        if let user = currentUser {
            saveUser(user)
        }
    }

    func updateProStatus(_ isPro: Bool) {
        currentUser?.isPro = isPro
        if let user = currentUser {
            saveUser(user)
        }
    }
}
