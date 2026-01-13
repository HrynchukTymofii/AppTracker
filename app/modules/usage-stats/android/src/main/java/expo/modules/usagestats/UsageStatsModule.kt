package expo.modules.usagestats

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStats
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.os.Build
import android.os.Process
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import java.util.*
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.util.Base64
import java.io.ByteArrayOutputStream

class UsageStatsModule : Module() {
    private val context: Context
        get() = requireNotNull(appContext.reactContext)

    // Cache for isUserApp results to avoid repeated PackageManager queries
    private val userAppCache = mutableMapOf<String, Boolean>()
    private var userAppCacheTime = 0L
    private val CACHE_DURATION = 5 * 60 * 1000L // 5 minutes

    private fun isUserAppCached(packageName: String, pm: PackageManager): Boolean {
        // Clear cache if expired
        if (System.currentTimeMillis() - userAppCacheTime > CACHE_DURATION) {
            userAppCache.clear()
            userAppCacheTime = System.currentTimeMillis()
        }
        return userAppCache.getOrPut(packageName) { isUserApp(packageName, pm) }
    }

    override fun definition() = ModuleDefinition {
        Name("UsageStats")

        // Check if usage stats permission is granted
        AsyncFunction("hasUsageStatsPermission") {
            hasUsagePermission()
        }

        // Open usage stats settings
        Function("openUsageStatsSettings") {
            val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
        }

        // Get usage stats for a time range
        AsyncFunction("getUsageStats") { startTime: Long, endTime: Long ->
            getUsageStatsData(startTime, endTime)
        }

        // Get today's usage stats
        AsyncFunction("getTodayUsageStats") {
            val calendar = Calendar.getInstance()
            calendar.set(Calendar.HOUR_OF_DAY, 0)
            calendar.set(Calendar.MINUTE, 0)
            calendar.set(Calendar.SECOND, 0)
            calendar.set(Calendar.MILLISECOND, 0)
            
            val startTime = calendar.timeInMillis
            val endTime = System.currentTimeMillis()
            
            getUsageStatsData(startTime, endTime)
        }

        // Get week's usage stats (rolling 7 days)
        AsyncFunction("getWeekUsageStats") { weekOffset: Int ->
            val calendar = Calendar.getInstance()
            // Set to end of today
            calendar.set(Calendar.HOUR_OF_DAY, 23)
            calendar.set(Calendar.MINUTE, 59)
            calendar.set(Calendar.SECOND, 59)
            calendar.set(Calendar.MILLISECOND, 999)
            // Add week offset (weekOffset 0 = last 7 days, weekOffset -1 = 7-14 days ago)
            calendar.add(Calendar.DAY_OF_YEAR, weekOffset * 7)
            val endTime = if (weekOffset >= 0) System.currentTimeMillis() else calendar.timeInMillis

            // Go back 6 days for start (today + 6 previous days = 7 days)
            calendar.add(Calendar.DAY_OF_YEAR, -6)
            calendar.set(Calendar.HOUR_OF_DAY, 0)
            calendar.set(Calendar.MINUTE, 0)
            calendar.set(Calendar.SECOND, 0)
            calendar.set(Calendar.MILLISECOND, 0)
            val startTime = calendar.timeInMillis

            getUsageStatsData(startTime, endTime)
        }

        // Get daily usage for the week
        AsyncFunction("getDailyUsageForWeek") { weekOffset: Int ->
            getDailyUsageData(weekOffset)
        }

        // Get month's usage stats
        AsyncFunction("getMonthUsageStats") { monthOffset: Int ->
            getMonthUsageStatsData(monthOffset)
        }

        // Get daily usage for entire month
        AsyncFunction("getDailyUsageForMonth") { monthOffset: Int ->
            getDailyUsageForMonthData(monthOffset)
        }

        // Get comparison data between two weeks
        AsyncFunction("getWeekComparison") {
            getWeekComparisonData()
        }

        // Get installed apps list
        AsyncFunction("getInstalledApps") {
            getInstalledAppsList()
        }
    }

    private fun hasUsagePermission(): Boolean {
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            appOps.unsafeCheckOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                context.packageName
            )
        } else {
            @Suppress("DEPRECATION")
            appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                context.packageName
            )
        }
        return mode == AppOpsManager.MODE_ALLOWED
    }

    private fun getUsageStatsData(startTime: Long, endTime: Long): Map<String, Any> {
        if (!hasUsagePermission()) {
            return mapOf(
                "hasPermission" to false,
                "apps" to emptyList<Map<String, Any>>(),
                "totalScreenTime" to 0L,
                "unlocks" to 0
            )
        }

        val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val packageManager = context.packageManager

        // Use queryEvents for accurate usage tracking
        val appUsageMap = mutableMapOf<String, Long>()
        val appLastUsedMap = mutableMapOf<String, Long>()
        val appResumeTimeMap = mutableMapOf<String, Long>()
        var unlocks = 0

        val usageEvents = usageStatsManager.queryEvents(startTime, endTime)
        val event = UsageEvents.Event()

        while (usageEvents.hasNextEvent()) {
            usageEvents.getNextEvent(event)
            val packageName = event.packageName

            when (event.eventType) {
                UsageEvents.Event.ACTIVITY_RESUMED, UsageEvents.Event.MOVE_TO_FOREGROUND -> {
                    // App moved to foreground
                    appResumeTimeMap[packageName] = event.timeStamp
                    appLastUsedMap[packageName] = event.timeStamp
                }
                UsageEvents.Event.ACTIVITY_PAUSED, UsageEvents.Event.MOVE_TO_BACKGROUND -> {
                    // App moved to background - calculate time spent
                    val resumeTime = appResumeTimeMap[packageName]
                    if (resumeTime != null && resumeTime > 0) {
                        val timeSpent = event.timeStamp - resumeTime
                        if (timeSpent > 0 && timeSpent < 24 * 60 * 60 * 1000) { // Sanity check: less than 24 hours
                            appUsageMap[packageName] = (appUsageMap[packageName] ?: 0L) + timeSpent
                        }
                        appResumeTimeMap[packageName] = 0L
                    }
                }
                // KEYGUARD_HIDDEN = 18 (screen unlocked)
                18 -> {
                    unlocks++
                }
            }
        }

        // Handle apps still in foreground (add time until endTime)
        val now = System.currentTimeMillis()
        appResumeTimeMap.forEach { (packageName, resumeTime) ->
            if (resumeTime > 0) {
                val timeSpent = minOf(now, endTime) - resumeTime
                if (timeSpent > 0 && timeSpent < 24 * 60 * 60 * 1000) {
                    appUsageMap[packageName] = (appUsageMap[packageName] ?: 0L) + timeSpent
                }
            }
        }

        // Filter to user apps only and convert to list
        val apps = appUsageMap
            .filter { (packageName, totalTime) ->
                totalTime > 0 && isUserAppCached(packageName, packageManager)
            }
            .map { (packageName, totalTime) ->
                var appName = packageName

                try {
                    val appInfo = packageManager.getApplicationInfo(packageName, 0)
                    appName = packageManager.getApplicationLabel(appInfo).toString()
                } catch (e: Exception) {
                    // Keep default values
                }

                mapOf(
                    "packageName" to packageName,
                    "appName" to appName,
                    "timeInForeground" to totalTime,
                    "lastTimeUsed" to (appLastUsedMap[packageName] ?: 0L),
                    "iconUrl" to "" // Icons fetched separately via getInstalledApps
                )
            }.sortedByDescending { it["timeInForeground"] as Long }

        val totalScreenTime = apps.sumOf { it["timeInForeground"] as Long }

        return mapOf(
            "hasPermission" to true,
            "apps" to apps.take(15), // Top 15 apps
            "totalScreenTime" to totalScreenTime,
            "unlocks" to unlocks
        )
    }

    private fun getDailyUsageData(weekOffset: Int): List<Map<String, Any>> {
        val dayNames = listOf("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat")

        if (!hasUsagePermission()) {
            return (0..6).map { mapOf("day" to dayNames[it], "hours" to 0.0) }
        }

        val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val packageManager = context.packageManager

        // Calculate week boundaries
        val baseCalendar = Calendar.getInstance()
        baseCalendar.set(Calendar.HOUR_OF_DAY, 0)
        baseCalendar.set(Calendar.MINUTE, 0)
        baseCalendar.set(Calendar.SECOND, 0)
        baseCalendar.set(Calendar.MILLISECOND, 0)
        baseCalendar.add(Calendar.DAY_OF_YEAR, -6 + (weekOffset * 7))

        val weekStartTime = baseCalendar.timeInMillis
        val weekEndCalendar = Calendar.getInstance().apply {
            timeInMillis = weekStartTime
            add(Calendar.DAY_OF_YEAR, 7)
        }
        val weekEndTime = if (weekOffset >= 0) System.currentTimeMillis() else weekEndCalendar.timeInMillis

        val dailyTotals = LongArray(7) { 0L }
        val now = System.currentTimeMillis()

        // Determine cutoff for queryEvents (7 days ago - Android keeps detailed events ~7-14 days)
        val eventsCutoffTime = now - (7L * 24 * 60 * 60 * 1000)

        // Process each day individually - use queryEvents for recent days, queryUsageStats for older
        for (dayIndex in 0..6) {
            val dayStart = weekStartTime + dayIndex * 24L * 60 * 60 * 1000
            val dayEnd = dayStart + 24L * 60 * 60 * 1000

            if (dayStart > now) continue // Skip future days

            val effectiveDayEnd = minOf(dayEnd, now)

            if (dayStart >= eventsCutoffTime) {
                // Recent day: use queryEvents for accurate tracking
                val appResumeTimeMap = mutableMapOf<String, Long>()
                val usageEvents = usageStatsManager.queryEvents(dayStart, effectiveDayEnd)
                val event = UsageEvents.Event()

                while (usageEvents.hasNextEvent()) {
                    usageEvents.getNextEvent(event)
                    val packageName = event.packageName

                    if (!isUserAppCached(packageName, packageManager)) continue

                    when (event.eventType) {
                        UsageEvents.Event.ACTIVITY_RESUMED, UsageEvents.Event.MOVE_TO_FOREGROUND -> {
                            appResumeTimeMap[packageName] = event.timeStamp
                        }
                        UsageEvents.Event.ACTIVITY_PAUSED, UsageEvents.Event.MOVE_TO_BACKGROUND -> {
                            val resumeTime = appResumeTimeMap[packageName]
                            if (resumeTime != null && resumeTime > 0) {
                                val timeSpent = event.timeStamp - resumeTime
                                if (timeSpent > 0 && timeSpent < 24 * 60 * 60 * 1000) {
                                    dailyTotals[dayIndex] += timeSpent
                                }
                                appResumeTimeMap[packageName] = 0L
                            }
                        }
                    }
                }

                // Handle apps still in foreground
                appResumeTimeMap.forEach { (_, resumeTime) ->
                    if (resumeTime > 0) {
                        val timeSpent = effectiveDayEnd - resumeTime
                        if (timeSpent > 0 && timeSpent < 24 * 60 * 60 * 1000) {
                            dailyTotals[dayIndex] += timeSpent
                        }
                    }
                }
            } else {
                // Older day: use queryUsageStats
                val usageStats = usageStatsManager.queryUsageStats(
                    UsageStatsManager.INTERVAL_DAILY,
                    dayStart,
                    effectiveDayEnd
                )

                // Sum up usage for user apps - don't filter by firstTimeStamp as it's unreliable
                val seenPackages = mutableSetOf<String>()
                usageStats?.forEach { stats ->
                    if (stats.totalTimeInForeground > 0 &&
                        isUserAppCached(stats.packageName, packageManager) &&
                        !seenPackages.contains(stats.packageName)) {
                        seenPackages.add(stats.packageName)
                        dailyTotals[dayIndex] += stats.totalTimeInForeground
                    }
                }
            }
        }

        // Build result
        return (0..6).map { dayIndex ->
            val dayCalendar = Calendar.getInstance().apply {
                timeInMillis = weekStartTime
                add(Calendar.DAY_OF_YEAR, dayIndex)
            }
            val dayOfWeek = dayCalendar.get(Calendar.DAY_OF_WEEK) - 1
            val isFuture = dayCalendar.timeInMillis > now

            val hours = if (isFuture) 0.0 else dailyTotals[dayIndex] / (1000.0 * 60 * 60)
            mapOf(
                "day" to dayNames[dayOfWeek],
                "hours" to (Math.round(hours * 10) / 10.0)
            )
        }
    }

    private fun getMonthUsageStatsData(monthOffset: Int): Map<String, Any> {
        val calendar = Calendar.getInstance()

        // Set to first day of month
        calendar.set(Calendar.DAY_OF_MONTH, 1)
        calendar.set(Calendar.HOUR_OF_DAY, 0)
        calendar.set(Calendar.MINUTE, 0)
        calendar.set(Calendar.SECOND, 0)
        calendar.set(Calendar.MILLISECOND, 0)
        calendar.add(Calendar.MONTH, monthOffset)
        val startTime = calendar.timeInMillis

        // Set to end of month
        calendar.add(Calendar.MONTH, 1)
        val endOfMonth = calendar.timeInMillis
        val endTime = if (monthOffset >= 0) minOf(endOfMonth, System.currentTimeMillis()) else endOfMonth

        return getUsageStatsData(startTime, endTime)
    }

    private fun getDailyUsageForMonthData(monthOffset: Int): List<Map<String, Any>> {
        if (!hasUsagePermission()) {
            return emptyList()
        }

        val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val packageManager = context.packageManager

        val calendar = Calendar.getInstance()

        // Set to first day of month
        calendar.set(Calendar.DAY_OF_MONTH, 1)
        calendar.set(Calendar.HOUR_OF_DAY, 0)
        calendar.set(Calendar.MINUTE, 0)
        calendar.set(Calendar.SECOND, 0)
        calendar.set(Calendar.MILLISECOND, 0)
        calendar.add(Calendar.MONTH, monthOffset)

        val daysInMonth = calendar.getActualMaximum(Calendar.DAY_OF_MONTH)
        val monthStart = calendar.timeInMillis

        // Calculate month end
        val monthEndCalendar = Calendar.getInstance().apply {
            timeInMillis = monthStart
            add(Calendar.MONTH, 1)
        }
        val monthEnd = if (monthOffset >= 0) System.currentTimeMillis() else monthEndCalendar.timeInMillis

        val dailyTotals = LongArray(daysInMonth) { 0L }
        val dailyUnlocks = IntArray(daysInMonth) { 0 }
        val now = System.currentTimeMillis()

        // Determine cutoff for queryEvents (7 days ago)
        val eventsCutoffTime = now - (7L * 24 * 60 * 60 * 1000)

        android.util.Log.d("UsageStats", "getDailyUsageForMonth: monthOffset=$monthOffset, daysInMonth=$daysInMonth")
        android.util.Log.d("UsageStats", "monthStart=${java.text.SimpleDateFormat("yyyy-MM-dd").format(java.util.Date(monthStart))}, cutoff=${java.text.SimpleDateFormat("yyyy-MM-dd").format(java.util.Date(eventsCutoffTime))}")

        // Process days - use queryEvents for recent days, queryUsageStats for older
        for (dayIndex in 0 until daysInMonth) {
            val dayStart = monthStart + dayIndex * 24L * 60 * 60 * 1000
            val dayEnd = dayStart + 24L * 60 * 60 * 1000

            if (dayStart > now) continue // Skip future days

            val effectiveDayEnd = minOf(dayEnd, now)
            val dayDateStr = java.text.SimpleDateFormat("yyyy-MM-dd").format(java.util.Date(dayStart))

            if (dayStart >= eventsCutoffTime) {
                // Recent day: use queryEvents for accurate tracking
                android.util.Log.d("UsageStats", "Day $dayDateStr (index $dayIndex): using queryEvents (recent)")

                val appResumeTimeMap = mutableMapOf<String, Long>()
                val usageEvents = usageStatsManager.queryEvents(dayStart, effectiveDayEnd)
                val event = UsageEvents.Event()
                var eventCount = 0

                while (usageEvents.hasNextEvent()) {
                    usageEvents.getNextEvent(event)
                    eventCount++
                    val packageName = event.packageName

                    when (event.eventType) {
                        UsageEvents.Event.ACTIVITY_RESUMED, UsageEvents.Event.MOVE_TO_FOREGROUND -> {
                            if (isUserAppCached(packageName, packageManager)) {
                                appResumeTimeMap[packageName] = event.timeStamp
                            }
                        }
                        UsageEvents.Event.ACTIVITY_PAUSED, UsageEvents.Event.MOVE_TO_BACKGROUND -> {
                            val resumeTime = appResumeTimeMap[packageName]
                            if (resumeTime != null && resumeTime > 0) {
                                val timeSpent = event.timeStamp - resumeTime
                                if (timeSpent > 0 && timeSpent < 24 * 60 * 60 * 1000) {
                                    dailyTotals[dayIndex] += timeSpent
                                }
                                appResumeTimeMap[packageName] = 0L
                            }
                        }
                        // KEYGUARD_HIDDEN = 18 (screen unlocked)
                        18 -> {
                            dailyUnlocks[dayIndex]++
                        }
                    }
                }

                // Handle apps still in foreground
                appResumeTimeMap.forEach { (_, resumeTime) ->
                    if (resumeTime > 0) {
                        val timeSpent = effectiveDayEnd - resumeTime
                        if (timeSpent > 0 && timeSpent < 24 * 60 * 60 * 1000) {
                            dailyTotals[dayIndex] += timeSpent
                        }
                    }
                }
                android.util.Log.d("UsageStats", "Day $dayDateStr: events=$eventCount, total=${dailyTotals[dayIndex]}ms (${dailyTotals[dayIndex] / 1000 / 60}min)")
            } else {
                // Older day: use queryUsageStats
                android.util.Log.d("UsageStats", "Day $dayDateStr (index $dayIndex): using queryUsageStats (older than cutoff)")

                val usageStats = usageStatsManager.queryUsageStats(
                    UsageStatsManager.INTERVAL_DAILY,
                    dayStart,
                    effectiveDayEnd
                )

                android.util.Log.d("UsageStats", "Day $dayDateStr: queryUsageStats returned ${usageStats?.size ?: 0} entries")

                // Sum up usage for user apps - don't filter by firstTimeStamp as it's unreliable
                val seenPackages = mutableSetOf<String>()
                var dayTotal = 0L
                usageStats?.forEach { stats ->
                    if (stats.totalTimeInForeground > 0 &&
                        isUserAppCached(stats.packageName, packageManager) &&
                        !seenPackages.contains(stats.packageName)) {
                        seenPackages.add(stats.packageName)
                        dailyTotals[dayIndex] += stats.totalTimeInForeground
                        dayTotal += stats.totalTimeInForeground
                    }
                }
                android.util.Log.d("UsageStats", "Day $dayDateStr: total=${dayTotal}ms (${dayTotal / 1000 / 60}min), apps=${seenPackages.size}")

                // No unlock data available for older days
                dailyUnlocks[dayIndex] = 0
            }
        }

        // Build result
        return (0 until daysInMonth).map { dayIndex ->
            val dayCalendar = Calendar.getInstance().apply {
                timeInMillis = monthStart
                add(Calendar.DAY_OF_MONTH, dayIndex)
            }
            val isFuture = dayCalendar.timeInMillis > now
            val hours = if (isFuture) 0.0 else dailyTotals[dayIndex] / (1000.0 * 60 * 60)
            val unlocks = if (isFuture) 0 else dailyUnlocks[dayIndex]

            mapOf(
                "date" to formatDateString(dayCalendar),
                "dayOfMonth" to dayCalendar.get(Calendar.DAY_OF_MONTH),
                "dayOfWeek" to dayCalendar.get(Calendar.DAY_OF_WEEK) - 1,
                "hours" to (Math.round(hours * 10) / 10.0),
                "unlocks" to unlocks
            )
        }
    }

    private fun getWeekComparisonData(): Map<String, Any> {
        val thisWeekStats = getWeekStatsInternal(0)
        val lastWeekStats = getWeekStatsInternal(-1)

        val thisWeekTotal = thisWeekStats["totalHours"] as Double
        val lastWeekTotal = lastWeekStats["totalHours"] as Double

        val thisWeekAvg = thisWeekStats["avgHours"] as Double
        val lastWeekAvg = lastWeekStats["avgHours"] as Double

        val thisWeekUnlocks = thisWeekStats["totalUnlocks"] as Int
        val lastWeekUnlocks = lastWeekStats["totalUnlocks"] as Int

        val hoursDiff = thisWeekTotal - lastWeekTotal
        val percentChange = if (lastWeekTotal > 0) ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100 else 0.0
        val unlocksDiff = thisWeekUnlocks - lastWeekUnlocks
        val unlocksPercentChange = if (lastWeekUnlocks > 0) ((thisWeekUnlocks - lastWeekUnlocks).toDouble() / lastWeekUnlocks) * 100 else 0.0

        return mapOf(
            "thisWeek" to mapOf(
                "totalHours" to thisWeekTotal,
                "avgHours" to thisWeekAvg,
                "unlocks" to thisWeekUnlocks,
                "dailyData" to (thisWeekStats["dailyData"] as List<*>)
            ),
            "lastWeek" to mapOf(
                "totalHours" to lastWeekTotal,
                "avgHours" to lastWeekAvg,
                "unlocks" to lastWeekUnlocks,
                "dailyData" to (lastWeekStats["dailyData"] as List<*>)
            ),
            "comparison" to mapOf(
                "hoursDiff" to (Math.round(hoursDiff * 10) / 10.0),
                "hoursPercentChange" to (Math.round(percentChange * 10) / 10.0),
                "unlocksDiff" to unlocksDiff,
                "unlocksPercentChange" to (Math.round(unlocksPercentChange * 10) / 10.0),
                "improved" to (hoursDiff < 0)
            )
        )
    }

    private fun getWeekStatsInternal(weekOffset: Int): Map<String, Any> {
        val dailyData = getDailyUsageData(weekOffset)
        val validDays = dailyData.filter { (it["hours"] as Double) > 0 }
        val totalHours = dailyData.sumOf { it["hours"] as Double }
        val avgHours = if (validDays.isNotEmpty()) totalHours / validDays.size else 0.0

        val calendar = Calendar.getInstance()
        calendar.set(Calendar.HOUR_OF_DAY, 23)
        calendar.set(Calendar.MINUTE, 59)
        calendar.add(Calendar.DAY_OF_YEAR, weekOffset * 7)
        val endTime = if (weekOffset >= 0) System.currentTimeMillis() else calendar.timeInMillis
        calendar.add(Calendar.DAY_OF_YEAR, -6)
        calendar.set(Calendar.HOUR_OF_DAY, 0)
        calendar.set(Calendar.MINUTE, 0)
        val startTime = calendar.timeInMillis

        val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val totalUnlocks = countUnlocks(usageStatsManager, startTime, endTime)

        return mapOf(
            "totalHours" to (Math.round(totalHours * 10) / 10.0),
            "avgHours" to (Math.round(avgHours * 10) / 10.0),
            "totalUnlocks" to totalUnlocks,
            "dailyData" to dailyData
        )
    }

    private fun formatDateString(calendar: Calendar): String {
        val year = calendar.get(Calendar.YEAR)
        val month = String.format("%02d", calendar.get(Calendar.MONTH) + 1)
        val day = String.format("%02d", calendar.get(Calendar.DAY_OF_MONTH))
        return "$year-$month-$day"
    }

    private fun isUserApp(packageName: String, pm: PackageManager): Boolean {
        return try {
            val appInfo = pm.getApplicationInfo(packageName, 0)
            // Filter out system apps, but include common social/entertainment apps
            val isSystemApp = (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0
            val commonApps = listOf(
                "instagram", "youtube", "tiktok", "twitter", "facebook",
                "whatsapp", "snapchat", "reddit", "discord", "spotify",
                "netflix", "twitch", "telegram", "messenger", "pinterest",
                "chrome", "firefox", "opera", "brave", "edge", "samsung",
                "gmail", "outlook", "maps", "photos", "camera", "gallery"
            )
            val isCommonApp = commonApps.any { packageName.lowercase().contains(it) }

            !isSystemApp || isCommonApp
        } catch (e: Exception) {
            false
        }
    }

    private fun countUnlocks(usageStatsManager: UsageStatsManager, startTime: Long, endTime: Long): Int {
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1) {
                val events = usageStatsManager.queryEvents(startTime, endTime)
                var unlockCount = 0
                val event = android.app.usage.UsageEvents.Event()

                while (events.hasNextEvent()) {
                    events.getNextEvent(event)
                    // KEYGUARD_HIDDEN = 18 (screen unlocked)
                    if (event.eventType == 18) {
                        unlockCount++
                    }
                }
                unlockCount
            } else {
                0 // No data available for older Android versions
            }
        } catch (e: Exception) {
            0
        }
    }

    private fun getDayName(dayIndex: Int): String {
        return listOf("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat")[dayIndex]
    }

    private fun getInstalledAppsList(): List<Map<String, String>> {
        val pm = context.packageManager
        val intent = Intent(Intent.ACTION_MAIN, null)
        intent.addCategory(Intent.CATEGORY_LAUNCHER)

        val apps = pm.queryIntentActivities(intent, 0)

        return apps.mapNotNull { resolveInfo ->
            try {
                val packageName = resolveInfo.activityInfo.packageName
                val appName = resolveInfo.loadLabel(pm).toString()
                val icon = resolveInfo.loadIcon(pm)
                val iconBase64 = drawableToBase64(icon)

                // Filter out system apps (optional)
                val appInfo = pm.getApplicationInfo(packageName, 0)
                val isSystemApp = (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0

                // Include user apps and popular system apps
                val shouldInclude = !isSystemApp || isUserAppCached(packageName, pm)

                if (shouldInclude) {
                    mapOf(
                        "packageName" to packageName,
                        "appName" to appName,
                        "iconUrl" to iconBase64
                    )
                } else {
                    null
                }
            } catch (e: Exception) {
                null
            }
        }.sortedBy { it["appName"] }
    }

    private fun drawableToBase64(drawable: Drawable): String {
        val bitmap = when (drawable) {
            is BitmapDrawable -> drawable.bitmap
            else -> {
                val bitmap = Bitmap.createBitmap(
                    drawable.intrinsicWidth,
                    drawable.intrinsicHeight,
                    Bitmap.Config.ARGB_8888
                )
                val canvas = Canvas(bitmap)
                drawable.setBounds(0, 0, canvas.width, canvas.height)
                drawable.draw(canvas)
                bitmap
            }
        }

        val outputStream = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
        return "data:image/png;base64," + Base64.encodeToString(outputStream.toByteArray(), Base64.NO_WRAP)
    }
}
