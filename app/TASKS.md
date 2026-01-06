# LockIn App - Tasks & Bug Fixes

> Last updated: December 31, 2025

---

## iOS Tasks

### Bugs
- [ ] Check streak counting ios
- [ ] Fix the app limit iOS
- [ ] Fix styles in the user page ios
- [ ] Fix the stats in the user page ios
- [ ] Check the localization ios
- [ ] Check if the goal saves to show the charts and stats ios
- [ ] Check the coach chat in the ios
- [ ] Fix the accuracy of exercises ios

### Features
- [ ] Add Focus mode iOS (all apps are blocked)
- [ ] Move the Photo Task to the top iOS
- [ ] Move the Input to the top of the Photo Task
- [ ] Add the save task for the input (like with the before after photos)
- [ ] Enhance the talk with the GPT ios
- [ ] Remove the task in progress card as soon as the task done (no need for refresh the page)
- [ ] Remove the selected apps in the goals ios
- [ ] Make share in the stats page ios
- [ ] Add logic for achievements ios
- [ ] Reduce the max time of the daily goal ios
- [ ] Move unblock window to the top ios
- [ ] Add contact us logic ios
- [ ] Add rate us logic ios
- [ ] Add more languages ios
- [ ] Remove the screen time in the settings ios
- [ ] Remove full reset button settings ios
- [ ] Add notification toggle ios in settings
- [ ] Improve the help in the home page ios
- [ ] Move everything up a little in the auth page ios
- [ ] Create new onboarding movement inspired by the other apps ios
- [ ] Make the routing from the notification to the necessary page ios
- [ ] Make the widgets for the ios

### Design
- [ ] Change the icons for the exercises ios
- [ ] Redesign the achievements like those in the screenshots
- [ ] Make the button/chart color match the theme color palette ios

---

## Android Tasks

### Bugs
- [ ] Check streak counting android
- [ ] Fix the app choosing android - it is glitching, add loader
- [ ] Make app limits on the goals page load instantly, no need for restart the app android
- [ ] Remove the mock data from the stats - if there is no data then there is no data android
- [ ] Fix the error in the app shield screen android (Looks like you have configured linking in multiple places. This is likely an error since deep links should only be handled in one place to avoid conflicts. Make sure that: You don't have multiple NavigationContainers in the app each with 'linking' enabled Only a single instance of the root component is renderedYou have set 'android:launchMode=singleTask' in the '<activity />' section of the 'AndroidManifest.xml' file to avoid launching multiple instances
- [ ] Fix the +171 = 17.1 min in the activities lockin page android
- [ ] Fix the remembering Today progress in the goals page for the chart android
- [ ] The black screen when enter the LockIn app after the blocked app android
- [ ] Have been 2min in TikTok the earned minutes did not change android

### Features
- [x] Add the choose the goal in the android onboarding ✅
- [x] Add the earned time to the health calc android ✅
- [x] Remove the week stats in the bottom of the Today progress card in the index.tsx android and remove the big green button earn more time (and there should not be a gol to earn time  the goal only to spend time like in the goals page) ✅
- [ ] Add photos to the help in the index.tsx android
- [x] Redesign the contact us in the profile page, add the email android ✅
- [x] Make the set default app limit options smaller and make more options for the goal android ✅
- [x] Add the logic for the achievements ✅
- [ ] Add more languages android
- [ ] Add the logic for the in-profile stats
- [x] Make not all tasks have the before photo - OpenAI should decide android (book reading/clean room should have, but workout/cook meal do not need before) ✅
- [ ] Make the widgets for the android

### Design
- [ ] Redesign the script of the onboarding android
- [ ] Add cool slick animations and expensive style android
- [ ] Add videos to the permission grants android
- [ ] Change the enable accessibility to be not so frightening android
- [x] Redesign the share stats android ✅
- [x] Redesign the achievements to the screenshot I have android ✅
- [x] Redesign the shield screen android - the earn time and coach ✅
- [x] Add more blur to the great job on video android ✅
- [x] Make the button and blue color follow the palette chosen in the settings android ✅

---

## iOS & Android (Both Platforms)

### Bugs
- [ ] Fix the coach conversation ios/android (for the coach in the app shield i need to have the simple conversation like one explanation and the gpt give permission or does not that is all  if it does not give the permission   the user can demand it   so user can send max 2 messages                                      for the Photo task verification there shoul be also max 2 answers for the gpt       it is or sussessful and the user gets his/her minutes     or not shure user gets the half  or not successsful than the secon message determines the result  for example user send 2 identical photos of the room and the gpt sad that you did not done anithing     and the user have only one chanse to explain  after this the final verdict no long conversations with the same quiestons form the gpt)

### Features
- [ ] Fix the PP and ToS in the lockin ios/android
- [ ] Add action for the uninstall menu ios/android with the link to the discount plan
- [ ] Add the examples of the exercise completion for user to understand ios/android

---

## Marketing & Store

- [ ] Create cool icon
- [ ] Create the iOS screenshots/creatives
- [ ] Create Android creatives
- [ ] Write the description for the app store
- [ ] Get the family controls entitlements for the all 4 extensions bundle ids

---

## Monetization

- [ ] Review the notification flow
- [ ] Add discount plan

---

## Summary

| Platform | Not Started | In Progress | Done |
|----------|-------------|-------------|------|
| iOS      | 28          | 0           | 0    |
| Android  | 17          | 0           | 12   |
| Both     | 3           | 0           | 1    |
| Other    | 7           | 0           | 0    |
| **Total**| **55**      | **0**       | **13**|
