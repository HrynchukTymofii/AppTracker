import Foundation
import Observation
import AuthenticationServices
import Security
import GoogleSignIn

@Observable
final class AuthService {
    private let keychainService = "com.hrynchuk.appblocker"
    private let tokenKey = "authToken"
    private let userKey = "currentUser"

    // API endpoints
    private let baseURL = "https://www.fibipals.com/api/apps/appBlocker/auth"

    var currentUser: User?
    var isLoading = false
    var error: String?

    var isLoggedIn: Bool {
        currentUser != nil && getToken() != nil
    }

    /// Alias for isLoggedIn - used by AppEntryView
    var isAuthenticated: Bool {
        isLoggedIn
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

        guard let identityTokenData = credential.identityToken,
              let identityToken = String(data: identityTokenData, encoding: .utf8) else {
            error = "Missing identity token"
            return false
        }

        let fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
            .compactMap { $0 }
            .joined(separator: " ")

        // Call backend API
        do {
            let body: [String: Any] = [
                "id_token": identityToken,
                "name": fullName.isEmpty ? NSNull() : fullName,
                "email": credential.email ?? NSNull()
            ]

            let result = try await apiRequest(endpoint: "/apple", body: body)

            if let token = result["token"] as? String {
                saveToken(token)

                // Get the server's userId - this is the ID we need for RevenueCat
                let serverUserId = result["userId"] as? String ?? result["id"] as? String

                // Fetch actual user data from server
                if let userData = await fetchUserData(token: token) {
                    // Use server userId if available, otherwise use fetched data's ID
                    let finalUser = User(
                        id: serverUserId ?? userData.id,
                        email: userData.email,
                        displayName: userData.displayName,
                        isPro: userData.isPro
                    )
                    currentUser = finalUser
                    saveUser(finalUser)
                    print("✅ AuthService: Apple login - using server userId: \(finalUser.id)")
                } else {
                    // Fallback - use server userId from auth response, NOT credential.user
                    let user = User(
                        id: serverUserId ?? credential.user,
                        email: credential.email ?? "\(credential.user)@privaterelay.appleid.com",
                        displayName: fullName.isEmpty ? nil : fullName,
                        isPro: result["isPro"] as? Bool ?? false
                    )
                    currentUser = user
                    saveUser(user)
                    print("⚠️ AuthService: Apple login fallback - userId: \(user.id)")
                }

                // Fetch OpenAI key from backend
                await fetchOpenAIConfig(token: token)

                return true
            } else {
                error = result["error"] as? String ?? "Apple login failed"
                return false
            }
        } catch {
            self.error = "Apple login failed: \(error.localizedDescription)"
            return false
        }
    }

    // MARK: - Google Sign In

    /// Start Google Sign-In flow - call this from UI
    @MainActor
    func startGoogleSignIn() async -> Bool {
        isLoading = true
        error = nil

        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let rootViewController = windowScene.windows.first?.rootViewController else {
            error = "Cannot find root view controller"
            isLoading = false
            return false
        }

        do {
            let result = try await GIDSignIn.sharedInstance.signIn(withPresenting: rootViewController)

            guard let idToken = result.user.idToken?.tokenString else {
                error = "Missing Google ID token"
                isLoading = false
                return false
            }

            // Send token to backend
            return await signInWithGoogle(idToken: idToken)
        } catch {
            self.error = "Google Sign-In cancelled or failed"
            isLoading = false
            return false
        }
    }

    /// Send Google ID token to backend
    @MainActor
    func signInWithGoogle(idToken: String) async -> Bool {
        isLoading = true
        defer { isLoading = false }

        do {
            let body: [String: Any] = ["id_token": idToken]
            let result = try await apiRequest(endpoint: "/google", body: body)

            if let token = result["token"] as? String {
                saveToken(token)

                // Get the server's userId - this is the ID we need for RevenueCat
                let serverUserId = result["userId"] as? String ?? result["id"] as? String

                // Fetch actual user data from server
                if let userData = await fetchUserData(token: token) {
                    // Use server userId if available, otherwise use fetched data's ID
                    let finalUser = User(
                        id: serverUserId ?? userData.id,
                        email: userData.email,
                        displayName: userData.displayName,
                        isPro: userData.isPro
                    )
                    currentUser = finalUser
                    saveUser(finalUser)
                    print("✅ AuthService: Google login - using server userId: \(finalUser.id)")
                } else {
                    // Fallback to response data if fetch fails
                    let user = User(
                        id: serverUserId ?? UUID().uuidString,
                        email: result["email"] as? String ?? "user@google.com",
                        displayName: result["name"] as? String,
                        isPro: result["isPro"] as? Bool ?? false
                    )
                    currentUser = user
                    saveUser(user)
                    print("⚠️ AuthService: Google login fallback - userId: \(user.id)")
                }

                // Fetch OpenAI key from backend
                await fetchOpenAIConfig(token: token)

                return true
            } else {
                error = result["error"] as? String ?? "Google login failed"
                return false
            }
        } catch {
            self.error = "Google login failed: \(error.localizedDescription)"
            return false
        }
    }

    /// Handle Google Sign-In URL callback
    func handleGoogleURL(_ url: URL) -> Bool {
        return GIDSignIn.sharedInstance.handle(url)
    }

    // MARK: - Email Auth

    @MainActor
    func signIn(email: String, password: String) async -> Bool {
        isLoading = true
        defer { isLoading = false }

        do {
            let body: [String: Any] = ["email": email, "password": password]
            let result = try await apiRequest(endpoint: "/login", body: body)

            if let token = result["token"] as? String {
                saveToken(token)

                // Get the server's userId - this is the ID we need for RevenueCat
                let serverUserId = result["userId"] as? String ?? result["id"] as? String

                let user = User(
                    id: serverUserId ?? UUID().uuidString,
                    email: email,
                    displayName: result["name"] as? String ?? email.components(separatedBy: "@").first,
                    isPro: result["isPro"] as? Bool ?? false
                )

                currentUser = user
                saveUser(user)
                print("✅ AuthService: Email login - using server userId: \(user.id)")

                // Fetch OpenAI key from backend
                await fetchOpenAIConfig(token: token)

                return true
            } else {
                error = result["error"] as? String ?? "Login failed"
                return false
            }
        } catch {
            self.error = "Login failed: \(error.localizedDescription)"
            return false
        }
    }

    @MainActor
    func signUp(name: String, email: String, password: String) async -> Bool {
        isLoading = true
        defer { isLoading = false }

        do {
            // Register
            let registerBody: [String: Any] = ["name": name, "email": email, "password": password]
            let registerResult = try await apiRequest(endpoint: "/register", body: registerBody)

            if let errorMsg = registerResult["error"] as? String {
                error = errorMsg
                return false
            }

            // Then login
            return await signIn(email: email, password: password)
        } catch {
            self.error = "Registration failed: \(error.localizedDescription)"
            return false
        }
    }

    // MARK: - Sign Out

    func signOut() {
        deleteToken()
        currentUser = nil
        UserDefaults.standard.removeObject(forKey: userKey)
    }

    // MARK: - API Helper

    private func apiRequest(endpoint: String, body: [String: Any]) async throws -> [String: Any] {
        guard let url = URL(string: baseURL + endpoint) else {
            throw URLError(.badURL)
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw URLError(.badServerResponse)
        }

        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] ?? [:]

        if httpResponse.statusCode >= 400 {
            let errorMsg = json["error"] as? String ?? "Request failed with status \(httpResponse.statusCode)"
            throw NSError(domain: "AuthService", code: httpResponse.statusCode, userInfo: [NSLocalizedDescriptionKey: errorMsg])
        }

        return json
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

    // MARK: - Fetch User Data

    /// Fetch user data from /user endpoint
    private func fetchUserData(token: String) async -> User? {
        guard let url = URL(string: "https://www.fibipals.com/api/apps/appBlocker/user") else {
            return nil
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        do {
            let (data, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 else {
                print("AuthService: Failed to fetch user data - bad status")
                return nil
            }

            let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] ?? [:]

            let user = User(
                id: json["id"] as? String ?? json["_id"] as? String ?? UUID().uuidString,
                email: json["email"] as? String ?? "unknown@email.com",
                displayName: json["name"] as? String,
                isPro: json["isPro"] as? Bool ?? false
            )

            print("AuthService: Fetched user data - name: \(user.displayName ?? "nil"), email: \(user.email)")
            return user
        } catch {
            print("AuthService: Failed to fetch user data - \(error.localizedDescription)")
            return nil
        }
    }

    // MARK: - RevenueCat User ID

    /// Fetch RevenueCat user ID from backend - this is the ID to use for RevenueCat login
    func fetchRevenueCatUserId() async -> String? {
        guard let token = getToken() else {
            print("❌ AuthService: No token available for RevenueCat userId fetch")
            return nil
        }

        guard let url = URL(string: "https://www.fibipals.com/api/apps/appBlocker/user/id") else {
            print("❌ AuthService: Invalid URL for RevenueCat userId endpoint")
            return nil
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        print("🔄 AuthService: Fetching RevenueCat userId from \(url.absoluteString)")
        print("🔄 AuthService: Token (first 20 chars): \(String(token.prefix(20)))...")

        do {
            let (data, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                print("❌ AuthService: Response is not HTTP response")
                return nil
            }

            let responseBody = String(data: data, encoding: .utf8) ?? "Unable to decode response"
            print("🔄 AuthService: HTTP Status: \(httpResponse.statusCode)")
            print("🔄 AuthService: Response body: \(responseBody)")

            guard httpResponse.statusCode == 200 else {
                print("❌ AuthService: Failed to fetch RevenueCat userId - HTTP \(httpResponse.statusCode)")
                print("❌ AuthService: Error response: \(responseBody)")
                return nil
            }

            // Try to parse as JSON object first
            if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                print("🔄 AuthService: Parsed JSON: \(json)")
                if let userId = json["userId"] as? String ?? json["id"] as? String ?? json["_id"] as? String {
                    print("✅ AuthService: Fetched RevenueCat userId: \(userId)")
                    return userId
                }
            }

            // Try to parse as plain string (in case server returns just the ID)
            let trimmedResponse = responseBody.trimmingCharacters(in: .whitespacesAndNewlines)
                .trimmingCharacters(in: CharacterSet(charactersIn: "\"")) // Remove quotes if present
            if !trimmedResponse.isEmpty && !trimmedResponse.contains("{") {
                print("✅ AuthService: Fetched RevenueCat userId (plain): \(trimmedResponse)")
                return trimmedResponse
            }

            print("❌ AuthService: Could not parse RevenueCat userId from response: \(responseBody)")
            return nil
        } catch {
            print("❌ AuthService: Failed to fetch RevenueCat userId - \(error.localizedDescription)")
            print("❌ AuthService: Full error: \(error)")
            return nil
        }
    }

    // MARK: - OpenAI Config

    /// Fetch OpenAI API key from backend after login
    private func fetchOpenAIConfig(token: String) async {
        let openAI = OpenAIService()
        await openAI.fetchAPIKeyFromBackend(authToken: token)
    }
}
