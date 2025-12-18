import { offlineImages } from '@/lib/db/offlineImages';
import { useState, useEffect } from 'react';
import { Image as RNImage, View, ImageSourcePropType, LayoutChangeEvent, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useColorScheme } from '@/hooks/useColorScheme';

interface QuestionImageProps {
  uri: string;
  height?: number;
}

const QuestionImage = ({ uri, height = 200 }: QuestionImageProps) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const [intrinsicWidth, setIntrinsicWidth] = useState(0);
  const [intrinsicHeight, setIntrinsicHeight] = useState(0);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const imageSource: ImageSourcePropType = offlineImages[uri] || { uri };

  useEffect(() => {
    if (typeof imageSource === 'number') {
      const { width, height } = RNImage.resolveAssetSource(imageSource);
      setIntrinsicWidth(width);
      setIntrinsicHeight(height);
    } else if ('uri' in imageSource && imageSource.uri) {
      RNImage.getSize(
        imageSource.uri,
        (w, h) => {
          setIntrinsicWidth(w);
          setIntrinsicHeight(h);
        },
        (err) => {
          console.warn('Failed to get image size', err);
          setIntrinsicWidth(height);
          setIntrinsicHeight(height);
        }
      );
    }
  }, [imageSource]);

  const onLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  let finalHeight = height;
  let finalWidth = intrinsicWidth && intrinsicHeight
    ? (finalHeight * intrinsicWidth) / intrinsicHeight
    : containerWidth;

  if (finalWidth > containerWidth) {
    finalWidth = containerWidth;
    finalHeight = (finalWidth * intrinsicHeight) / intrinsicWidth;
  }

  return (
    <View style={styles.container} onLayout={onLayout}>
      {containerWidth > 0 && (
        <Image
          source={imageSource}
          style={{
            width: finalWidth,
            height: finalHeight,
            borderRadius: 8,
          }}
          contentFit="contain"
          // Only apply tintColor if you want to convert ONLY black to white
          // This converts all black pixels to white, preserving other colors
          // Remove this line if you want to keep images as-is in dark mode
          tintColor={isDark ? '#FFFFFF' : undefined}
          accessibilityLabel="Фото до питання"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
});

export default QuestionImage;






// import { offlineImages } from '@/lib/db/offlineImages';
// import { useState, useEffect } from 'react';
// import { Image, View, ImageSourcePropType, LayoutChangeEvent, StyleSheet } from 'react-native';

// interface QuestionImageProps {
//   uri: string;
//   height?: number; 
// }

// const QuestionImage = ({ uri, height = 200 }: QuestionImageProps) => {
//   const [containerWidth, setContainerWidth] = useState(0);
//   const [intrinsicWidth, setIntrinsicWidth] = useState(0);
//   const [intrinsicHeight, setIntrinsicHeight] = useState(0);

//   const imageSource: ImageSourcePropType = offlineImages[uri] || { uri };

//   useEffect(() => {
//     if (typeof imageSource === 'number') {
//       const { width, height } = Image.resolveAssetSource(imageSource);
//       setIntrinsicWidth(width);
//       setIntrinsicHeight(height);
//     } else if ('uri' in imageSource && imageSource.uri) {
//       Image.getSize(
//         imageSource.uri,
//         (w, h) => {
//           setIntrinsicWidth(w);
//           setIntrinsicHeight(h);
//         },
//         (err) => {
//           console.warn('Failed to get image size', err);
//           setIntrinsicWidth(height);
//           setIntrinsicHeight(height);
//         }
//       );
//     }
//   }, [imageSource]);

//   const onLayout = (e: LayoutChangeEvent) => {
//     setContainerWidth(e.nativeEvent.layout.width);
//   };

//   let finalHeight = height;
//   let finalWidth = intrinsicWidth && intrinsicHeight
//     ? (finalHeight * intrinsicWidth) / intrinsicHeight
//     : containerWidth;

//   if (finalWidth > containerWidth) {
//     finalWidth = containerWidth;
//     finalHeight = (finalWidth * intrinsicHeight) / intrinsicWidth;
//   }

//   return (
//     <View style={styles.container} onLayout={onLayout}>
//       {containerWidth > 0 && (
//         <Image
//           source={imageSource}
//           style={{
//             width: finalWidth,
//             height: finalHeight,
//             resizeMode: 'contain',
//             borderRadius: 8,
//           }}
//           accessibilityLabel="Фото до питання"
//         />
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     width: '100%',
//     overflow: 'hidden',
//     borderRadius: 8,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 16
//   },
// });

// export default QuestionImage;








// import { useEffect, useState } from 'react';
// import { Image, LayoutChangeEvent, View } from 'react-native';
// import * as FileSystem from "expo-file-system";


// const OFFLINE_IMAGES_DIR = `${FileSystem.documentDirectory}SQLite/images/`;

// const QuestionImage = ({ uri, height }: { uri: string; height: number }) => {
//   const [aspectRatio, setAspectRatio] = useState<number | null>(null);
//   const [containerWidth, setContainerWidth] = useState<number>(0);

//   let finalUri = uri;
//   if (uri && /^[a-f0-9-]+\.jpg$/i.test(uri)) {
//     finalUri = OFFLINE_IMAGES_DIR + uri;
//   }

//   useEffect(() => {
//     if (!finalUri) return;

//     Image.getSize(
//       finalUri,
//       (imgWidth, imgHeight) => {
//         const ratio = imgWidth / imgHeight;
//         setAspectRatio(ratio);
//       },
//       (err) => {
//         console.warn('Image load failed:', err);
//         setAspectRatio(1);
//       }
//     );
//   }, [finalUri]);

//   const onLayout = (e: LayoutChangeEvent) => {
//     setContainerWidth(e.nativeEvent.layout.width);
//   };

//   if (!aspectRatio || containerWidth === 0) return (
//     <View onLayout={onLayout} />
//   );

//   let calculatedHeight = height ?? 200;
//   let calculatedWidth = calculatedHeight * aspectRatio;

//   if (calculatedWidth >= containerWidth) {
//     calculatedWidth = containerWidth;
//     calculatedHeight = containerWidth / aspectRatio;
//   }

// //   const calculatedWidth =
// //     aspectRatio && calculatedHeight * aspectRatio < screenWidth
// //       ? calculatedHeight * aspectRatio
// //       : '100%';

//   return (
//     <Image
//       source={{ uri: finalUri }}
//       style={{
//         height: calculatedHeight,
//         width: calculatedWidth,
//         resizeMode: 'contain',
//         borderRadius: 8,
//       }}
//       accessibilityLabel="Фото до питання"
//     />
//   );
// };

// export default QuestionImage;





// import { useEffect, useState } from 'react';
// import { Image, LayoutChangeEvent, View } from 'react-native';
// import * as FileSystem from "expo-file-system";


// const OFFLINE_IMAGES_DIR = `${FileSystem.documentDirectory}SQLite/images/`;

// const QuestionImage = ({ uri, height }: { uri: string; height: number }) => {
//   const [aspectRatio, setAspectRatio] = useState<number | null>(null);
//   const [containerWidth, setContainerWidth] = useState<number>(0);

//   let finalUri = uri;
//   if (uri && /^[a-f0-9-]+\.jpg$/i.test(uri)) {
//     finalUri = OFFLINE_IMAGES_DIR + uri;
//   }

//   useEffect(() => {
//     if (!finalUri) return;

//     Image.getSize(
//       finalUri,
//       (imgWidth, imgHeight) => {
//         const ratio = imgWidth / imgHeight;
//         setAspectRatio(ratio);
//       },
//       (err) => {
//         console.warn('Image load failed:', err);
//         setAspectRatio(1);
//       }
//     );
//   }, [finalUri]);

//   const onLayout = (e: LayoutChangeEvent) => {
//     setContainerWidth(e.nativeEvent.layout.width);
//   };

//   if (!aspectRatio || containerWidth === 0) return (
//     <View onLayout={onLayout} />
//   );

//   let calculatedHeight = height ?? 200;
//   let calculatedWidth = calculatedHeight * aspectRatio;

//   if (calculatedWidth >= containerWidth) {
//     calculatedWidth = containerWidth;
//     calculatedHeight = containerWidth / aspectRatio;
//   }

// //   const calculatedWidth =
// //     aspectRatio && calculatedHeight * aspectRatio < screenWidth
// //       ? calculatedHeight * aspectRatio
// //       : '100%';

//   return (
//     <Image
//       source={{ uri: finalUri }}
//       style={{
//         height: calculatedHeight,
//         width: calculatedWidth,
//         resizeMode: 'contain',
//         borderRadius: 8,
//       }}
//       accessibilityLabel="Фото до питання"
//     />
//   );
// };

// export default QuestionImage;