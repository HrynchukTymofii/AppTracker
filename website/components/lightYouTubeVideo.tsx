"use client"

import LiteYouTubeEmbed from 'react-lite-youtube-embed';
import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css';

const LessonYouTubeVideo = ({
  youTubeVideoUrl,
}: {
  youTubeVideoUrl: string;
}) => {
  const getYouTubeVideoId = (url: string) => {
    const match = url.match(
      /(?:https?:\/\/)?(?:www\.)?youtu(?:be\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|\.be\/)([^"&?/\s]{11})/
    );
    return match ? match[1] : null;
  };

  const videoId = getYouTubeVideoId(youTubeVideoUrl);

  //console.log(videoId);

  return (
    <div className="relative aspect-video">
      {videoId ? (
        <LiteYouTubeEmbed
          aspectHeight={9}
          aspectWidth={16}
          id={videoId}
          title="YouTube Video"
          params="modestbranding=1&rel=0"
          noCookie={true}
        />
      ) : (
        <div className="text-sm text-red-500">
          Invalid YouTube URL. Please edit the video URL.
        </div>
      )}
    </div>
  );
};

export default LessonYouTubeVideo;
