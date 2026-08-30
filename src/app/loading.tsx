import { Spinner } from "@/components/Spinner";

export default function RootLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas">
      <Spinner className="h-6 w-6 text-indigo" />
    </div>
  );
}
