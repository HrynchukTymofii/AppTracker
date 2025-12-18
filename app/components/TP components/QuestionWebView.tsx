// import { useRef, useEffect } from 'react';
// import AutoHeightWebView from 'react-native-autoheight-webview';

// function QuestionWebView({ uri, isDark }: {uri: string, isDark: string}) {
//   const webViewRef = useRef(null);

//   useEffect(() => {
//     return () => {
//       // Clean up native WebView instance
//       webViewRef.current?.destroy?.();
//     };
//   }, []);

//   return (
//     <AutoHeightWebView
//       ref={webViewRef}
//       source={{ uri }}
//       scrollEnabled={false}
//       customStyle={
//         isDark
//           ? `html, body { background-color: #0f172a; color: #f5f5f4; margin:0;} *{background-color:inherit;color:inherit}`
//           : ''
//       }
//     />
//   );
// }
