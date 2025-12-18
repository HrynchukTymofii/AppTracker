import { UserType } from "@/context/AuthContext";
import { getUserData, upgradeToSync } from "./api/user";
import { useUserDatabase } from "./db/fetchDb";
import { useQuizDatabase } from "./db/quiz";
import { checkAppNeedSync, checkForQuizUpdates } from "./api/quiz";
import { Alert } from "react-native";
import { router } from "expo-router";


interface LoadUserOptions {
  token: string;
  setUser: (user: UserType) => void;
  forceSync?: boolean;
}


export function useLoadUserInBackground() {
  const { fetchAndStoreUserData } = useUserDatabase();
  const { applyAllQuizUpdatesLocally, fetchLocalQuizTimestamps  } = useQuizDatabase();

  const handleCheckForUpdates = async (token: string) => {
    try {
      if (!token) {
        router.replace("/login");
        return;
      }

      const localUpdatedAt = await fetchLocalQuizTimestamps();
      //console.log("Local timestamps:", JSON.stringify(localUpdatedAt));

      const res = await checkForQuizUpdates(token, localUpdatedAt);
      if (!res || !res.updates?.length) {
        // Alert.alert("✅ All quizzes are up to date.");
        return;
      }

      //console.log(JSON.stringify(res.updates))

      const applied = await applyAllQuizUpdatesLocally(res.updates);
      // if (applied.success) {
      //   // Alert.alert("✅ Update Complete", "Your quizzes and questions are now synced!");
      // } else {
      //   Alert.alert("❌ Update failed", applied.error || "Unknown error");
      // }
    } catch (error) {
      console.error("Error in handleCheckForUpdates:", error);
      // Alert.alert("⚠️ Update Error", "Something went wrong while checking for updates.");
    }
  };

  async function loadUserInBackground(
    { token, forceSync = false, setUser }: LoadUserOptions)
  {
    try {
      const res = await getUserData(token);

      if (res.success) {
        const mappedUser: UserType = {
          ...res.user,
          categories: res.user.league,
        };
        setUser(mappedUser);

        if (forceSync || res.user.needSync) {
          //console.log('here')
          await fetchAndStoreUserData(token);
          await upgradeToSync(token);
          const res = await checkAppNeedSync(); 
            //console.log(res)
            if (res?.app?.needSync) {
              handleCheckForUpdates(token);
            }
          }
      } else {
        console.error("Failed to load user:", res.error);
      }
    } catch (err) {
      console.error("Error loading user:", err);
    }
  }
  
  return { loadUserInBackground };
}


// export const loadUserInBackground = async ({token, forceSync = false, setUser}: LoadUserOptions ) => {
//     // const { fetchAndStoreUserData } = useUserDatabase();
//     try {
//       const res = await getUserData(token);

//       if (res.success) {
//         const mappedUser: UserType = {
//           ...res.user,
//           categories: res.user.league,
//         };
//         setUser(mappedUser);

//         //console.log(res.user.needSync)

//         if (forceSync || res.user.needSync) {
//           await fetchAndStoreUserData(token);

//           await upgradeToSync(token);
//           //console.log('user loaded')
//         } //else{
//         //     console.log('no need for user to be loaded')
//         // }
        
//       } else {
//         console.error("Failed to load user:", res.error);
//       }
//     } catch (err) {
//       console.error("Error loading user:", err);
//     }
//   };