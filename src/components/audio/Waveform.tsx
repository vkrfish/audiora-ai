import { cn } from "@/lib/utils";

interface WaveformProps {
  isPlaying?: boolean;
  className?: string;
  barCount?: number;
}

const Waveform = ({ isPlaying = false, className, barCount = 5 }: WaveformProps) => {
  return (
    <div className={cn("flex items-center gap-0.5 h-4", className)}>
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-1 rounded-full transition-all duration-200",
            isPlaying ? "waveform-bar" : "bg-waveform-inactive h-1"
          )}
          style={{
            height: isPlaying ? `${40 + Math.random() * 60}%` : '25%',
            animationDelay: `${i * 0.1}s`
          }}
        />
      ))}
    </div>
  );
};

export default Waveform;
