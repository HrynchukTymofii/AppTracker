import Foundation

// MARK: - Localization Keys
// Note: String.localized extension is defined in LocalizationService.swift
// to support runtime language switching via bundle swizzling

/// Centralized localization keys for type safety
/// All properties are computed to support instant language switching
enum L10n {
    // Common
    enum Common {
        static let done = "common.done".localized
        static let cancel = "common.cancel".localized
        static let save = "common.save".localized
        static let edit = "common.edit".localized
        static let close = "common.close".localized
        static let back = "common.back".localized
        static let next = "common.next".localized
        static let skip = "common.skip".localized
        static let `continue` = "common.continue".localized
        static let error = "common.error".localized
        static let success = "common.success".localized
        static let loading = "common.loading".localized
        static let retry = "common.retry".localized
        static let getStarted = "common.get_started".localized
        static let of = "common.of".localized
    }

    // Tab Bar
    enum Tab {
        static let home = "tab.home".localized
        static let goals = "tab.goals".localized
        static let lockin = "tab.lockin".localized
        static let stats = "tab.stats".localized
        static let profile = "tab.profile".localized
        static let schedule = "tab.schedule".localized
    }

    // Home
    enum Home {
        static let todaysGoal = "home.todays_goal".localized
        static let used = "home.used".localized
        static let left = "home.left".localized
        static let help = "home.help".localized
        static let healthScore = "home.health_score".localized
        static let todayProgress = "home.today_progress".localized
        static let screenTime = "home.screen_time".localized
        static let earnedTime = "home.earned_time".localized
        static let topApps = "home.top_apps".localized
        static let dailyGoal = "home.daily_goal".localized
        static let change = "home.change".localized
        static let upcoming = "home.upcoming".localized
        static let seeAll = "home.see_all".localized
        static let createSchedule = "home.create_schedule".localized
        static let setTimesUnblocked = "home.set_times_unblocked".localized
        static let unblocked = "home.unblocked".localized
        static let everyDay = "home.every_day".localized
        static let weekdays = "home.weekdays".localized
        static let weekends = "home.weekends".localized

        static func greeting(_ period: String) -> String {
            "home.greeting".localized(with: period)
        }
    }

    // Today's Progress
    enum Progress {
        static let todaysProgress = "progress.todays_progress".localized
        static let earn = "progress.earn".localized
        static let spent = "progress.spent".localized
        static let earned = "progress.earned".localized
        static let balance = "progress.balance".localized
        static let thisWeek = "progress.this_week".localized
    }

    // Quick Menu
    enum Quick {
        static let focusMode = "quick.focus_mode".localized
        static let pomodoroTimer = "quick.pomodoro_timer".localized
        static let plank = "quick.plank".localized
        static let holdForTime = "quick.hold_for_time".localized
        static let squats = "quick.squats".localized
        static let earnPerRep = "quick.earn_per_rep".localized
        static let pushups = "quick.pushups".localized
        static let pushupsEarn = "quick.pushups_earn".localized
        static let photoTask = "quick.photo_task".localized
        static let verifyWithPhoto = "quick.verify_with_photo".localized
    }

    // Help Tips
    enum Help {
        static let tip1Title = "help.tip1.title".localized
        static let tip1Desc = "help.tip1.desc".localized
        static let tip2Title = "help.tip2.title".localized
        static let tip2Desc = "help.tip2.desc".localized
        static let tip3Title = "help.tip3.title".localized
        static let tip3Desc = "help.tip3.desc".localized
        static let tip4Title = "help.tip4.title".localized
        static let tip4Desc = "help.tip4.desc".localized
        static let tip5Title = "help.tip5.title".localized
        static let tip5Desc = "help.tip5.desc".localized
        static let tip6Title = "help.tip6.title".localized
        static let tip6Desc = "help.tip6.desc".localized
        static let back = "help.back".localized
        static let next = "help.next".localized
        static let gotIt = "help.got_it".localized
    }

    // Photo Task Presets
    enum Preset {
        static let cleanRoom = "preset.clean_room".localized
        static let homework = "preset.homework".localized
        static let workout = "preset.workout".localized
        static let cook = "preset.cook".localized
        static let read = "preset.read".localized
        static let write = "preset.write".localized
    }

    // LockIn
    enum LockIn {
        static let title = "lockin.title".localized
        static let subtitle = "lockin.subtitle".localized
        static let balance = "lockin.balance".localized
        static let minutes = "lockin.minutes".localized
        static let earn = "lockin.earn".localized
        static let earnTime = "lockin.earn_time".localized
        static let transactionHistory = "lockin.transaction_history".localized
        static let noActivity = "lockin.no_activity".localized
        static let completeExercises = "lockin.complete_exercises".localized
        static let today = "lockin.today".localized
        static let earned = "lockin.earned".localized
        static let spent = "lockin.spent".localized
        static let week = "lockin.week".localized
        static let taskInProgress = "lockin.task_in_progress".localized
        static let `continue` = "lockin.continue".localized
        static let recentActivity = "lockin.recent_activity".localized
        // Favorites
        static let favorites = "lockin.favorites".localized
        static let allExercises = "lockin.all_exercises".localized
        static let doubleTapAdd = "lockin.double_tap_add".localized
        static let doubleTapRemove = "lockin.double_tap_remove".localized

        static func resetsInHours(_ hours: Int) -> String {
            "lockin.resets_in_hours".localized(with: hours)
        }
    }

    // Exercises
    enum Exercise {
        static let pushups = "exercise.pushups".localized
        static let squats = "exercise.squats".localized
        static let plank = "exercise.plank".localized
        static let photoTask = "exercise.photo_task".localized
        static let focusMode = "exercise.focus_mode".localized
        static let custom = "exercise.custom".localized
        static let minPerRep = "exercise.min_per_rep".localized
        static let minPerSec = "exercise.min_per_sec".localized
        static let cameraRequired = "exercise.camera_required".localized
        static let openSettings = "exercise.open_settings".localized
        static let enableCamera = "exercise.enable_camera".localized
        static let greatJob = "exercise.great_job".localized
        static let legDayChampion = "exercise.leg_day_champion".localized
        static let coreOfSteel = "exercise.core_of_steel".localized
        static let minEarned = "exercise.min_earned".localized
        static let doPushups = "exercise.do_pushups".localized
        static let doSquats = "exercise.do_squats".localized
        static let holdPlank = "exercise.hold_plank".localized
        static let pushupInstructions = "exercise.pushup_instructions".localized
        static let squatInstructions = "exercise.squat_instructions".localized
        static let plankInstructions = "exercise.plank_instructions".localized
        static let startPushups = "exercise.start_pushups".localized
        static let startSquats = "exercise.start_squats".localized
        static let startPlank = "exercise.start_plank".localized
        static let doSomePushups = "exercise.do_some_pushups".localized
        static let doSomeSquats = "exercise.do_some_squats".localized
        static let holdThePlank = "exercise.hold_the_plank".localized
        static let pushupsLabel = "exercise.pushups_label".localized
        static let squatsLabel = "exercise.squats_label".localized
        static let seconds = "exercise.seconds".localized
        static let down = "exercise.down".localized
        static let up = "exercise.up".localized
        static let holding = "exercise.holding".localized
        static let getInPosition = "exercise.get_in_position".localized
        static let paused = "exercise.paused".localized
        static let pausedGetBack = "exercise.paused_get_back".localized
        static let timerPausesInfo = "exercise.timer_pauses_info".localized
        static let holdIt = "exercise.hold_it".localized

        // Generic exercise strings
        static func startExercise(_ name: String) -> String {
            "Start \(name)"
        }

        static func doSomeExercise(_ name: String) -> String {
            "Do some \(name)"
        }

        // Step descriptions
        static let readyStep = "exercise.ready_step".localized
        static let exercisingStep = "exercise.exercising_step".localized

        // Exercise info sheet
        static let watchDemo = "exercise.watch_demo".localized
        static let comingSoon = "exercise.coming_soon".localized
        static let howToDoIt = "exercise.how_to_do_it".localized
        static let rewards = "exercise.rewards".localized
        static let gotIt = "exercise.got_it".localized
        static let info = "exercise.info".localized

        // Exercise Descriptions
        enum Desc {
            static let pushups = "exercise.desc.pushups".localized
            static let squats = "exercise.desc.squats".localized
            static let plank = "exercise.desc.plank".localized
            static let jumpingJacks = "exercise.desc.jumping_jacks".localized
            static let lunges = "exercise.desc.lunges".localized
            static let crunches = "exercise.desc.crunches".localized
            static let shoulderPress = "exercise.desc.shoulder_press".localized
            static let legRaises = "exercise.desc.leg_raises".localized
            static let highKnees = "exercise.desc.high_knees".localized
            static let pullUps = "exercise.desc.pull_ups".localized
            static let wallSit = "exercise.desc.wall_sit".localized
            static let sidePlank = "exercise.desc.side_plank".localized
            static let photoVerification = "exercise.desc.photo_verification".localized
            static let custom = "exercise.desc.custom".localized
        }

        // Exercise Instructions
        enum Inst {
            static let pushups: [String] = [
                "exercise.inst.pushups.1".localized,
                "exercise.inst.pushups.2".localized,
                "exercise.inst.pushups.3".localized,
                "exercise.inst.pushups.4".localized
            ]
            static let squats: [String] = [
                "exercise.inst.squats.1".localized,
                "exercise.inst.squats.2".localized,
                "exercise.inst.squats.3".localized,
                "exercise.inst.squats.4".localized
            ]
            static let plank: [String] = [
                "exercise.inst.plank.1".localized,
                "exercise.inst.plank.2".localized,
                "exercise.inst.plank.3".localized,
                "exercise.inst.plank.4".localized
            ]
            static let jumpingJacks: [String] = [
                "exercise.inst.jumping_jacks.1".localized,
                "exercise.inst.jumping_jacks.2".localized,
                "exercise.inst.jumping_jacks.3".localized,
                "exercise.inst.jumping_jacks.4".localized
            ]
            static let lunges: [String] = [
                "exercise.inst.lunges.1".localized,
                "exercise.inst.lunges.2".localized,
                "exercise.inst.lunges.3".localized,
                "exercise.inst.lunges.4".localized
            ]
            static let crunches: [String] = [
                "exercise.inst.crunches.1".localized,
                "exercise.inst.crunches.2".localized,
                "exercise.inst.crunches.3".localized,
                "exercise.inst.crunches.4".localized
            ]
            static let shoulderPress: [String] = [
                "exercise.inst.shoulder_press.1".localized,
                "exercise.inst.shoulder_press.2".localized,
                "exercise.inst.shoulder_press.3".localized,
                "exercise.inst.shoulder_press.4".localized
            ]
            static let legRaises: [String] = [
                "exercise.inst.leg_raises.1".localized,
                "exercise.inst.leg_raises.2".localized,
                "exercise.inst.leg_raises.3".localized,
                "exercise.inst.leg_raises.4".localized
            ]
            static let highKnees: [String] = [
                "exercise.inst.high_knees.1".localized,
                "exercise.inst.high_knees.2".localized,
                "exercise.inst.high_knees.3".localized,
                "exercise.inst.high_knees.4".localized
            ]
            static let pullUps: [String] = [
                "exercise.inst.pull_ups.1".localized,
                "exercise.inst.pull_ups.2".localized,
                "exercise.inst.pull_ups.3".localized,
                "exercise.inst.pull_ups.4".localized
            ]
            static let wallSit: [String] = [
                "exercise.inst.wall_sit.1".localized,
                "exercise.inst.wall_sit.2".localized,
                "exercise.inst.wall_sit.3".localized,
                "exercise.inst.wall_sit.4".localized
            ]
            static let sidePlank: [String] = [
                "exercise.inst.side_plank.1".localized,
                "exercise.inst.side_plank.2".localized,
                "exercise.inst.side_plank.3".localized,
                "exercise.inst.side_plank.4".localized
            ]
            static let photo: [String] = [
                "exercise.inst.photo.1".localized
            ]
        }

        static func cameraTrackingPushups() -> String {
            "exercise.camera_tracking_pushups".localized
        }

        static func cameraTrackingSquats() -> String {
            "exercise.camera_tracking_squats".localized
        }

        static func cameraTrackingPlank() -> String {
            "exercise.camera_tracking_plank".localized
        }

        static func didPushups(_ count: Int) -> String {
            "exercise.did_pushups".localized(with: count)
        }

        static func didSquats(_ count: Int) -> String {
            "exercise.did_squats".localized(with: count)
        }

        static func heldForSeconds(_ count: Int) -> String {
            "exercise.held_for_seconds".localized(with: count)
        }

        static func finishWithReward(_ reward: String) -> String {
            "exercise.finish_with_reward".localized(with: reward)
        }

        // Photo Task keys
        static let photoTaskDesc = "exercise.photo_task_desc".localized
        static let describeTask = "exercise.describe_task".localized
        static let taskPlaceholder = "exercise.task_placeholder".localized
        static let orChoosePreset = "exercise.or_choose_preset".localized
        static let cameraPermissionMessage = "exercise.camera_permission_message".localized
        static let cameraPhotoTaskMessage = "exercise.camera_photo_task_message".localized
        static let beforePhoto = "exercise.before_photo".localized
        static let afterPhoto = "exercise.after_photo".localized
        static let showCompleted = "exercise.show_completed".localized
        static let takeStartingPhoto = "exercise.take_starting_photo".localized
        static let before = "exercise.before".localized
        static let after = "exercise.after".localized
        static let proof = "exercise.proof".localized
        static let goCompleteTask = "exercise.go_complete_task".localized
        static let doneAfterPhoto = "exercise.done_after_photo".localized
        static let doneVerifyTask = "exercise.done_verify_task".localized
        static let taskVerified = "exercise.task_verified".localized
        static let typeMessage = "exercise.type_message".localized

        static func completeAnyway(_ reward: Int) -> String {
            "exercise.complete_anyway".localized(with: reward)
        }
    }

    // Focus Mode
    enum Focus {
        static let title = "focus.title".localized
        static let deepFocus = "focus.deep_focus".localized
        static let description = "focus.description".localized
        static let sessionDuration = "focus.session_duration".localized
        static let appsBlocked = "focus.apps_blocked".localized
        static let noInterruptions = "focus.no_interruptions".localized
        static let start = "focus.start".localized
        static let remaining = "focus.remaining".localized
        static let paused = "focus.paused".localized
        static let active = "focus.active".localized
        static let allBlocked = "focus.all_blocked".localized
        static let end = "focus.end".localized
        static let pause = "focus.pause".localized
        static let resume = "focus.resume".localized
        static let addTime = "focus.add_time".localized
        static let complete = "focus.complete".localized
        static let timeEarned = "focus.time_earned".localized
        static let cancel = "focus.cancel".localized
        static let focusSession = "focus.focus_session".localized
        static let sessionPaused = "focus.session_paused".localized
        static let focusActive = "focus.focus_active".localized
        static let minutes = "focus.minutes".localized

        static func earnInfo(_ minutes: String) -> String {
            "focus.earn_info".localized(with: minutes)
        }

        static func completedSession(_ minutes: Int) -> String {
            "focus.completed_session".localized(with: minutes)
        }

        static func earnMinutes(_ minutes: Int) -> String {
            "focus.earn_minutes".localized(with: minutes)
        }
    }

    // Profile
    enum Profile {
        static let settings = "profile.settings".localized
        static let achievements = "profile.achievements".localized
        static let blockedItems = "profile.blocked_items".localized
        static let blockedItemsDesc = "profile.blocked_items_desc".localized
        static let appSettings = "profile.app_settings".localized
        static let unlockWindow = "profile.unlock_window".localized
        static let unlockWindowDesc = "profile.unlock_window_desc".localized
        static let dailyGoal = "profile.daily_goal".localized
        static let dailyGoalDesc = "profile.daily_goal_desc".localized
        static let defaultAppLimit = "profile.default_app_limit".localized
        static let defaultAppLimitDesc = "profile.default_app_limit_desc".localized
        static let theme = "profile.theme".localized
        static let accentColor = "profile.accent_color".localized
        static let notifications = "profile.notifications".localized
        static let contactUs = "profile.contact_us".localized
        static let rateUs = "profile.rate_us".localized
        static let logout = "profile.logout".localized
        static let apps = "profile.apps".localized
        static let categories = "profile.categories".localized
        static let min = "profile.min".localized
        static let pro = "profile.pro".localized
    }

    // Goals (Blocking View)
    enum Goals {
        static let title = "goals.title".localized
        static let todayUsage = "goals.today_usage".localized
        static let loading = "goals.loading".localized
        static let screenTimeRequired = "goals.screen_time_required".localized
        static let screenTimeDescription = "goals.screen_time_description".localized
        static let grantAccess = "goals.grant_access".localized
        static let requesting = "goals.requesting".localized
        static let blockedApps = "goals.blocked_apps".localized
        static let selected = "goals.selected".localized
        static let selectAppsToBlock = "goals.select_apps_to_block".localized
        static let chooseApps = "goals.choose_apps".localized
        static let appLimits = "goals.app_limits".localized
        static let apps = "goals.apps".localized
        static let noLimitsSet = "goals.no_limits_set".localized
        static let setDailyLimits = "goals.set_daily_limits".localized
        static let addAppLimit = "goals.add_app_limit".localized
        static let addAnotherLimit = "goals.add_another_limit".localized
        static let setLimits = "goals.set_limits".localized
        static let dailyAppLimits = "goals.daily_app_limits".localized
        static let dailyAppLimitsDesc = "goals.daily_app_limits_desc".localized
        static let selectAppsToSetLimits = "goals.select_apps_to_set_limits".localized
        static let noAppLimitsSet = "goals.no_app_limits_set".localized
        static let tapToSetLimits = "goals.tap_to_set_limits".localized
        static let limitsResetInfo = "goals.limits_reset_info".localized
        static let dailyLimitFor = "goals.daily_limit_for".localized
        static let limitReached = "goals.limit_reached".localized
        static let removeLimit = "goals.remove_limit".localized
        static let shareProgress = "goals.share_progress".localized
        static let used = "goals.used".localized
        static let goal = "goals.goal".localized
        static let left = "goals.left".localized
        static let ofGoal = "goals.of_goal".localized

        static func ofMinutes(_ minutes: Int) -> String {
            "goals.of_minutes".localized(with: minutes)
        }

        static func minutesCount(_ minutes: Int) -> String {
            "goals.minutes_count".localized(with: minutes)
        }

        static func minDailyLimit(_ minutes: Int) -> String {
            "goals.min_daily_limit".localized(with: minutes)
        }
    }

    // Contact
    enum Contact {
        static let title = "contact.title".localized
        static let getInTouch = "contact.get_in_touch".localized
        static let loveToHear = "contact.love_to_hear".localized
        static let yourMessage = "contact.your_message".localized
        static let placeholder = "contact.placeholder".localized
        static let sendMessage = "contact.send_message".localized
        static let emailDirectly = "contact.email_directly".localized
    }

    // Rate
    enum Rate {
        static let title = "rate.title".localized
        static let enjoying = "rate.enjoying".localized
        static let loveToHear = "rate.love_to_hear".localized
        static let tapToRate = "rate.tap_to_rate".localized
        static let canDoBetter = "rate.can_do_better".localized
        static let needsImprovement = "rate.needs_improvement".localized
        static let itsOkay = "rate.its_okay".localized
        static let reallyGood = "rate.really_good".localized
        static let loveIt = "rate.love_it".localized
        static let howImprove = "rate.how_improve".localized
        static let whatBetter = "rate.what_better".localized
        static let rateAppStore = "rate.rate_app_store".localized
        static let sendFeedback = "rate.send_feedback".localized
    }


    // Stats
    enum Stats {
        static let streak = "stats.streak".localized
        static let tasks = "stats.tasks".localized
        static let days = "stats.days".localized
        static let totalEarned = "stats.total_earned".localized
        static let totalSpent = "stats.total_spent".localized
        static let weeklyStats = "stats.weekly_stats".localized
        static let today = "stats.today".localized
        static let thisWeek = "stats.this_week".localized
        static let lastWeek = "stats.last_week".localized
        static let dailyAvg = "stats.daily_avg".localized
        static let vsLastWeek = "stats.vs_last_week".localized
        static let lessScreenTime = "stats.less_screen_time".localized
        static let moreScreenTime = "stats.more_screen_time".localized
        static let shareProgress = "stats.share_progress".localized
        static let share = "stats.share".localized
    }

    // Achievements
    enum Achievements {
        static let title = "achievements.title".localized
        static let unlocked = "achievements.unlocked".localized
        static let categoryAll = "achievements.category.all".localized
    }

    // Shield
    enum Shield {
        // Titles
        static let readyToUnlock = "shield.ready_to_unlock".localized
        static let appBlocked = "shield.app_blocked".localized
        static let almostThere = "shield.almost_there".localized
        static let timesUp = "shield.times_up".localized
        static let goalComplete = "shield.goal_complete".localized
        static let dailyGoalReached = "shield.daily_goal_reached".localized
        static let siteLimitReached = "shield.site_limit_reached".localized
        static let notEnoughTime = "shield.not_enough_time".localized
        static let noTimeAvailable = "shield.no_time_available".localized

        // Buttons
        static let stayFocused = "shield.stay_focused".localized
        static let earnTime = "shield.earn_time".localized
        static let earnMoreTime = "shield.earn_more_time".localized
        static let earnTimeNow = "shield.earn_time_now".localized
        static let talkToCoach = "shield.talk_to_coach".localized
        static let close = "shield.close".localized
        static let unlockMinutes = "shield.unlock_minutes".localized
        static let unlockForMinutes = "shield.unlock_for_minutes".localized

        static func unlock(_ minutes: Int) -> String {
            "shield.unlock".localized(with: minutes)
        }

        // App Shield Descriptions
        static let goalCompleteDesc = "shield.goal_complete_desc".localized
        static let timeUpDesc = "shield.time_up_desc".localized
        static let readyUnlockDesc = "shield.ready_unlock_desc".localized
        static let almostThereDesc = "shield.almost_there_desc".localized
        static let appBlockedDesc = "shield.app_blocked_desc".localized

        // Web Shield Descriptions
        static let dailyGoalReachedDesc = "shield.daily_goal_reached_desc".localized
        static let siteLimitDesc = "shield.site_limit_desc".localized
        static let webReadyUnlockDesc = "shield.web_ready_unlock_desc".localized
        static let webNotEnoughDesc = "shield.web_not_enough_desc".localized
        static let webNoTimeDesc = "shield.web_no_time_desc".localized
    }

    // Settings
    enum Settings {
        static let title = "settings.title".localized
        static let accentColor = "settings.accent_color".localized
        static let appearance = "settings.appearance".localized
        static let language = "settings.language".localized
        static let currentLanguage = "settings.current_language".localized
        static let selectLanguage = "settings.select_language".localized
        static let changePassword = "settings.change_password".localized
        static let enterNewPassword = "settings.enter_new_password".localized
        static let saveChanges = "settings.save_changes".localized
        static let dangerZone = "settings.danger_zone".localized
        static let deleteAccount = "settings.delete_account".localized
        static let deleteAccountConfirm = "settings.delete_account_confirm".localized
        static let deleteAccountWarning = "settings.delete_account_warning".localized
        static let typeDelete = "settings.type_delete".localized
        static let restartRequired = "settings.restart_required".localized
        static let restartMessage = "settings.restart_message".localized
    }

    // Onboarding
    enum Onboarding {
        static let hello = "onboarding.hello".localized
        static let welcomeTo = "onboarding.welcome_to".localized
        static let readyToHelp = "onboarding.ready_to_help".localized
        static let takingControl = "onboarding.taking_control".localized
        static let letsStart = "onboarding.lets_start".localized
        static let howOld = "onboarding.how_old".localized
        static let personalizeExp = "onboarding.personalize_exp".localized
        static let dailyScreenTime = "onboarding.daily_screen_time".localized
        static let beHonest = "onboarding.be_honest".localized
        static let badNewsGoodNews = "onboarding.bad_news_good_news".localized
        static let showSomething = "onboarding.show_something".localized
        static let showMe = "onboarding.show_me".localized
        static let theBadNews = "onboarding.the_bad_news".localized
        static let theGoodNews = "onboarding.the_good_news".localized
        static let atHoursPerDay = "onboarding.at_hours_per_day".localized
        static let lookingAtPhone = "onboarding.looking_at_phone".localized
        static let thatsApprox = "onboarding.thats_approx".localized
        static let ofYourLife = "onboarding.of_your_life".localized
        static let youReadRight = "onboarding.you_read_right".localized
        static let whatsGoodNews = "onboarding.whats_good_news".localized
        static let canHelpGetBack = "onboarding.can_help_get_back".localized
        static let turnIntoThings = "onboarding.turn_into_things".localized
        static let letsGetStarted = "onboarding.lets_get_started".localized
        static let firstStep = "onboarding.first_step".localized
        static let connectScreenTime = "onboarding.connect_screen_time".localized
        static let personalizedReport = "onboarding.personalized_report".localized
        static let seeRealUsage = "onboarding.see_real_usage".localized
        static let getRecommendations = "onboarding.get_recommendations".localized
        static let trackProgress = "onboarding.track_progress".localized
        static let enableScreenTime = "onboarding.enable_screen_time".localized
        static let secureOnPhone = "onboarding.secure_on_phone".localized
        static let permissionGranted = "onboarding.permission_granted".localized
        static let whatHappensNext = "onboarding.what_happens_next".localized
        static let tapContinue = "onboarding.tap_continue".localized
        static let selectApps = "onboarding.select_apps".localized
        static let tapDone = "onboarding.tap_done".localized
        static let enableAppBlocking = "onboarding.enable_app_blocking".localized
        static let readyToBlock = "onboarding.ready_to_block".localized
        static let shieldWhenOpen = "onboarding.shield_when_open".localized
        static let stayActiveEarn = "onboarding.stay_active_earn".localized
        static let completeExercisesEarn = "onboarding.complete_exercises_earn".localized
        static let heresReality = "onboarding.heres_reality".localized
        static let basedOnUsage = "onboarding.based_on_usage".localized
        static let todaysScreenTime = "onboarding.todays_screen_time".localized
        static let thisWeek = "onboarding.this_week".localized
        static let lifeOnPhone = "onboarding.life_on_phone".localized
        static let atThisRate = "onboarding.at_this_rate".localized
        static let letsFixThis = "onboarding.lets_fix_this".localized
        static let yourPotential = "onboarding.your_potential".localized
        static let projectionTitle = "onboarding.projection_title".localized
        static let seeHowMuch = "onboarding.see_how_much".localized
        static let reduceBy = "onboarding.reduce_by".localized
        static let weeklyProjection = "onboarding.weekly_projection".localized
        static let freeTimeWeek = "onboarding.free_time_week".localized
        static let lifeReclaimed = "onboarding.life_reclaimed".localized
        static let accomplishGoals = "onboarding.accomplish_goals".localized
        static let current = "onboarding.current".localized
        static let withLockIn = "onboarding.with_lockin".localized
        static let withoutLockIn = "onboarding.without_lockin".localized
        static let dayOne = "onboarding.day_one".localized
        static let dayFourteen = "onboarding.day_fourteen".localized
        static let projectionSubtitle = "onboarding.projection_subtitle".localized
        static let unlockPotential = "onboarding.unlock_potential".localized
        static let hoursBack = "onboarding.hours_back".localized
        static let smartCoach = "onboarding.smart_coach".localized
        static let taskVerification = "onboarding.task_verification".localized
        static let focusSessions = "onboarding.focus_sessions".localized
        static let dailyGoals = "onboarding.daily_goals".localized
        static let completeTasks = "onboarding.complete_tasks".localized
        static let appRating = "onboarding.app_rating".localized
        static let moreProductive = "onboarding.more_productive".localized
        static let startFreeTrial = "onboarding.start_free_trial".localized
        static let daysFree = "onboarding.days_free".localized
        static let maybeLater = "onboarding.maybe_later".localized
        static let allowNotifications = "onboarding.allow_notifications".localized
        static let remindOverscrolling = "onboarding.remind_overscrolling".localized
        static let notificationsEnabled = "onboarding.notifications_enabled".localized
        static let scrollingFor = "onboarding.scrolling_for".localized
        static let timeForBreak = "onboarding.time_for_break".localized
        static let whatToBlock = "onboarding.what_to_block".localized
        static let changeThisLater = "onboarding.change_this_later".localized
        static let apps = "onboarding.apps".localized
        static let categories = "onboarding.categories".localized
        static let startBlocking = "onboarding.start_blocking".localized
        static let itemsSelected = "onboarding.items_selected".localized
        static let setDailyGoal = "onboarding.set_daily_goal".localized
        static let howMuchAllow = "onboarding.how_much_allow".localized
        static let perDay = "onboarding.per_day".localized
        static let changeInSettings = "onboarding.change_in_settings".localized
        static let setMyGoal = "onboarding.set_my_goal".localized
        static let days = "onboarding.days".localized
        static let years = "onboarding.years".localized

        // Commitment step
        static let commitmentTitle = "onboarding.commitment_title".localized
        static let committed = "onboarding.committed".localized
        static let pressAndHold = "onboarding.press_and_hold".localized
        static let takenFirstStep = "onboarding.taken_first_step".localized
        static let keepHolding = "onboarding.keep_holding".localized
        static let holdTheOrb = "onboarding.hold_the_orb".localized
        static let letsSetUp = "onboarding.lets_set_up".localized

        // Common
        static let now = "onboarding.now".localized

        // OnboardingView
        static let howItWorks = "onboarding.how_it_works".localized
        static let blockApps = "onboarding.block_apps".localized
        static let blockAppsDesc = "onboarding.block_apps_desc".localized
        static let earnTime = "onboarding.earn_time".localized
        static let earnTimeDesc = "onboarding.earn_time_desc".localized
        static let spendWisely = "onboarding.spend_wisely".localized
        static let spendWiselyDesc = "onboarding.spend_wisely_desc".localized
        static let scheduleFreedom = "onboarding.schedule_freedom".localized
        static let scheduleFreedomDesc = "onboarding.schedule_freedom_desc".localized
        static let selectAppsToBlock = "onboarding.select_apps_to_block".localized
        static let appsBlockedByDefault = "onboarding.apps_blocked_by_default".localized
        static let earnScreenTime = "onboarding.earn_screen_time".localized
        static let earnScreenTimeDesc = "onboarding.earn_screen_time_desc".localized
        static let unlockWindowTitle = "onboarding.unlock_window_title".localized
        static let unlockWindowDesc = "onboarding.unlock_window_desc".localized
        static let howItWorksExplain = "onboarding.how_it_works_explain".localized
        static let howItWorksDetail = "onboarding.how_it_works_detail".localized
        static let minutesSelected = "onboarding.minutes_selected".localized
        static let almostReady = "onboarding.almost_ready".localized
        static let grantPermissions = "onboarding.grant_permissions".localized
        static let screenTime = "onboarding.screen_time".localized
        static let requiredToBlock = "onboarding.required_to_block".localized
        static let camera = "onboarding.camera".localized
        static let forExerciseVerification = "onboarding.for_exercise_verification".localized
        static let grant = "onboarding.grant".localized
        static let min = "onboarding.min".localized

        // Image Onboarding
        static let slide1Title = "onboarding.slide1_title".localized
        static let slide1Description = "onboarding.slide1_description".localized
        static let slide1Badge = "onboarding.slide1_badge".localized
        static let slide2Title = "onboarding.slide2_title".localized
        static let slide2Description = "onboarding.slide2_description".localized
        static let slide2Badge = "onboarding.slide2_badge".localized
        static let slide3Title = "onboarding.slide3_title".localized
        static let slide3Description = "onboarding.slide3_description".localized
        static let slide3Badge = "onboarding.slide3_badge".localized

        // Age ranges
        static let ageUnder18 = "onboarding.age_under_18".localized
        static let age18_24 = "onboarding.age_18_24".localized
        static let age25_30 = "onboarding.age_25_30".localized
        static let age31_40 = "onboarding.age_31_40".localized
        static let age41_50 = "onboarding.age_41_50".localized
        static let age51Plus = "onboarding.age_51_plus".localized

        // Hours per day
        static let hours1_2 = "onboarding.hours_1_2".localized
        static let hours2_4 = "onboarding.hours_2_4".localized
        static let hours4_6 = "onboarding.hours_4_6".localized
        static let hours6_8 = "onboarding.hours_6_8".localized
        static let hours8Plus = "onboarding.hours_8_plus".localized
    }

    // Auth
    enum Auth {
        static let welcomeTo = "auth.welcome_to".localized
        static let takeControl = "auth.take_control".localized
        static let continueGoogle = "auth.continue_google".localized
        static let continueApple = "auth.continue_apple".localized
        static let continueEmail = "auth.continue_email".localized
        static let getStarted = "auth.get_started".localized
        static let alreadyHaveAccount = "auth.already_have_account".localized
        static let privacyPolicy = "auth.privacy_policy".localized
        static let termsOfService = "auth.terms_of_service".localized
        static let createAccount = "auth.create_account".localized
        static let welcomeBack = "auth.welcome_back".localized
        static let startTakingControl = "auth.start_taking_control".localized
        static let goalsWaiting = "auth.goals_waiting".localized
        static let email = "auth.email".localized
        static let password = "auth.password".localized
        static let enterPassword = "auth.enter_password".localized
        static let agreeToTerms = "auth.agree_to_terms".localized
        static let termsConditions = "auth.terms_conditions".localized
        static let signIn = "auth.sign_in".localized
        static let signUp = "auth.sign_up".localized
        static let orContinueWith = "auth.or_continue_with".localized
        static let noAccount = "auth.no_account".localized
        static let haveAccount = "auth.have_account".localized
    }

    // Streak Celebration
    enum Streak {
        static let started = "streak.started".localized
        static let days = "streak.days".localized
        static let keepGoing = "streak.keep_going".localized
        static let continue_ = "streak.continue".localized
        static let title = "streak.title".localized
    }

    // Activity History
    enum History {
        static let title = "history.title".localized
        static let empty = "history.empty".localized
        static let emptySubtitle = "history.empty_subtitle".localized
        static let today = "history.today".localized
        static let yesterday = "history.yesterday".localized
        static let viewAll = "history.view_all".localized
    }

    // Notifications
    enum Notification {
        static let earnTimeAction = "notification.earn_time_action".localized
        static let viewStatsAction = "notification.view_stats_action".localized
        static let dailyReminderTitle = "notification.daily_reminder_title".localized
        static let dailyReminderBody = "notification.daily_reminder_body".localized
        static let streakRiskTitle = "notification.streak_risk_title".localized
        static let needMoreTimeTitle = "notification.need_more_time_title".localized
        static let needMoreTimeBody = "notification.need_more_time_body".localized
        static let focusCompleteTitle = "notification.focus_complete_title".localized

        static func streakRiskBody(_ days: Int) -> String {
            "notification.streak_risk_body".localized(with: days)
        }

        static func focusCompleteBody(_ minutes: String) -> String {
            "notification.focus_complete_body".localized(with: minutes)
        }
    }

    // Coach
    enum Coach {
        static let title = "coach.title".localized
        static let yourAiCoach = "coach.your_ai_coach".localized
        static let description = "coach.description".localized
        static let greetingCanEarn = "coach.greeting_can_earn".localized
        static let greetingCantEarn = "coach.greeting_cant_earn".localized
        static let prompt1 = "coach.prompt1".localized
        static let prompt2 = "coach.prompt2".localized
        static let prompt3 = "coach.prompt3".localized
        static let readyToEarn = "coach.ready_to_earn".localized
        static let earnMinutes = "coach.earn_minutes".localized
        static let thanksReflecting = "coach.thanks_reflecting".localized
        static let bonusAcknowledgment = "coach.bonus_acknowledgment".localized
        static let typeMessage = "coach.type_message".localized
        static let responseLimit = "coach.response_limit".localized
        static let responseStress = "coach.response_stress".localized
        static let responseFocus = "coach.response_focus".localized
        static let responseBored = "coach.response_bored".localized
        static let responseDefault = "coach.response_default".localized

        static func minutesEarned(_ count: Int) -> String {
            "coach.minutes_earned".localized(with: count)
        }
    }

    // Detox
    enum Detox {
        static let title = "detox.title".localized
        static let stayFocused = "detox.stay_focused".localized
        static let digitalDetox = "detox.digital_detox".localized
        static let allAppsBlocked = "detox.all_apps_blocked".localized
        static let takeBreak = "detox.take_break".localized
        static let remaining = "detox.remaining".localized
        static let duration = "detox.duration".localized
        static let endDetox = "detox.end_detox".localized
        static let startDetox = "detox.start_detox".localized

        static func minutes(_ count: Int) -> String {
            "\(count)m"
        }

        static func hours(_ count: Int) -> String {
            "\(count)h"
        }
    }

    // Paywall
    enum Paywall {
        static let pro = "paywall.pro".localized
        static let title = "paywall.title".localized
        static let subtitle = "paywall.subtitle".localized
        static let usersLove = "paywall.users_love".localized
        static let featureBlocking = "paywall.feature_blocking".localized
        static let featureFocus = "paywall.feature_focus".localized
        static let featureAnalytics = "paywall.feature_analytics".localized
        static let trialToggle = "paywall.trial_toggle".localized
        static let trialSubtitle = "paywall.trial_subtitle".localized
        static let choosePlan = "paywall.choose_plan".localized
        static let loadingPlans = "paywall.loading_plans".localized
        static let annual = "paywall.annual".localized
        static let monthly = "paywall.monthly".localized
        static let legalTrial = "paywall.legal_trial".localized
        static let legalNoTrial = "paywall.legal_no_trial".localized
        static let termsOfService = "paywall.terms_of_service".localized
        static let privacyPolicy = "paywall.privacy_policy".localized
        static let restorePurchases = "paywall.restore_purchases".localized
        static let noPurchasesFound = "paywall.no_purchases_found".localized
        static let startTrial = "paywall.start_trial".localized
        static let subscribeNow = "paywall.subscribe_now".localized
        static let cancelInAppStore = "paywall.cancel_in_app_store".localized
        static let welcomeTitle = "paywall.welcome_title".localized
        static let welcomeMessage = "paywall.welcome_message".localized
        static let continueButton = "paywall.continue".localized
        static let error = "paywall.error".localized
        static let ok = "paywall.ok".localized
        static let review1Text = "paywall.review1_text".localized
        static let review1Author = "paywall.review1_author".localized
        static let review2Text = "paywall.review2_text".localized
        static let review2Author = "paywall.review2_author".localized
        static let review3Text = "paywall.review3_text".localized
        static let review3Author = "paywall.review3_author".localized
        static let perYear = "paywall.per_year".localized
        static let perMonth = "paywall.per_month".localized

        static func save(_ percent: Int) -> String {
            "paywall.save".localized(with: "\(percent)")
        }

        static func billedAnnually(_ price: String) -> String {
            "paywall.billed_annually".localized(with: price)
        }
    }
}
