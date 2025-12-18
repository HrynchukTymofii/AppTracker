import React, { useState } from "react";
import { View } from "react-native";
import { WebView } from "react-native-webview";

interface Question {
  id: string | number;
}

interface QuestionViewProps {
  chapterId: string | number;
  quizId: string | number;
  question: Question;
}

export default function QuestionView({ chapterId, quizId, question }: QuestionViewProps) {
  const [webViewHeight, setWebViewHeight] = useState(200);

  const injectedJS = `
    function sendHeight() {
      const height = document.documentElement.scrollHeight || document.body.scrollHeight;
      window.ReactNativeWebView.postMessage(height);
    }
    window.addEventListener("load", sendHeight);
    window.addEventListener("resize", sendHeight);
    setTimeout(sendHeight, 500);
    true;
  `;

  return (
    <View style={{ flex: 1 }}>
      <WebView
        source={{
          uri: `https://www.satlearner.com/expo-course/${chapterId}/quizzes/${quizId}/question/${question.id}`,
        }}
        style={{ width: "100%"}}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
      />
    </View>
  );
}
