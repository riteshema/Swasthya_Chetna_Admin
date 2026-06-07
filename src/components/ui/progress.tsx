import { type JSX } from "react";

interface ProgressProps {
  type?: "linear" | "circular";
  className?: string;
}

export default function Progress({
  type = "circular",
  className,
}: Readonly<ProgressProps>): JSX.Element {
  return (
    <div className={className}>
      {type === "linear" ? (
        <div className={`w-full`}>
          <div className="linear-progress-bar">
            <div className="linear-progress-bar-value"></div>
          </div>
        </div>
      ) : (
        <progress className="circular-progress-bar" />
      )}
    </div>
  );
}
