import { Button } from "@/components/ui/button";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";

export default function PlaybackControls({
  currentAyah, ayahCount,
  isPlaying, autoPlay, setAutoPlay,
  goToPreviousAyah, goToNextAyah,
  playAyah, pauseAyah,
  selectedSurah,
}) {
  return (
    <div className="mt-4 flex items-center justify-center gap-3 p-3 bg-background-soft rounded-lg">
      <Button
        variant="outline"
        size="icon"
        onClick={goToPreviousAyah}
        disabled={currentAyah === 1}
      >
        <SkipBack className="w-4 h-4" />
      </Button>

      {isPlaying ? (
        <Button onClick={pauseAyah} size="lg" className="gap-2">
          <Pause className="w-5 h-5" />
          إيقاف
        </Button>
      ) : (
        <Button onClick={() => playAyah(selectedSurah, currentAyah)} size="lg" className="gap-2">
          <Play className="w-5 h-5" />
          تشغيل
        </Button>
      )}

      <Button
        variant="outline"
        size="icon"
        onClick={goToNextAyah}
        disabled={currentAyah === ayahCount}
      >
        <SkipForward className="w-4 h-4" />
      </Button>

      <div className="mr-4 flex items-center gap-2">
        <Button
          variant={autoPlay ? "default" : "outline"}
          size="sm"
          onClick={() => setAutoPlay(!autoPlay)}
          className="gap-2"
        >
          {autoPlay ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          {autoPlay ? "متصل" : "منفصل"}
        </Button>
      </div>
    </div>
  );
}
